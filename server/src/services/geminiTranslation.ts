import { ENV } from '../config/env.js';

const LANGUAGE_NAMES: Record<string, { name: string; script: string }> = {
  en: { name: 'English', script: 'Latin' },
  hi: { name: 'Hindi', script: 'Devanagari (हिन्दी)' },
  mr: { name: 'Marathi', script: 'Devanagari (मराठी)' },
  pa: { name: 'Punjabi', script: 'Gurmukhi (ਪੰਜਾਬੀ)' },
  te: { name: 'Telugu', script: 'Telugu script (తెలుగు)' },
  ta: { name: 'Tamil', script: 'Tamil script (தமிழ்)' },
  kn: { name: 'Kannada', script: 'Kannada script (ಕನ್ನಡ)' },
  gu: { name: 'Gujarati', script: 'Gujarati script (ગુજરાતી)' },
  bn: { name: 'Bengali', script: 'Bengali script (বাংলা)' }
};

const serverCache = new Map<string, string>();
const MAX_CACHE_SIZE = 15000;

export interface GeminiTranslationResult {
  translations: string[];
  translated: boolean[];
}

function makeCacheKey(sourceLang: string, targetLang: string, text: string): string {
  return `${sourceLang.toLowerCase()}:${targetLang.toLowerCase()}:${text.trim()}`;
}

export function getCachedTranslation(
  sourceLang: string,
  targetLang: string,
  text: string
): string | undefined {
  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return text;
  return serverCache.get(makeCacheKey(sourceLang, targetLang, text));
}

export function setCachedTranslation(
  sourceLang: string,
  targetLang: string,
  text: string,
  translation: string
): void {
  if (serverCache.size >= MAX_CACHE_SIZE) {
    const iter = serverCache.keys();

    for (let i = 0; i < 1000; i++) {
      const next = iter.next();
      if (next.done) break;
      serverCache.delete(next.value);
    }
  }

  serverCache.set(makeCacheKey(sourceLang, targetLang, text), translation);
}

function fallbackResult(texts: string[]): GeminiTranslationResult {
  return {
    translations: [...texts],
    translated: texts.map(() => false)
  };
}

/**
 * Translates a batch of unique UI strings using Google Gemini.
 *
 * `translated[i]` is true only when the returned value is a genuine
 * translation (or a valid cached/same-language result handled by the caller).
 * It is false when this service had to fall back to the original source text.
 *
 * This distinction prevents temporary Gemini failures from poisoning either
 * the server cache or the browser cache with English fallback values.
 */
export async function translateTextsWithGemini(
  sourceLang: string,
  targetLang: string,
  texts: string[]
): Promise<GeminiTranslationResult> {
  if (!texts.length) {
    return { translations: [], translated: [] };
  }

  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
    return {
      translations: [...texts],
      translated: texts.map(() => true)
    };
  }

  const apiKey = ENV.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[TranslationService] GEMINI_API_KEY is not configured; returning source text without caching it.');
    return fallbackResult(texts);
  }

  const model = ENV.GEMINI_MODEL || 'gemini-3.5-flash';
  const targetMeta =
    LANGUAGE_NAMES[targetLang.toLowerCase()] || { name: targetLang, script: targetLang };
  const sourceMeta =
    LANGUAGE_NAMES[sourceLang.toLowerCase()] || { name: sourceLang, script: sourceLang };

  const prompt = `You are a professional software translator for KrishiMitra, an Indian agricultural equipment rental web platform.
Translate the following JSON array of ${texts.length} UI text strings from ${sourceMeta.name} into natural, high-quality ${targetMeta.name} (${targetMeta.script}).

RULES:
1. Return ONLY a valid JSON array of strings: ["translation 1", "translation 2", ...]
2. Output array length MUST be exactly ${texts.length}, in the identical order as input.
3. Preserve all placeholders like {name}, {count}, {amount}, {days}, {{value}} unchanged.
4. Preserve numbers, currency symbols (₹, Rs.), brand names (e.g. KrishiMitra, Mahindra, John Deere, Sonalika, Swaraj), and technical terms (e.g. HP, PTO, 4WD).
5. Translate natural-language UI text. Do not transliterate English UI phrases when a natural translation exists.
6. Do NOT add extra explanations or formatting outside the JSON array.

Input strings:
${JSON.stringify(texts)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000);

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(
        `[TranslationService] Gemini API returned status ${response.status}: ${errText.slice(0, 300)}`
      );
      return fallbackResult(texts);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn('[TranslationService] Empty response candidate from Gemini');
      return fallbackResult(texts);
    }

    let parsed: any;

    try {
      parsed = JSON.parse(candidateText);
    } catch {
      const clean = candidateText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      try {
        parsed = JSON.parse(clean);
      } catch (parseError) {
        console.warn('[TranslationService] Gemini returned invalid JSON:', parseError);
        return fallbackResult(texts);
      }
    }

    if (!Array.isArray(parsed) || parsed.length !== texts.length) {
      console.warn(
        `[TranslationService] Parsed result length mismatch: expected ${texts.length}, got ${
          Array.isArray(parsed) ? parsed.length : 'non-array'
        }`
      );
      return fallbackResult(texts);
    }

    const translations = texts.map((sourceText, idx) => {
      const item = parsed[idx];
      return typeof item === 'string' && item.trim() ? item : sourceText;
    });

    const translated = texts.map((sourceText, idx) => {
      const item = parsed[idx];
      return typeof item === 'string' && item.trim().length > 0;
    });

    return { translations, translated };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      console.warn(
        '[TranslationService] Gemini translation request timed out; returning source text without caching it.'
      );
    } else {
      console.warn(
        '[TranslationService] Gemini translation error:',
        err?.message || err
      );
    }

    return fallbackResult(texts);
  }
}
