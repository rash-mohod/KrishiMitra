import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env.js';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 6;
const MAX_TOOL_ROUNDS = 1;
const REQUEST_TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `You are KrishiMitra Assistant, a helpful multilingual AI assistant for the KrishiMitra farm equipment rental platform.

Help with equipment discovery, rental pricing, booking steps, booking amount, platform fee, remaining rental payment, availability, booking status, payment status, profile/account features, and app navigation.

Understand Marathi, Romanized Marathi, Hindi, Romanized Hindi, Hinglish, Marathi-English, Hindi-English, English, informal spelling, and short farmer-style messages. Reply naturally in the user's language/style. Keep answers simple, friendly, concise and practical.

KrishiMitra payment rules:
- Owner chooses the booking amount for each equipment.
- Booking amount may be ₹0 up to 20% of the actual total rental amount.
- Platform fee is based on total rental amount: ₹0→₹0; ₹1–₹499→₹5; ₹500–₹999→₹10; ₹1,000–₹1,499→₹15; ₹1,500–₹1,999→₹20; ₹2,000–₹2,499→₹25; ₹2,500–₹2,999→₹30; ₹3,000–₹3,499→₹35; ₹3,500–₹3,999→₹40; ₹4,000–₹4,499→₹45; ₹4,500+→₹50 maximum.
- Farmer pays booking amount + KrishiMitra platform fee online through Razorpay.
- Remaining rental amount is paid directly to the owner by cash or UPI.
- Security deposit is separate from rental payment.

Never invent equipment, availability, prices, booking status, payment status, owner information, farmer information, rental totals, booking amounts, platform fees or remaining payments. For exact application data, use only the provided KrishiMitra tools. If exact live data is not available, say so honestly.

Never reveal passwords, access tokens, refresh tokens, API keys, service-role keys, payment secrets, or private information belonging to another user. Never execute SQL and never claim direct database access.

Version 1 is read-only. Never create, cancel, approve, reject or modify bookings, payments, profiles, equipment, messages or database records.

Do not behave like a general-purpose chatbot. For unrelated questions, politely redirect the user to KrishiMitra-related help.

When exact dates or equipment details are needed, ask a short clarifying question instead of guessing.`;

const toolDeclarations = [
  {
    type: 'function',
    name: 'searchEquipment',
    description: 'Search approved, active and currently available KrishiMitra equipment using real application data. Use when the user asks for a specific type, brand, model or machinery.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Equipment name, category, brand, model or search phrase.' },
        state: { type: 'string', description: 'Optional state filter.' },
        district: { type: 'string', description: 'Optional district filter.' },
        maxResults: { type: 'number', description: 'Maximum number of results, from 1 to 5.' }
      },
      required: ['query']
    }
  },
  {
    type: 'function',
    name: 'listAvailableEquipment',
    description: 'Lists currently approved, active and available equipment. Use when the user asks what equipment is available without naming one specific machine.',
    parameters: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Optional state filter.' },
        district: { type: 'string', description: 'Optional district filter.' },
        maxResults: { type: 'number', description: 'Maximum number of results, from 1 to 10.' }
      }
    }
  },
  {
    type: 'function',
    name: 'listAvailableLocations',
    description: 'Lists locations where approved, active and currently available equipment exists. Use for questions such as where equipment is available.',
    parameters: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Optional state filter.' }
      }
    }
  },
  {
    type: 'function',
    name: 'calculateRental',
    description: 'Calculates the real KrishiMitra rental total, platform fee, booking amount and remaining rental amount for one equipment item and date range.',
    parameters: {
      type: 'object',
      properties: {
        equipmentId: { type: 'string', description: 'KrishiMitra equipment ID.' },
        startDate: { type: 'string', description: 'Rental start date in YYYY-MM-DD format.' },
        endDate: { type: 'string', description: 'Rental end date in YYYY-MM-DD format.' },
        operatorIncluded: { type: 'boolean', description: 'Whether the optional operator is included.' }
      },
      required: ['equipmentId', 'startDate', 'endDate']
    }
  },
  {
    type: 'function',
    name: 'checkAvailability',
    description: 'Checks whether a specific KrishiMitra equipment item is available for a requested date range.',
    parameters: {
      type: 'object',
      properties: {
        equipmentId: { type: 'string', description: 'KrishiMitra equipment ID.' },
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format.' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format.' }
      },
      required: ['equipmentId', 'startDate', 'endDate']
    }
  },
  {
    type: 'function',
    name: 'getBookingStatus',
    description: 'Gets the authenticated user\'s permitted booking status and safe booking summary.',
    parameters: {
      type: 'object',
      properties: { bookingId: { type: 'string', description: 'Booking ID or booking code if known.' } },
      required: ['bookingId']
    }
  },
  {
    type: 'function',
    name: 'getPaymentStatus',
    description: 'Gets the authenticated user\'s permitted payment status and safe payment summary for a booking.',
    parameters: {
      type: 'object',
      properties: { bookingId: { type: 'string', description: 'Booking ID.' } },
      required: ['bookingId']
    }
  }
] as any[];

