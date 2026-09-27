import React, { useEffect, useState } from 'react';
import { Category, Equipment, EquipmentFilterParams } from '../types';
import { equipmentApi } from '../services/api';
import { EquipmentCard } from '../components/equipment/EquipmentCard';
import { EquipmentFilter } from '../components/equipment/EquipmentFilter';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SlidersHorizontal, Tractor } from 'lucide-react';

interface EquipmentPageProps {
  initialCategory?: string | null;
  onNavigate: (path: string) => void;
  onSelectEquipment: (id: string) => void;
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({
  initialCategory,
  onNavigate,
  onSelectEquipment
}) => {
  const { t, translateCategory } = useLanguage();
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState<EquipmentFilterParams>({
    category: initialCategory || '',
    search: '',
    minPrice: undefined,
    maxPrice: undefined,
    operatorRequired: undefined,
    condition: undefined,
    location: '',
    state: '',
    district: '',
    startDate: undefined,
    endDate: undefined,
    sortBy: 'rating'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialCategory) {
      setFilters(prev => ({ ...prev, category: initialCategory }));
    }
  }, [initialCategory]);

  useEffect(() => {
    loadEquipment();
  }, [filters, user?.id]);

  const loadCategories = async () => {
    try {
      const cats = await equipmentApi.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      const res = await equipmentApi.getEquipmentList(filters);
      // The Equipment marketplace is for comparing/renting other owners' machinery.
      // Never show the currently signed-in owner's own machinery here.
      const visibleItems = user?.id
        ? res.items.filter(eq => eq.ownerId !== user.id)
        : res.items;
      setEquipmentList(visibleItems);
      setTotalCount(visibleItems.length);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: EquipmentFilterParams) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: undefined,
      maxPrice: undefined,
      operatorRequired: undefined,
      condition: undefined,
      location: '',
      state: '',
      district: '',
      startDate: undefined,
      endDate: undefined,
      sortBy: 'rating'
    });
  };

  return (
    <div className="min-w-0 pb-16">
      
      {/* Top Header Banner */}
      <div className="bg-emerald-900 text-white py-8 sm:py-10 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-emerald-200 text-xs font-semibold mb-2">
              <Tractor className="w-3.5 h-3.5" />
              <span>{t('marketplace.verifiedBadge', 'Krishi Mitra Marketplace')}</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight">
              {t('marketplace.title', 'Agricultural Equipment & Machinery')}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {t('marketplace.subtitle', 'Browse and rent agricultural tractors, cultivators, rotavators, harvesters, and other machinery.')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <p className="text-stone-700 text-xs sm:text-sm font-bold">
              {t('marketplace.showingResults', 'Showing equipment available for booking')} ({totalCount})
            </p>
            {filters.category && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-md font-bold flex items-center gap-1">
                {translateCategory(filters.category)}
                <button onClick={() => setFilters({ ...filters, category: '' })} className="hover:text-emerald-950">✕</button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-700 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('common.filter', 'Filter')}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="hidden sm:inline font-semibold">{t('common.sortBy', 'Sort By')}:</span>
              <select
                value={filters.sortBy || 'rating'}
                onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
                aria-label={t('common.sortBy', 'Sort By')}
                className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="rating">{t('common.rating', 'Highest Rated')}</option>
                <option value="price_asc">{t('common.price', 'Price: Low to High')}</option>
                <option value="price_desc">{t('common.price', 'Price: High to Low')}</option>
                <option value="popular">{t('common.verifiedOwner', 'Most Booked')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6 items-start">
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-20">
            <EquipmentFilter
              categories={categories}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleClearFilters}
            />
          </div>

          {/* Equipment Cards Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 bg-stone-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : equipmentList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                  <Tractor className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">{t('marketplace.noResults', 'No farm equipment matches your criteria')}</h3>
                  <p className="text-stone-500 text-xs mt-1 max-w-md mx-auto">
                    {t('marketplace.noResultsDesc', 'Try clearing your filters or searching with a broader keyword.')}
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition"
                >
                  {t('common.clearFilters', 'Clear All Filters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {equipmentList.map(eq => (
                  <EquipmentCard
                    key={eq.id}
                    equipment={eq}
                    onViewDetails={onSelectEquipment}
                    onRentNow={(eq) => onSelectEquipment(eq.id)}
                    onMessageOwner={(eq) => onSelectEquipment(eq.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-stone-900">{t('marketplace.filterTitle', 'Filter Machinery')}</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-stone-500">✕</button>
              </div>
              <EquipmentFilter
                categories={categories}
                filters={filters}
                onFilterChange={(f) => {
                  handleFilterChange(f);
                }}
                onReset={handleClearFilters}
              />
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-xs mt-4"
              >
                {t('common.apply', 'Apply Filters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
