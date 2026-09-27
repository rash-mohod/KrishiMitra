import React, { useEffect, useState } from 'react';
import { Category, Equipment } from '../types';
import { equipmentApi } from '../services/api';
import { EquipmentCard } from '../components/equipment/EquipmentCard';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Tractor,
  TrendingUp,
  UserCheck,
  Wheat
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectEquipment: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectEquipment }) => {
  const { t, translateCategory } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Calculator State
  const [calcHp, setCalcHp] = useState('50');
  const [calcDays, setCalcDays] = useState('20');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    const cats = await equipmentApi.getCategories();
    const { items } = await equipmentApi.getEquipmentList();
    setCategories(cats || []);
    setFeaturedEquipment((items || []).slice(0, 6));
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedLocation !== 'all') params.append('location', selectedLocation);
    onNavigate(`/equipment?${params.toString()}`);
  };

  // Estimated owner earnings
  const estimatedRate = Number(calcHp) >= 55 ? 2500 : Number(calcHp) >= 45 ? 2200 : 1800;
  const estimatedGross = Number(calcDays) * estimatedRate;
  const estimatedNet = Math.round(estimatedGross * 0.95);

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white overflow-hidden py-16 sm:py-24 border-b border-stone-800">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('hero.badge', "India's Trusted Agricultural Machinery Rental Network")}</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
              {t('hero.title', 'Rent the Right Farm Equipment,')}{' '}
              <span className="text-emerald-400 underline decoration-emerald-600/40">
                {t('hero.subtitle', 'Right When You Need It.')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-300 leading-relaxed">
              {t('hero.description', 'Find reliable, heavy-duty agricultural machinery from verified nearby owners. Compare tractors, rotavators, seeders, and combine harvesters with transparent fixed daily rates.')}
            </p>

            {/* Quick Action CTA buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => onNavigate('/equipment')}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 text-sm"
              >
                <span>{t('hero.findEquipment', 'Find Farm Equipment')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/owner/equipment/add')}
                className="px-6 py-3.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold rounded-xl border border-stone-700 transition flex items-center gap-2 text-sm"
              >
                <Tractor className="w-4 h-4 text-emerald-400" />
                <span>{t('hero.listMachinery', 'List Your Machinery')}</span>
              </button>
            </div>
          </div>

          {/* Search Bar Container */}
          <div className="mt-12 bg-white text-stone-900 p-4 sm:p-5 rounded-2xl shadow-2xl border border-stone-200 max-w-5xl">
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              
              {/* Keyword / Brand */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('search.placeholder', 'Machinery or Brand')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g. John Deere, 50 HP Tractor..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('search.category', 'Category')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50"
                >
                  <option value="all">{t('search.allCategories', 'All Machinery Types')}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {translateCategory(c.id)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('search.location', 'District / Location')}
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50"
                  >
                    <option value="all">{t('search.allLocations', 'All India Locations')}</option>
                    <option value="Nagpur">Nagpur (Maharashtra)</option>
                    <option value="Ludhiana">Ludhiana (Punjab)</option>
                    <option value="Pune">Pune (Maharashtra)</option>
                    <option value="Karnal">Karnal (Haryana)</option>
                    <option value="Amravati">Amravati (Maharashtra)</option>
                    <option value="Indore">Indore (Madhya Pradesh)</option>
                  </select>
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              {/* Submit Search */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('search.searchButton', 'Search')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Pillar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-stone-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Document Verified Owners</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Same-Day Field Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Secure booking workflow</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <span>4.9★ Average Machine Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              {t('home.browseByCategory', 'Browse by Equipment Type')}
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900">
              {t('home.popularCategories', 'Popular Machinery Categories')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/equipment')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>{t('home.exploreAllCategories', 'Explore all 10 categories')}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {(categories || []).slice(0, 10).map(cat => (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/equipment?category=${cat.id}`)}
              className="group bg-white rounded-2xl border border-stone-200 p-4 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-4/3 rounded-xl overflow-hidden mb-3 bg-stone-100 relative">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-700 transition">
                  {translateCategory(cat.id)}
                </h3>
                <p className="text-stone-500 text-[11px] line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED EQUIPMENT LISTING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Top Rated & Ready for Work
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900">
              {t('home.featuredEquipment', 'Featured Agricultural Machinery')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/equipment')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>{t('home.viewAllEquipment', 'View all marketplace equipment')} ({featuredEquipment.length}+)</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEquipment.map(eq => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              onViewDetails={onSelectEquipment}
              onRentNow={() => onSelectEquipment(eq.id)}
              onMessageOwner={() => onSelectEquipment(eq.id)}
            />
          ))}
        </div>
      </section>

      {/* 4. HOW KRISHI MITRA WORKS */}
      <section className="bg-stone-100 py-16 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Simple 4-Step Rental Process
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900">
              {t('home.howItWorksTitle', 'How Krishi Mitra Works')}
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-2">
              Modern farm mechanization made seamless for both farmers and equipment owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center mb-4 text-base font-display">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1 font-display">
                {t('home.step1Title', 'Discover Machinery')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.step1Desc', 'Filter nearby tractors and implements by horsepower, district, and daily price. Check real-time calendar availability.')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center mb-4 text-base font-display">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1 font-display">
                {t('home.step2Title', 'Owner Approves Dates')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.step2Desc', 'Submit your booking request. The owner reviews the schedule and confirms machinery readiness within minutes.')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center mb-4 text-base font-display">
                3
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1 font-display">
                {t('home.step3Title', 'Booking Confirmation')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.step3Desc', 'Pay safely via UPI or cards. Payment is held in escrow and released to the owner only upon successful handover.')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center mb-4 text-base font-display">
                4
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1 font-display">
                {t('home.step4Title', 'Field Work & Rating')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.step4Desc', 'Operate the machinery on your plots. Return after completion and share your verified review on Krishi Mitra.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OWNER EARNINGS CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 border border-stone-800 shadow-xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/50 text-emerald-300 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t('home.earnTitle', 'Monetize Idle Farm Machinery')}</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
                Turn Your Idle Tractor into a Steady Seasonal Income.
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                {t('home.earnSubtitle', 'Most agricultural tractors sit idle for 180+ days a year. List on Krishi Mitra to rent to verified progressive farmers in your tehsil with full escrow security and zero broker commission.')}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/owner/equipment/add')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2"
                >
                  <Tractor className="w-4 h-4" />
                  <span>{t('home.listMachinery', 'List Your Equipment Free')}</span>
                </button>
              </div>
            </div>

            {/* Interactive Calculator Widget */}
            <div className="lg:col-span-5 bg-stone-800/90 rounded-2xl p-6 border border-stone-700 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-700 pb-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>{t('home.calculatorTitle', 'Owner Earnings Estimator')}</span>
                </h4>
                <span className="text-[10px] text-stone-400 font-mono">{t('home.escrowSecure', 'Net 95% Payout')}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Tractor Horsepower (HP)
                </label>
                <select
                  value={calcHp}
                  onChange={e => setCalcHp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-600 rounded-lg text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="35">35 - 40 HP (Small / Orchard)</option>
                  <option value="47">45 - 50 HP (Standard Utility)</option>
                  <option value="55">55 - 75+ HP (Heavy 4WD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Estimated Rental Days Per Season
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={calcDays}
                  onChange={e => setCalcDays(e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>{calcDays} Days</span>
                  <span>₹{estimatedRate}/day benchmark</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block">{t('home.calcOutput', 'Estimated Net Seasonal Earnings')}</span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-display">
                    ₹{estimatedNet.toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">
                  Direct Bank Payout
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TRUST & VERIFICATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                KYC-Verified Farmers & Owners
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Both equipment owners and renting farmers verify Aadhaar/Govt ID and local land records before their first transaction.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Transit & Damage Protection
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Optional machinery transit coverage and clear dispute arbitration via State Ag Extension Officers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold">
                <Wheat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Boost Farm Productivity
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Complete sowing, weeding, spraying, and harvesting in critical weather windows without heavy capital debt.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
