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
  // Owner earnings calculator
  const [calcRate, setCalcRate] = useState('1500');
  const [calcDays, setCalcDays] = useState('5');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    const cats = await equipmentApi.getCategories();
    const { items } = await equipmentApi.getEquipmentList();
    setCategories(cats || []);
    setFeaturedEquipment((items || []).slice(0, 6));
  };


  const estimatedGross = Number(calcRate || 0) * Number(calcDays || 0);

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
              <span>{t('hero.badge', "Agricultural Machinery Rental Network")}</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
              {t('hero.title', 'Rent the Right Farm Equipment,')}{' '}
              <span className="text-emerald-400 underline decoration-emerald-600/40">
                {t('hero.subtitle', 'Right When You Need It.')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-300 leading-relaxed">
              {t('hero.description', 'Find agricultural machinery from local owners. Compare tractors, rotavators, seeders, and combine harvesters with transparent fixed daily rates.')}
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

          {/* Quick Stats Pillar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-stone-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('home.verifiedOwners', 'Verified Owners')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('home.ownerAvailability', 'Owner-listed rental availability')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('home.secureWorkflow', 'Secure booking workflow')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('home.machineryRatings', 'Transparent machinery ratings')}</span>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(categories || []).slice(0, 10).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigate(`/equipment?category=${cat.id}`)}
              className="group text-left bg-white rounded-2xl border border-stone-200 p-4 hover:border-emerald-500 hover:shadow-md transition-all min-h-28 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-stone-900 group-hover:text-emerald-700 transition">{translateCategory(cat.id)}</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <span className="text-[11px] text-stone-500 line-clamp-2">{cat.description || 'Farm equipment available for rental.'}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED EQUIPMENT LISTING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              {t('home.topRatedReady', 'Top Rated & Ready for Work')}
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
              {t('home.simple4Step', 'Simple 4-Step Rental Process')}
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900">
              {t('home.howItWorksTitle', 'How Krishi Mitra Works')}
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-2">
              {t('home.howItWorksSubtitle', 'Modern farm mechanization made seamless for both farmers and equipment owners.')}
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
                {t('home.earnHeadline', 'Turn Your Idle Tractor into a Steady Seasonal Income.')}
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                {t('home.earnSubtitle', 'Most agricultural tractors sit idle for 180+ days a year. List on Krishi Mitra to rent to verified progressive farmers in your tehsil with full secure booking payments and zero broker commission.')}
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
                <span className="text-[10px] text-stone-400 font-mono">{t('home.escrowSecure', 'Remaining rental paid directly to owner')}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">{t('home.costPerDay', 'Cost Per Day (₹)')}</label>
                <input type="number" min="0" value={calcRate} onChange={e => setCalcRate(e.target.value)} className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-600 rounded-lg text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t('home.numberOfDays', 'Number of Rental Days')}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={calcDays}
                  onChange={e => setCalcDays(e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>{calcDays} {t('common.days', 'Days')}</span>
                  <span>₹{Number(calcRate || 0).toLocaleString('en-IN')}/{t('common.perDay', 'day')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block">{t('home.calcOutput', 'Estimated Total Rental')}</span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-display">
                    ₹{estimatedGross.toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">
                  {t('home.directOwnerPayment', 'Direct Owner Payment')}
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
                {t('home.safetyTitle', 'Account & Rental Safety')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.safetyDesc', 'KrishiMitra uses authenticated accounts, booking controls, payment verification, and role-based access to support safer rentals.')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                {t('home.disputeTitle', 'Dispute Support')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.disputeDesc', 'Raise a rental dispute through the platform for review by the KrishiMitra admin team.')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold">
                <Wheat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                {t('home.productivityTitle', 'Boost Farm Productivity')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('home.productivityDesc', 'Complete sowing, weeding, spraying, and harvesting in critical weather windows without heavy capital debt.')}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
