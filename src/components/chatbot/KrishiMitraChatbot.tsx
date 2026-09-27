import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Check, ChevronDown, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { aiApi, AiChatMessage } from '../../services/api';

const MAX_MESSAGE_LENGTH = 1000;
const LANGUAGE_KEY = 'km_ai_preferred_language_v2';

type PreferredLanguage = 'marathi' | 'hindi' | 'english';

const languageOptions: Array<{ id: PreferredLanguage; label: string; native: string; flag: string }> = [
  { id: 'marathi', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { id: 'hindi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { id: 'english', label: 'English', native: 'English', flag: '🌐' }
];

const suggestionsByLanguage: Record<PreferredLanguage, string[]> = {
  marathi: [
    'मला ट्रॅक्टर पाहिजे',
    'बुकिंग कसं करायचं?',
    'पेमेंट कसं करायचं?',
    'प्लॅटफॉर्म फी किती आहे?',
    '2 दिवसांसाठी equipment कितीला पडेल?'
  ],
  hindi: [
    'मुझे ट्रैक्टर चाहिए',
    'बुकिंग कैसे करें?',
    'पेमेंट कैसे करना है?',
    'प्लेटफॉर्म फीस कितनी है?',
    '2 दिन के लिए equipment कितने का पड़ेगा?'
  ],
  english: [
    'I need a tractor',
    'How do I book equipment?',
    'How do I make the payment?',
    'How much is the platform fee?',
    'How much will equipment cost for 2 days?'
  ]
};

const greetings: Record<PreferredLanguage, string> = {
  marathi: 'नमस्कार! 👋 मी KrishiMitra Assistant आहे. तुम्ही machinery, rental price, booking, payment किंवा availability बद्दल विचारू शकता.',
  hindi: 'नमस्ते! 👋 मैं KrishiMitra Assistant हूँ। आप machinery, rental price, booking, payment या availability के बारे में पूछ सकते हैं।',
  english: 'Hello! 👋 I am KrishiMitra Assistant. You can ask about machinery, rental prices, booking, payment or availability.'
};

function getSavedLanguage(): PreferredLanguage | null {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    return value === 'marathi' || value === 'hindi' || value === 'english' ? value : null;
  } catch {
    return null;
  }
}

export const KrishiMitraChatbot: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage | null>(() => getSavedLanguage());
  const [showLanguagePicker, setShowLanguagePicker] = useState(() => !getSavedLanguage());
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => preferredLanguage ? suggestionsByLanguage[preferredLanguage] : [],
    [preferredLanguage]
  );

  useEffect(() => {
    if (!preferredLanguage) return;
    setMessages(prev => prev.length ? prev : [{ role: 'assistant', content: greetings[preferredLanguage] }]);
  }, [preferredLanguage]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open, messages, loading, showLanguagePicker]);

  const chooseLanguage = (language: PreferredLanguage) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {}
    setPreferredLanguage(language);
    setShowLanguagePicker(false);
    setError('');
    setMessages([{ role: 'assistant', content: greetings[language] }]);
  };

  const sendMessage = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || loading || !preferredLanguage) return;

    if (!user) {
      setError('Please sign in to use KrishiMitra Assistant and get live application information.');
      setOpen(true);
      return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setError('');
    setInput('');
    const nextMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const reply = await aiApi.chat(text, nextMessages.slice(-8));
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      const friendly = String(err?.message || '').trim() || 'KrishiMitra Assistant is temporarily unavailable. Please try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const ui = (
    <div className="fixed inset-0 pointer-events-none z-[70]" aria-live="polite">
      <div className="absolute right-3 bottom-3 sm:right-6 sm:bottom-6 pointer-events-auto">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xl border border-emerald-600 transition-all hover:scale-[1.02] cursor-pointer"
            aria-label="Open KrishiMitra Assistant"
          >
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15">
              <Bot className="w-5 h-5" />
              <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-amber-400" />
            </span>
            <span className="text-xs font-black font-display">KrishiMitra Assistant</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>
        ) : (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="KrishiMitra Assistant"
            className="w-[calc(100vw-1.5rem)] max-w-[410px] h-[min(720px,calc(100dvh-1.5rem))] max-h-[calc(100dvh-1.5rem)] bg-white rounded-3xl border border-stone-200 shadow-[0_24px_80px_rgba(28,25,23,0.25)] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3.5 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-sm font-display truncate">KrishiMitra Assistant</div>
                  <div className="text-[10px] text-emerald-200 truncate">{t('chatbot.subtitle', 'How can I help you?')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {preferredLanguage && (
                  <button
                    type="button"
                    onClick={() => !loading && setShowLanguagePicker(true)}
                    disabled={loading}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {languageOptions.find(item => item.id === preferredLanguage)?.label}
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" aria-label="Close assistant">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 bg-stone-50">
              {showLanguagePicker ? (
                <div className="min-h-full flex items-center justify-center py-6">
                  <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 shadow-sm p-4">
                    <div className="text-center mb-4">
                      <div className="mx-auto w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                        <Bot className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-sm text-stone-900">
                        {preferredLanguage ? 'Change preferred language' : 'Welcome to KrishiMitra Assistant'}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {preferredLanguage ? 'Choose the language for greetings and suggested questions.' : 'Choose your preferred language to get started.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {languageOptions.map(option => {
                        const selected = preferredLanguage === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => chooseLanguage(option.id)}
                            className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition cursor-pointer ${
                              selected
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span className="text-lg">{option.flag}</span>
                              <span>
                                <span className="block text-xs font-bold text-stone-900">{option.label}</span>
                                <span className="block text-[11px] text-stone-500 mt-0.5">{option.native}</span>
                              </span>
                            </span>
                            {selected && <Check className="w-4 h-4 text-emerald-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {!user && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-3.5 py-3 text-xs leading-relaxed shadow-sm">
                      Please sign in to ask questions and get live equipment information.
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={message.role === 'user'
                        ? 'max-w-[82%] rounded-2xl rounded-br-md bg-emerald-800 text-white px-3.5 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-wrap'
                        : 'max-w-[90%] rounded-2xl rounded-bl-md bg-white border border-stone-200 text-stone-800 px-3.5 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-wrap'}>
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {messages.length === 1 && !loading && (
                    <div className="pt-1 space-y-2">
                      <div className="text-[10px] font-bold text-stone-500 px-1">Suggested questions</div>
                      {suggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void sendMessage(suggestion)}
                          disabled={!user}
                          className="block w-full text-left px-3 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-[11px] text-stone-700 transition cursor-pointer disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md bg-white border border-stone-200 px-4 py-3 text-xs text-stone-500 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:120ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:240ms]" />
                        <span className="ml-1 text-[10px]">Checking KrishiMitra...</span>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </>
              )}
            </div>

            {!showLanguagePicker && (
              <>
                {error && (
                  <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-[10px] font-semibold text-red-700 shrink-0" role="alert">
                    {error}
                  </div>
                )}

                <div className="p-3 bg-white border-t border-stone-200 shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
                  <div className="flex items-end gap-2 rounded-2xl border border-stone-300 bg-stone-50 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 px-2.5 py-2">
                    <input
                      ref={inputRef}
                      value={input}
                      maxLength={MAX_MESSAGE_LENGTH}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void sendMessage();
                        }
                      }}
                      placeholder="Ask in Marathi, Hindi or English..."
                      className="flex-1 bg-transparent outline-none text-xs text-stone-900 placeholder:text-stone-400 min-w-0"
                      disabled={loading || !user}
                      aria-label="Ask KrishiMitra Assistant"
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!input.trim() || loading || !user}
                      className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shrink-0"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[9px] text-stone-400 px-1">
                    <span>AI assistant • read-only</span>
                    <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 hover:text-stone-600 cursor-pointer">
                      <ChevronDown className="w-3 h-3" /> Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(ui, document.body);
};
