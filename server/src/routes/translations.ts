import { Request, Response, Router } from 'express';
import { z } from 'zod';
import {
  getCachedTranslation,
  setCachedTranslation,
  translateTextsWithGemini
} from '../services/geminiTranslation.js';

const router = Router();

const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr', 'pa', 'te', 'ta', 'kn', 'gu', 'bn'];

const TranslationRequestSchema = z.object({
  sourceLanguage: z.string().default('en'),
  targetLanguage: z.string().min(2).max(10),
  texts: z.array(z.string()).min(1).max(100)
});

const handleTranslation = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = TranslationRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid translation payload.',
        errors: parseResult.error.format()
      });
    }

    const { sourceLanguage, targetLanguage, texts } = parseResult.data;
    const normSource = sourceLanguage.toLowerCase();
    const normTarget = targetLanguage.toLowerCase();

    if (normSource === normTarget || !SUPPORTED_LANGUAGES.includes(normTarget)) {
      return res.json({
        success: true,
        translations: texts,
        translated: texts.map(() => true),
        data: {
          sourceLanguage: normSource,
          targetLanguage: normTarget,
          translations: texts,
          translated: texts.map(() => true),
          cachedCount: texts.length,
          geminiCount: 0
        }
      });
    }

    // results[i] is the final text for input position i.
    const results: (string | null)[] = new Array(texts.length).fill(null);

    // translatedFlags[i] tells the frontend whether it is safe to cache
    // results[i]. A false value means the text is only a temporary fallback.
    const translatedFlags = new Array<boolean>(texts.length).fill(false);

    // Keep duplicate source strings together so Gemini sees each unique
    // string only once.
    const uncachedIndexMap = new Map<string, number[]>();

    let cachedCount = 0;

    // Step 1: Resolve valid server-cache entries.
    for (let i = 0; i < texts.length; i++) {
      const original = texts[i];

      if (!original || !original.trim()) {
        results[i] = original;
        translatedFlags[i] = true;
        continue;
      }

      const cached = getCachedTranslation(normSource, normTarget, original);

      if (cached !== undefined) {
        results[i] = cached;
        translatedFlags[i] = true;
        cachedCount++;
      } else {
        const list = uncachedIndexMap.get(original) || [];
        list.push(i);
        uncachedIndexMap.set(original, list);
      }
    }

    // Step 2: Send only unique cache misses to Gemini.
    const uniqueUncachedTexts = Array.from(uncachedIndexMap.keys());
    let geminiCount = 0;

    if (uniqueUncachedTexts.length > 0) {
      const geminiResult = await translateTextsWithGemini(
        normSource,
        normTarget,
        uniqueUncachedTexts
      );

      for (let j = 0; j < uniqueUncachedTexts.length; j++) {
        const sourceStr = uniqueUncachedTexts[j];
        const transStr = geminiResult.translations[j] || sourceStr;
        const wasTranslated = geminiResult.translated[j] === true;

        // CRITICAL:
        // Only successful Gemini translations are written to the server cache.
        // If Gemini returned a fallback because of a 503/timeout/error, the
        // English source string is returned to the UI but is NOT cached.
        if (wasTranslated) {
          setCachedTranslation(
            normSource,
            normTarget,
            sourceStr,
            transStr
          );
          geminiCount++;
        }

        const indices = uncachedIndexMap.get(sourceStr) || [];

        for (const idx of indices) {
          results[idx] = transStr;
          translatedFlags[idx] = wasTranslated;
        }
      }
    }

    // Step 3: Final safety fallback.
    const finalTranslations = results.map((value, idx) =>
      value !== null ? value : texts[idx]
    );

    return res.json({
      success: true,
      translations: finalTranslations,
      translated: translatedFlags,
      data: {
        sourceLanguage: normSource,
        targetLanguage: normTarget,
        translations: finalTranslations,
        translated: translatedFlags,
        cachedCount,
        geminiCount
      }
    });
  } catch (error: any) {
    console.error('[TranslationRoute] Error handling translation request:', error);

    // Keep the UI functional during backend failures, but explicitly mark
    // every item as NOT translated so the frontend will never cache these
    // fallback values.
    const fallbackTexts = Array.isArray(req.body?.texts)
      ? req.body.texts
      : [];

    const translatedFlags = fallbackTexts.map(() => false);

    return res.status(200).json({
      success: true,
      translations: fallbackTexts,
      translated: translatedFlags,
      data: {
        sourceLanguage: String(req.body?.sourceLanguage || 'en').toLowerCase(),
        targetLanguage: String(req.body?.targetLanguage || '').toLowerCase(),
        translations: fallbackTexts,
        translated: translatedFlags,
        cachedCount: 0,
        geminiCount: 0
      }
    });
  }
};

router.post('/', handleTranslation);
router.post('/batch', handleTranslation);

export default router;
