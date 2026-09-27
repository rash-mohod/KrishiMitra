import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  Headphones,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Tractor,
  UserCheck,
  Wheat
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {t('howItWorks.badge', 'Transparent Farm Mechanization')}
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-stone-900">
          {t('howItWorks.title', 'How Krishi Mitra Works')}
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          {t('howItWorks.subtitle', 'From finding a 50 HP 4WD tractor to returning a combine harvester post-harvest, here is the complete breakdown of our secure rental workflow.')}
        </p>
      </div>

      {/* Two Columns: For Farmers vs For Owners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FOR FARMERS */}
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              🌾
            </div>
            <div>
              <h2 className="font-bold text-lg text-stone-900 font-display">
                {t('howItWorks.forFarmers', 'For Farmers (Renters)')}
              </h2>
              <p className="text-xs text-stone-500">{t('howItWorks.farmerSubtitle', 'How to get machinery delivered to your field')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step1Farmer', '1. Search & Compare Machinery')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step1FarmerDesc', 'Browse tractors, rotavators, seeders, and harvesters by horsepower, condition grade, and location in your district.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step2Farmer', '2. Request Rental Dates & Driver')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step2FarmerDesc', 'Select your rental calendar days, optionally add a skilled tractor driver/operator, and specify your farm delivery address.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step3Farmer', '3. Escrow Protected Payment')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step3FarmerDesc', 'Pay securely using UPI, Debit Card, or Netbanking. Your the booking advance and platform fee are paid online after owner approval.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step4Farmer', '4. OTP Handover & Complete Work')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step4FarmerDesc', 'Verify the 4-digit handover OTP upon delivery, complete your tillage or harvesting, and return the equipment safely.')}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/equipment')}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <span>{t('hero.findEquipment', 'Search Farm Machinery')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* FOR OWNERS */}
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              🚜
            </div>
            <div>
              <h2 className="font-bold text-lg text-stone-900 font-display">
                {t('howItWorks.forOwners', 'For Equipment Owners')}
              </h2>
              <p className="text-xs text-stone-500">{t('howItWorks.ownerSubtitle', 'How to monetize idle tractors and implements')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step1Owner', '1. Register Machinery with Photos')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step1OwnerDesc', 'Upload implement details, select high-definition preset photos or device pictures, and set your transparent daily rental price.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step2Owner', '2. Review & Accept Bookings')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step2OwnerDesc', 'Receive instant SMS and dashboard alerts when neighboring farmers request your equipment. Accept or decline with one click.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step3Owner', '3. Dispatch Machine or Driver')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step3OwnerDesc', 'Deliver the machine or send your trained driver to the farm address and verify the secure start OTP.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900">{t('howItWorks.step4Owner', '4. Guaranteed Direct Bank Payout')}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {t('howItWorks.step4OwnerDesc', 'Upon rental completion, your full rental payout is released directly into your bank account with zero payment delays.')}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/owner/equipment/add')}
            className="w-full py-3 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <span>{t('hero.listMachinery', 'List Your Machinery')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Trust & Guarantee Grid */}
      <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('howItWorks.protectionPledge', 'Platform Protection Pledge')}</span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold mt-1">
            {t('howItWorks.whyTrustTitle', 'Why 10,000+ Farmers & Owners Trust Krishi Mitra')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-emerald-900/60 border border-emerald-800/80 space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">{t('howItWorks.escrowSafe', 'Secure Payment Workflow')}</h4>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {t('howItWorks.escrowSafeDesc', 'The remaining rental amount is paid directly to the owner by Cash or UPI after the rental is completed.')}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-900/60 border border-emerald-800/80 space-y-2">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">{t('howItWorks.verifiedMachines', 'Verified Machines & Owners')}</h4>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {t('howItWorks.verifiedMachinesDesc', 'All machinery registrations undergo document verification including RC book, horsepower rating, and condition photos.')}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-900/60 border border-emerald-800/80 space-y-2">
            <Headphones className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">{t('howItWorks.kisanHelpline', '24/7 Kisan Helpline')}</h4>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {t('howItWorks.kisanHelplineDesc', 'Toll-free telephone assistance in Hindi, Marathi, Punjabi, Tamil, Telugu, and English for all booking support.')}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
