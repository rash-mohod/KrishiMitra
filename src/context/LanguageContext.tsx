import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';

import {
  LanguageCode,
  LanguageInfo,
  SUPPORTED_LANGUAGES
} from '../i18n/languages';

import { TRANSLATIONS } from '../i18n/translations';
import { translationCache } from '../services/translationCache';
import { translationManager } from '../services/translationManager';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];

  setLanguage: (code: LanguageCode) => void;

  t: (keyOrText: string, fallback?: string) => string;

  translateCategory: (categoryIdentifier: string) => string;
  translateCondition: (condition: string) => string;
  translateStatus: (status: string) => string;
  translateFuel: (fuel?: string) => string;
  translateRole: (role: string) => string;
}

const STORAGE_KEY = 'krishi_mitra_preferred_language';

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

/**
 * Safely read the user's previously selected language.
 */
const getInitialLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (
      saved &&
      SUPPORTED_LANGUAGES.some(
        language => language.code === saved
      )
    ) {
      return saved as LanguageCode;
    }
  } catch {
    // Ignore localStorage errors.
  }

  return 'en';
};

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] =
    useState<LanguageCode>(getInitialLanguage);

  /**
   * Incremented whenever a background translation finishes.
   *
   * The value itself is not used for translation.
   * Its only purpose is to force React consumers to render again
   * so that newly cached translations become visible immediately.
   */
  const [, refreshTranslations] = useReducer(
    (value: number) => value + 1,
    0
  );

  /**
   * Listen for translations completed by TranslationManager.
   *
   * Example:
   *
   * User selects Marathi
   *      ↓
   * t() finds no local/cache translation
   *      ↓
   * TranslationManager requests backend translation
   *      ↓
   * Backend/Gemini responds
   *      ↓
   * TranslationCache stores result
   *      ↓
   * TranslationManager notifies subscribers
   *      ↓
   * Provider refreshes
   *      ↓
   * UI immediately reads the newly cached Marathi value
   */
  useEffect(() => {
    const unsubscribe = translationManager.subscribe(() => {
      refreshTranslations();
    });

    return unsubscribe;
  }, []);

  /**
   * Change application language.
   *
   * React state is the source of truth for the active language.
   * The selected language is also persisted for the next visit.
   */
  const setLanguage = useCallback(
    (code: LanguageCode) => {
      if (code === currentLanguage) {
        return;
      }

      setCurrentLanguageState(code);

      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Ignore localStorage errors.
      }

      /**
       * Update the document language immediately.
       * This also helps accessibility tools and browser language detection.
       */
      try {
        document.documentElement.lang = code;
      } catch {
        // Ignore DOM errors.
      }
    },
    [currentLanguage]
  );

  /**
   * Keep <html lang="..."> synchronized with React state.
   *
   * This is intentionally separate from setLanguage so that the value
   * is also correct after the initial application load.
   */
  useEffect(() => {
    try {
      document.documentElement.lang = currentLanguage;
    } catch {
      // Ignore DOM errors.
    }
  }, [currentLanguage]);

  /**
   * Current language metadata.
   */
  const currentLanguageInfo = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find(
        language => language.code === currentLanguage
      ) || SUPPORTED_LANGUAGES[0],
    [currentLanguage]
  );

  /**
   * Central hybrid translation function.
   *
   * Priority:
   *
   * 1. English/local dictionary
   * 2. Local target-language dictionary
   * 3. Browser memory/localStorage translation cache
   * 4. Backend translation queue
   * 5. English fallback
   *
   * IMPORTANT:
   * This function only translates strings explicitly passed to it.
   * It does NOT touch dynamic database/user-generated values unless
   * a component explicitly sends those values to t().
   */
  const t = useCallback(
    (keyOrText: string, fallback?: string): string => {
      if (!keyOrText) {
        return '';
      }

      /**
       * English requires no backend translation.
       */
      if (currentLanguage === 'en') {
        const englishDictionary = TRANSLATIONS.en;

        if (englishDictionary?.[keyOrText]) {
          return englishDictionary[keyOrText];
        }

        return fallback || keyOrText;
      }

      /**
       * 1. Check static local translation dictionary.
       *
       * This is the cheapest and fastest path.
       */
      const languageDictionary =
        TRANSLATIONS[currentLanguage];

      if (languageDictionary?.[keyOrText]) {
        return languageDictionary[keyOrText];
      }

      /**
       * 2. Check cache using the original key/text.
       *
       * Example:
       * mr:auth.signIn
       */
      const cachedDirect = translationCache.getCached(
        currentLanguage,
        keyOrText
      );

      if (cachedDirect) {
        return cachedDirect;
      }

      /**
       * Determine the actual English source string.
       *
       * Example:
       *
       * t('auth.signIn', 'Sign In')
       *
       * becomes:
       *
       * "Sign In"
       */
      const englishSource =
        TRANSLATIONS.en?.[keyOrText] ||
        fallback ||
        keyOrText;

      /**
       * 3. Check cache using the English source text.
       *
       * This is important because backend translations are cached
       * using the actual source sentence rather than necessarily
       * the dictionary key.
       */
      const cachedSource = translationCache.getCached(
        currentLanguage,
        englishSource
      );

      if (cachedSource) {
        return cachedSource;
      }

      /**
       * 4. Queue missing translation.
       *
       * TranslationManager handles:
       * - batching
       * - deduplication
       * - in-flight protection
       * - backend communication
       * - cache population
       */
      translationManager.requestTranslation(
        currentLanguage,
        englishSource
      );

      /**
       * 5. Never block rendering.
       *
       * The English source is shown until the translation arrives.
       */
      return englishSource;
    },
    [currentLanguage]
  );

  /**
   * Translate equipment category identifiers.
   *
   * These are controlled application values, not arbitrary user-generated
   * equipment names.
   */
  const translateCategory = useCallback(
    (categoryIdentifier: string): string => {
      if (!categoryIdentifier) {
        return '';
      }

      const cleanId = categoryIdentifier
        .toLowerCase()
        .replace(/^cat-/, '');

      if (cleanId.includes('tractor')) {
        return t(
          'category.tractors',
          'Tractors'
        );
      }

      if (cleanId.includes('harvester')) {
        return t(
          'category.harvesters',
          'Harvesters & Combines'
        );
      }

      if (
        cleanId.includes('rotavator') ||
        cleanId.includes('tiller')
      ) {
        return t(
          'category.rotavators',
          'Rotavators & Tillers'
        );
      }

      if (
        cleanId.includes('seeder') ||
        cleanId.includes('drill')
      ) {
        return t(
          'category.seeders',
          'Seeders & Drills'
        );
      }

      if (
        cleanId.includes('plough') ||
        cleanId.includes('cultivator')
      ) {
        return t(
          'category.ploughs',
          'Ploughs & Cultivators'
        );
      }

      if (cleanId.includes('sprayer')) {
        return t(
          'category.sprayers',
          'Boom Sprayers'
        );
      }

      if (cleanId.includes('thresher')) {
        return t(
          'category.threshers',
          'Threshers'
        );
      }

      if (
        cleanId.includes('powertiller') ||
        cleanId.includes('power-tiller')
      ) {
        return t(
          'category.powertillers',
          'Power Tillers'
        );
      }

      if (
        cleanId.includes('baler') ||
        cleanId.includes('leveler')
      ) {
        return t(
          'category.balers',
          'Balers & Levelers'
        );
      }

      if (
        cleanId.includes('trailer') ||
        cleanId.includes('trolley')
      ) {
        return t(
          'category.trailers',
          'Trolleys & Trailers'
        );
      }

      /**
       * Unknown category:
       * preserve the original value rather than modifying dynamic data.
       */
      return t(
        `category.${cleanId}`,
        categoryIdentifier
      );
    },
    [t]
  );

  /**
   * Translate controlled equipment condition values.
   */
  const translateCondition = useCallback(
    (condition: string): string => {
      switch (condition?.toUpperCase()) {
        case 'EXCELLENT':
          return t(
            'marketplace.excellent',
            'Excellent (Like New)'
          );

        case 'GOOD':
          return t(
            'marketplace.good',
            'Good Condition'
          );

        case 'FAIR':
          return t(
            'marketplace.fair',
            'Fair Condition'
          );

        default:
          return condition || '';
      }
    },
    [t]
  );

  /**
   * Translate controlled rental/booking status values.
   */
  const translateStatus = useCallback(
    (status: string): string => {
      switch (status?.toUpperCase()) {
        case 'AVAILABLE':
          return t(
            'common.available',
            'Available'
          );

        case 'CONFIRMED':
          return t(
            'status.confirmed',
            'Booked'
          );

        case 'PENDING':
          return t(
            'status.pending',
            'Pending'
          );

        case 'ACTIVE':
          return t(
            'status.active',
            'Rental In Progress'
          );

        case 'COMPLETED':
          return t(
            'status.completed',
            'Rental Completed'
          );

        case 'REJECTED':
          return t(
            'status.rejected',
            'Rejected'
          );

        case 'CANCELLED':
          return t(
            'status.cancelled',
            'Cancelled'
          );

        case 'EXPIRED':
          return t('status.expired', 'Expired');

        case 'STOPPED':
          return t('status.stopped', 'Stopped');

        case 'PAYMENT_PENDING':
          return t(
            'status.paymentPending',
            'Payment Pending'
          );

        default:
          return status || '';
      }
    },
    [t]
  );

  /**
   * Translate controlled fuel values.
   */
  const translateFuel = useCallback(
    (fuel?: string): string => {
      if (!fuel) {
        return '';
      }

      switch (fuel.toUpperCase()) {
        case 'DIESEL':
          return t(
            'fuel.diesel',
            'Diesel'
          );

        case 'ELECTRIC':
          return t(
            'fuel.electric',
            'Electric'
          );

        case 'PETROL':
          return t(
            'fuel.petrol',
            'Petrol'
          );

        case 'MANUAL':
          return t(
            'fuel.manual',
            'Manual'
          );

        default:
          /**
           * Preserve unknown/dynamic values exactly.
           */
          return fuel;
      }
    },
    [t]
  );

  /**
   * Translate controlled user-role values.
   */
  const translateRole = useCallback(
    (role: string): string => {
      switch (role?.toUpperCase()) {
        case 'FARMER':
          return t(
            'role.farmer',
            'Farmer / Renter'
          );

        case 'OWNER':
          return t(
            'role.owner',
            'Equipment Owner'
          );

        case 'ADMIN':
          return t(
            'role.admin',
            'Platform Admin'
          );

        default:
          /**
           * Preserve unknown/dynamic role values.
           */
          return role || '';
      }
    },
    [t]
  );

  /**
   * Memoized context value.
   *
   * This avoids creating a new context object on unrelated renders.
   * The value changes when the active language or translation functions
   * change, which is exactly when consumers need to update.
   */
  const contextValue = useMemo<LanguageContextType>(
    () => ({
      currentLanguage,
      currentLanguageInfo,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      t,
      translateCategory,
      translateCondition,
      translateStatus,
      translateFuel,
      translateRole
    }),
    [
      currentLanguage,
      currentLanguageInfo,
      setLanguage,
      t,
      translateCategory,
      translateCondition,
      translateStatus,
      translateFuel,
      translateRole
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used within a LanguageProvider'
    );
  }

  return context;
};