import React, { useEffect, useRef, useState } from 'react';
import { Category, EquipmentCondition, EquipmentFilterParams } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Filter, RotateCcw, Search, Mic, MicOff } from 'lucide-react';
import { INDIA_STATES_AND_UTS, getDistrictsForState } from '../../data/indiaLocations';

interface EquipmentFilterProps {
  categories: Category[];
  filters: EquipmentFilterParams;
  onFilterChange: (filters: EquipmentFilterParams) => void;
  onReset?: () => void;
  onClearFilters?: () => void;
}

export const EquipmentFilter: React.FC<EquipmentFilterProps> = ({
  categories,
  filters,
  onFilterChange,
  onReset,
  onClearFilters
}) => {
  const { t, translateCategory } = useLanguage();
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);

  const reset = onReset || onClearFilters || (() => undefined);
  const districts = getDistrictsForState(filters.state || '');

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  const startVoiceSearch = () => {
    setVoiceError('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice search is not supported in this browser. Please use text search.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim() || '';
      if (transcript) onFilterChange({ ...filters, search: transcript });
    };
    recognition.onerror = (event: any) => {
      setVoiceError(event?.error === 'not-allowed'
        ? 'Microphone permission was denied. Please allow microphone access.'
        : 'Voice search could not be completed. Please try again.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-stone-900 text-sm font-display">
          <Filter className="w-4 h-4 text-emerald-700" />
          <span>{t('filter.title', 'Filters & Search')}</span>
        </div>
        <button onClick={reset} className="text-xs text-stone-500 hover:text-emerald-700 font-semibold flex items-center gap-1 transition cursor-pointer">
          <RotateCcw className="w-3 h-3" />
          <span>{t('filter.reset', 'Reset')}</span>
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('filter.searchLabel', 'Search Machinery')}</label>
        <div className="relative">
          <input
            type="text"
            value={filters.search || ''}
            onChange={e => onFilterChange({ ...filters, search: e.target.value })}
            placeholder={t('search.placeholder', 'e.g. John Deere, Rotavator...')}
            className="w-full pl-9 pr-11 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <button type="button" onClick={startVoiceSearch} className={`absolute right-1 top-1 p-1.5 rounded-lg ${listening ? 'bg-red-50 text-red-600' : 'text-stone-500 hover:bg-stone-100'}`} title="Voice search" aria-label="Voice search">
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
        {voiceError && <p className="text-[10px] text-red-600 mt-1">{voiceError}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('filter.categoryLabel', 'Machinery Category')}</label>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onFilterChange({ ...filters, category: '' })} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${!filters.category ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
            {t('filter.allCategories', 'All Categories')}
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => onFilterChange({ ...filters, category: cat.id })} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filters.category === cat.id || filters.category === cat.name ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
              {translateCategory(cat.id)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('common.state', 'State')}</label>
        <select value={filters.state || ''} onChange={e => onFilterChange({ ...filters, state: e.target.value, location: '', search: filters.search })} className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none">
          <option value="">{t('filter.allStates', 'All States / UTs')}</option>
          {INDIA_STATES_AND_UTS.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('common.district', 'District')}</label>
        <select value={filters.district || ''} disabled={!filters.state} onChange={e => onFilterChange({ ...filters, district: e.target.value })} className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
          <option value="">{t('filter.allDistricts', 'All Districts')}</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('filter.villageTehsil', 'Village / Tehsil')}</label>
        <input value={filters.location || ''} onChange={e => onFilterChange({ ...filters, location: e.target.value })} placeholder={t('filter.villagePlaceholder', 'Enter village or tehsil')} className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('filter.datesLabel', 'Required Rental Dates')}</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={filters.startDate || ''} min={new Date().toISOString().split('T')[0]} onChange={e => onFilterChange({ ...filters, startDate: e.target.value })} className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg" />
          <input type="date" value={filters.endDate || ''} min={filters.startDate || new Date().toISOString().split('T')[0]} onChange={e => onFilterChange({ ...filters, endDate: e.target.value })} className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg" />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">{t('filter.maxDailyRate', 'Max Daily Rate (₹)')}</label>
          <span className="text-xs font-bold text-emerald-800">₹{(filters.maxPrice || 12000).toLocaleString('en-IN')}/{t('common.perDay', 'day')}</span>
        </div>
        <input type="range" min="500" max="12000" step="250" value={filters.maxPrice || 12000} onChange={e => onFilterChange({ ...filters, minPrice: 0, maxPrice: Number(e.target.value) })} className="w-full accent-emerald-600 cursor-pointer" />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1"><span>₹500</span><span>₹12,000+</span></div>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">{t('filter.conditionLabel', 'Condition Grade')}</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['ALL', 'EXCELLENT', 'GOOD'] as (EquipmentCondition | 'ALL')[]).map(cond => {
            const isSelected = (filters.condition || 'ALL') === cond;
            const label = cond === 'ALL' ? t('common.all', 'All') : cond === 'EXCELLENT' ? t('marketplace.likeNew', 'Like New') : t('marketplace.good', 'Good');
            return <button key={cond} onClick={() => onFilterChange({ ...filters, condition: cond })} className={`py-1.5 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}>{label}</button>;
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={!!filters.operatorRequired} onChange={e => onFilterChange({ ...filters, operatorRequired: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300" />
          <span className="text-xs font-semibold text-stone-700">{t('filter.operatorOnly', 'Show Only with Driver / Operator Option')}</span>
        </label>
      </div>
    </div>
  );
};
