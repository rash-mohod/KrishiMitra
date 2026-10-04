import { LanguageCode } from '../i18n/languages';
import { translationCache } from './translationCache';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const BATCH_DEBOUNCE_MS = 60;
const MAX_BATCH_SIZE = 80;

type Listener = () => void;

interface TranslationResponse {
  translations: string[];
  translated?: boolean[];
  data?: {
    translations?: string[];
    translated?: boolean[];
  };
}

class TranslationManager {
  private queue = new Map<LanguageCode, Set<string>>();
  private inFlight = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Ignore listener errors so one subscriber cannot break translation updates.
      }
    }
  }

  public requestTranslation(targetLang: LanguageCode, text: string): void {
    if (!text || !text.trim() || targetLang === 'en') return;

    const trimmed = text.trim();
    const flightKey = `${targetLang}:${trimmed}`;

    // Do not enqueue a string that is already translated or already being requested.
    if (this.inFlight.has(flightKey) || translationCache.getCached(targetLang, trimmed)) {
      return;
    }

    let langQueue = this.queue.get(targetLang);
    if (!langQueue) {
      langQueue = new Set<string>();
      this.queue.set(targetLang, langQueue);
    }

    langQueue.add(trimmed);

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      void this.flush();
    }, BATCH_DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    this.timer = null;

    if (this.queue.size === 0) return;

    for (const [targetLang, setOfTexts] of this.queue.entries()) {
      if (setOfTexts.size === 0) continue;

      const allTexts = Array.from(setOfTexts);
      this.queue.delete(targetLang);

      for (let i = 0; i < allTexts.length; i += MAX_BATCH_SIZE) {
        const batch = allTexts.slice(i, i + MAX_BATCH_SIZE);

        for (const text of batch) {
          this.inFlight.add(`${targetLang}:${text}`);
        }

        void this.sendBatchRequest(targetLang, batch);
      }
    }
  }

  private async sendBatchRequest(targetLang: LanguageCode, texts: string[]): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceLanguage: 'en',
          targetLanguage: targetLang,
          texts
        })
      });

      if (!response.ok) {
        throw new Error(`Translation endpoint returned ${response.status}`);
      }

      const resData: TranslationResponse = await response.json();

      const translations =
        Array.isArray(resData?.translations)
          ? resData.translations
          : Array.isArray(resData?.data?.translations)
            ? resData.data.translations
            : [];

      const translatedFlags =
        Array.isArray(resData?.translated)
          ? resData.translated
          : Array.isArray(resData?.data?.translated)
            ? resData.data.translated
            : [];

      if (translations.length !== texts.length) {
        throw new Error(
          `Translation response length mismatch: expected ${texts.length}, received ${translations.length}`
        );
      }

      // IMPORTANT:
      // Only cache entries that the backend confirms were genuinely translated
      // (from Gemini or an existing valid server cache). Never cache an English
      // fallback produced because Gemini failed.
      const successfulEntries: { text: string; translation: string }[] = [];

      for (let i = 0; i < texts.length; i++) {
        const wasTranslated = translatedFlags.length === texts.length
          ? translatedFlags[i] === true
          : false;

        if (wasTranslated && typeof translations[i] === 'string' && translations[i].trim()) {
          successfulEntries.push({
            text: texts[i],
            translation: translations[i]
          });
        }
      }

      if (successfulEntries.length > 0) {
        translationCache.setManyCached(targetLang, successfulEntries);
        this.notify();
      }
    } catch (err) {
      console.warn(`[TranslationManager] Failed to fetch translations for ${targetLang}:`, err);
    } finally {
      for (const text of texts) {
        this.inFlight.delete(`${targetLang}:${text}`);
      }
    }
  }
}

export const translationManager = new TranslationManager();