function safeHistory(conversation: Array<{ role: string; content: string }> = []) {
  return conversation
    .filter(item => (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .slice(-MAX_HISTORY_ITEMS)
    .map(item => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content.slice(0, 800)}`)
    .join('\n');
}

function extractFunctionCalls(interaction: any): any[] {
  return Array.isArray(interaction?.steps)
    ? interaction.steps.filter((step: any) => step?.type === 'function_call')
    : [];
}

function needsLiveData(message: string) {
  const text = message.toLowerCase();
  const liveWords = [
    'available', 'availability', 'location', 'where', 'which equipment', 'what equipment', 'tractor', 'harvester',
    'rotavator', 'cultivator', 'seeder', 'sprayer', 'plough', 'trolley', 'trailer', 'thresher', 'machine',
    'machinery', 'equipment', 'price', 'rate', 'cost', 'rent', 'rental', 'kitna', 'kiti', 'paisa', 'rupaye',
    'कितना', 'किती', 'उपलब्ध', 'मशीन', 'ट्रैक्टर', 'उपकरण', 'कुठे', 'कोठे', 'कुठल्या', 'किती'
  ];
  const statusWords = ['booking status', 'payment status', 'booking #', 'booking id', 'payment #'];
  return liveWords.some(word => text.includes(word)) || statusWords.some(word => text.includes(word));
}

function isRateLimitError(error: any) {
  const status = Number(error?.status ?? error?.response?.status ?? error?.cause?.status ?? 0);
  const message = String(error?.message ?? error?.cause?.message ?? '').toLowerCase();
  return status === 429 || message.includes('429') || message.includes('resource_exhausted') || message.includes('rate limit') || message.includes('quota');
}

function isTransientError(error: any) {
  const status = Number(error?.status ?? error?.response?.status ?? error?.cause?.status ?? 0);
  return status >= 500 || status === 408 || status === 429;
}

async function createInteraction(ai: GoogleGenAI, payload: any) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(Object.assign(new Error('GEMINI_TIMEOUT'), { code: 'GEMINI_TIMEOUT' })), REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([ai.interactions.create(payload), timeout]);
  } catch (error: any) {
    if (error?.code === 'GEMINI_TIMEOUT') throw error;
    throw error;
  }
}

function fallbackFromToolResult(message: string, toolName: string, result: any) {
  const text = message.toLowerCase();
  if (toolName === 'listAvailableLocations') {
    const locations = Array.isArray(result?.locations) ? result.locations : [];
    if (!locations.length) return 'I could not find any currently available equipment locations right now. Please try again shortly.';
    return `Currently available equipment locations: ${locations.join(', ')}.`;
  }
  if (toolName === 'listAvailableEquipment' || toolName === 'searchEquipment') {
    const items = Array.isArray(result?.items) ? result.items : [];
    if (!items.length) return 'I could not find matching equipment that is currently available.';
    return items.slice(0, 5).map((item: any) => `• ${item.name}${item.brand ? ` (${item.brand})` : ''} — ₹${item.pricePerDay}/day${item.district ? ` — ${item.district}` : item.location ? ` — ${item.location}` : ''}`).join('\n');
  }
  if (toolName === 'calculateRental') {
    if (result?.error) return String(result.error);
    return `Rental estimate: ${result.durationDays} day(s), total rental ₹${result.totalRentalAmount}, booking amount ₹${result.bookingAmount}, platform fee ₹${result.platformFee}, remaining rental ₹${result.remainingRentalAmount}.`;
  }
  if (text.includes('available')) return 'I could not complete the live availability check right now. Please try again in a moment.';
  return 'I could not complete the live KrishiMitra data check right now. Please try again in a moment.';
}

export interface GeminiChatInput {
  message: string;
  conversation?: Array<{ role: string; content: string }>;
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export async function generateKrishiMitraResponse(input: GeminiChatInput): Promise<string> {
  if (!ENV.GEMINI_API_KEY) throw new Error('GEMINI_NOT_CONFIGURED');

  const message = input.message.trim();
  if (!message) throw new Error('EMPTY_MESSAGE');
  if (message.length > MAX_MESSAGE_LENGTH) throw new Error('MESSAGE_TOO_LONG');

  const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  const historyText = safeHistory(input.conversation);
  const firstInput = `${historyText ? `Recent conversation:\n${historyText}\n\n` : ''}Current user message:\n${message}`;
  const useTools = needsLiveData(message);
  const interactionHistory: any[] = [{ type: 'user_input', content: [{ type: 'text', text: firstInput }] }];
  let lastToolName = '';
  let lastToolResult: any = null;

  for (let round = 0; round < (useTools ? MAX_TOOL_ROUNDS + 1 : 1); round += 1) {
    try {
      const interaction: any = await createInteraction(ai, {
        model: ENV.GEMINI_MODEL,
        input: interactionHistory,
        system_instruction: SYSTEM_INSTRUCTION,
        ...(useTools ? { tools: toolDeclarations } : {}),
        store: false
      });

      const calls = extractFunctionCalls(interaction);
      if (!calls.length) {
        const output = String(interaction?.output_text ?? '').trim();
        return output || 'Sorry, I could not generate a response right now. Please try again.';
      }

      if (round >= MAX_TOOL_ROUNDS) break;
      interactionHistory.push(...(Array.isArray(interaction.steps) ? interaction.steps : []));

      for (const call of calls.slice(0, 3)) {
        lastToolName = String(call.name);
        try {
          const args = call.arguments && typeof call.arguments === 'object' ? call.arguments : {};
          lastToolResult = await input.executeTool(lastToolName, args);
          interactionHistory.push({
            type: 'function_result',
            name: lastToolName,
            call_id: String(call.id),
            result: [{ type: 'text', text: JSON.stringify(lastToolResult) }]
          });
        } catch {
          lastToolResult = { error: 'Tool could not retrieve the requested application data.' };
          interactionHistory.push({
            type: 'function_result',
            name: lastToolName,
            call_id: String(call.id),
            result: [{ type: 'text', text: JSON.stringify(lastToolResult) }]
          });
        }
      }
    } catch (error: any) {
      // If live data was already retrieved, do not throw away the useful result just
      // because the final Gemini wording turn failed. Return a safe deterministic
      // answer instead. This is especially helpful on free-tier rate spikes.
      if (lastToolResult !== null) {
        return fallbackFromToolResult(message, lastToolName, lastToolResult);
      }
      if (isRateLimitError(error)) throw new Error('GEMINI_RATE_LIMITED');
      if (error?.code === 'GEMINI_TIMEOUT') throw new Error('GEMINI_TIMEOUT');
      if (isTransientError(error)) throw new Error('GEMINI_UNAVAILABLE');
      const wrapped: any = new Error('GEMINI_REQUEST_FAILED');
      wrapped.cause = error;
      throw wrapped;
    }
  }

  // If Gemini's second turn fails outside the loop, the caller still gets a useful
  // deterministic response from the live tool result instead of a blank chatbot.
  return fallbackFromToolResult(message, lastToolName, lastToolResult);
}
