import { LanguageCode } from '../i18n/languages';

const CACHE_STORAGE_KEY = 'km_trans_cache_v1';
const MAX_LOCAL_STORAGE_ITEMS = 4000;

class TranslationCache {
  private memCache = new Map<string, string>();
  private isLoaded = false;

  private makeKey(lang: LanguageCode, text: string): string {
    return `${lang}:${text.trim()}`;
  }

  private loadFromStorage(): void {
    if (this.isLoaded) return;
    this.isLoaded = true;
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, string> = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') {
            this.memCache.set(k, v);
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private persistToStorage(): void {
    try {
      // Limit size before serialization
      const obj: Record<string, string> = {};
      let count = 0;
      for (const [k, v] of this.memCache.entries()) {
        obj[k] = v;
        count++;
        if (count >= MAX_LOCAL_STORAGE_ITEMS) break;
      }
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // Ignore quota exceeded or storage disabled
    }
  }

  public getCached(lang: LanguageCode, text: string): string | undefined {
    if (!text || !text.trim() || lang === 'en') return undefined;
    this.loadFromStorage();
    return this.memCache.get(this.makeKey(lang, text));
  }

  public setCached(lang: LanguageCode, text: string, translation: string): void {
    if (!text || !text.trim() || !translation || lang === 'en') return;
    this.loadFromStorage();
    this.memCache.set(this.makeKey(lang, text), translation);
    this.persistToStorage();
  }

  public setManyCached(lang: LanguageCode, entries: { text: string; translation: string }[]): void {
    if (!entries.length || lang === 'en') return;
    this.loadFromStorage();
    for (const { text, translation } of entries) {
      if (text && translation) {
        this.memCache.set(this.makeKey(lang, text), translation);
      }
    }
    this.persistToStorage();
  }

  public clear(): void {
    this.memCache.clear();
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const translationCache = new TranslationCache();
