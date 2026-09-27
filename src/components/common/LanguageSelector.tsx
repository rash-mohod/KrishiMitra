import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../i18n/languages';
import { Check, ChevronDown, Globe, Languages, Search, Sparkles, X } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'chips' | 'modal' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = ''
}) => {
  const { currentLanguage, currentLanguageInfo, languages, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredLanguages = languages.filter(
    lang =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  // 1. CHIPS VARIANT (Ideal for footers or quick banner sections)
  if (variant === 'chips') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {languages.map(lang => {
          const isSelected = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700'
              }`}
              title={`${lang.name} (${lang.region})`}
            >
              <span>{lang.nativeName}</span>
              {isSelected && <Check className="w-3 h-3 text-emerald-200" />}
            </button>
          );
        })}
      </div>
    );
  }

  // 2. COMPACT VARIANT (Pill with code & Globe)
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={t('lang.selectLanguage', 'Select Language')}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-700" />
          <span>{currentLanguageInfo.nativeName}</span>
          <ChevronDown className="w-3 h-3 text-stone-500" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 border-b border-stone-100 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>{t('lang.selectLanguage', 'Select Language')}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">9 Languages</span>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition hover:bg-emerald-50 ${
                    currentLanguage === lang.code
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-stone-700'
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium block">{lang.nativeName}</span>
                    <span className="text-[10px] text-stone-400">{lang.name}</span>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. DROPDOWN VARIANT (Default for top Navbar)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs sm:text-sm font-semibold transition border border-stone-200/80 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        title={t('lang.selectLanguage', 'Select Language')}
      >
        <Languages className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="hidden sm:inline font-medium text-stone-800">
          {currentLanguageInfo.nativeName}
        </span>
        <span className="sm:hidden font-bold text-stone-800 text-xs">
          {currentLanguageInfo.badge}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>{t('lang.selectLanguage', 'Select Language')}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              9 Indian Languages
            </span>
          </div>

          {/* Quick Search inside language picker */}
          <div className="p-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('lang.searchPlaceholder', 'Search language or state...')}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Language Options Grid / List */}
          <div className="max-h-72 overflow-y-auto space-y-1 p-1">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-500">
                No matching language found
              </div>
            ) : (
              filteredLanguages.map(lang => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/90 border border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                        : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {lang.badge}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          <span className="text-[11px] font-normal text-stone-500">({lang.name})</span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate mt-0.5">
                          {lang.region}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic hidden group-hover:inline">
                          {lang.greeting}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick info note */}
          <div className="mt-1 pt-2 border-t border-stone-100 px-2 flex items-center justify-between text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Real-time UI Translation</span>
            </span>
            <span className="font-semibold text-emerald-800">
              {currentLanguageInfo.greeting}!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
