import React, { createContext, useContext, useEffect, useState } from 'react';
import { LanguageCode, LanguageInfo, SUPPORTED_LANGUAGES } from '../i18n/languages';
import { TRANSLATIONS } from '../i18n/translations';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  translateCategory: (categoryIdentifier: string) => string;
  translateCondition: (condition: string) => string;
  translateStatus: (status: string) => string;
  translateFuel: (fuel?: string) => string;
  translateRole: (role: string) => string;
}

const STORAGE_KEY = 'krishi_mitra_preferred_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved as LanguageCode;
      }
    } catch {
      // ignore localStorage errors
    }
    return 'en';
  });

  const setLanguage = (code: LanguageCode) => {
    setCurrentLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      // Set document lang attribute
      document.documentElement.lang = code;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[currentLanguage];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  // Helper to translate machinery category names
  const translateCategory = (identifier: string): string => {
    if (!identifier) return '';
    const cleanId = identifier.toLowerCase().replace('cat-', '');
    
    if (cleanId.includes('tractor')) return t('category.tractors', 'Tractors');
    if (cleanId.includes('harvester')) return t('category.harvesters', 'Harvesters & Combines');
    if (cleanId.includes('rotavator') || cleanId.includes('tiller')) return t('category.rotavators', 'Rotavators & Tillers');
    if (cleanId.includes('seeder') || cleanId.includes('drill')) return t('category.seeders', 'Seeders & Drills');
    if (cleanId.includes('plough') || cleanId.includes('cultivator')) return t('category.ploughs', 'Ploughs & Cultivators');
    if (cleanId.includes('sprayer')) return t('category.sprayers', 'Boom Sprayers');
    if (cleanId.includes('thresher')) return t('category.threshers', 'Threshers');
    if (cleanId.includes('powertiller') || cleanId.includes('power-tiller')) return t('category.powertillers', 'Power Tillers');
    if (cleanId.includes('baler') || cleanId.includes('leveler')) return t('category.balers', 'Balers & Levelers');
    if (cleanId.includes('trailer') || cleanId.includes('trolley')) return t('category.trailers', 'Trolleys & Trailers');

    return identifier;
  };

  const translateCondition = (condition: string): string => {
    switch (condition?.toUpperCase()) {
      case 'EXCELLENT':
        return t('marketplace.excellent', 'Excellent (Like New)');
      case 'GOOD':
        return t('marketplace.good', 'Good Condition');
      case 'FAIR':
        return t('marketplace.fair', 'Fair Condition');
      default:
        return condition;
    }
  };

  const translateStatus = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return t('common.available', 'Available');
      case 'CONFIRMED':
        return currentLanguage === 'hi' ? 'बुक किया गया' : currentLanguage === 'mr' ? 'बुक केले' : 'Booked';
      case 'PENDING':
        return currentLanguage === 'hi' ? 'लंबित' : currentLanguage === 'mr' ? 'प्रलंबित' : 'Pending';
      case 'ACTIVE':
        return currentLanguage === 'hi' ? 'किराया जारी है' : currentLanguage === 'mr' ? 'भाडे सुरू आहे' : 'Rental In Progress';
      case 'COMPLETED':
        return currentLanguage === 'hi' ? 'किराया पूरा हुआ' : currentLanguage === 'mr' ? 'भाडे पूर्ण झाले' : 'Rental Completed';
      case 'REJECTED':
        return currentLanguage === 'hi' ? 'अस्वीकृत' : currentLanguage === 'mr' ? 'नाकारले' : 'Rejected';
      case 'CANCELLED':
        return currentLanguage === 'hi' ? 'रद्द' : currentLanguage === 'mr' ? 'रद्द केले' : 'Cancelled';
      default:
        return status;
    }
  };

  const translateFuel = (fuel?: string): string => {
    if (!fuel) return '';
    switch (fuel.toUpperCase()) {
      case 'DIESEL':
        return currentLanguage === 'hi' ? 'डीजल' : currentLanguage === 'mr' ? 'डिझेल' : currentLanguage === 'pa' ? 'ਡੀਜ਼ਲ' : 'Diesel';
      case 'ELECTRIC':
        return currentLanguage === 'hi' ? 'इलेक्ट्रिक' : currentLanguage === 'mr' ? 'इलेक्ट्रिक' : 'Electric';
      case 'PETROL':
        return currentLanguage === 'hi' ? 'पेट्रोल' : currentLanguage === 'mr' ? 'पेट्रोल' : 'Petrol';
      case 'MANUAL':
        return currentLanguage === 'hi' ? 'मैन्युअल / हस्तचालित' : currentLanguage === 'mr' ? 'मॅन्युअल' : 'Manual';
      default:
        return fuel;
    }
  };

  const translateRole = (role: string): string => {
    switch (role?.toUpperCase()) {
      case 'FARMER':
        return t('role.farmer', 'Farmer / Renter');
      case 'OWNER':
        return t('role.owner', 'Equipment Owner');
      case 'ADMIN':
        return t('role.admin', 'Platform Admin');
      default:
        return role;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
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
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
