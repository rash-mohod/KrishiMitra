import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Sprout, Tractor } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {t('about.badge', 'Democratizing Agricultural Mechanization')}
        </span>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-stone-900">
          {t('about.title', 'About Krishi Mitra')}
        </h1>

        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          {t(
            'about.subtitle',
            'Over 85% of Indian farmers operate on small and marginal landholdings, making heavy machinery ownership financially unviable. Krishi Mitra bridges this gap with on-demand, peer-to-peer equipment rentals.'
          )}
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Mission */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Sprout className="w-6 h-6" />
          </div>

          <h3 className="font-display font-bold text-lg text-stone-900">
            {t('about.mission', 'Our Mission')}
          </h3>

          <p className="text-xs text-stone-600 leading-relaxed">
            {t(
              'about.missionDesc',
              'To increase crop yields by 25% and reduce input labor costs by 40% through timely access to modern farm machinery without capital debt.'
            )}
          </p>
        </div>

        {/* Fleet Monetization */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Tractor className="w-6 h-6" />
          </div>

          <h3 className="font-display font-bold text-lg text-stone-900">
            {t('about.monetization', 'Fleet Monetization')}
          </h3>

          <p className="text-xs text-stone-600 leading-relaxed">
            {t(
              'about.monetizationDesc',
              'Helping progressive tractor owners and Custom Hiring Centers achieve up to 300% higher asset utilization during sowing and harvest cycles.'
            )}
          </p>
        </div>

        {/* Trusted Ecosystem */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h3 className="font-display font-bold text-lg text-stone-900">
            {t('about.trustedEco', 'Trusted Ecosystem')}
          </h3>

          <p className="text-xs text-stone-600 leading-relaxed">
            {t(
              'about.trustedEcoDesc',
              'Building trust through document verification, transparent booking and cancellation rules, and decentralized State Ag Extension dispute resolution.'
            )}
          </p>
        </div>

      </div>

    </div>
  );
};
