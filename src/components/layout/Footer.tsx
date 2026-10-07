import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Award, CheckCircle2, Globe, Phone, ShieldCheck, Tractor } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">

      {/* Trust Badges Row */}
      <div className="border-b border-stone-800 py-8 bg-stone-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">{t('trust.verifiedTitle', 'Verified Farm Equipment')}</h4>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                {t('trust.verifiedDesc', 'Every tractor and implement is inspected & document-verified before listing.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">{t('trust.pricingTitle', 'Transparent Fixed Pricing')}</h4>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                {t('trust.pricingDesc', 'Authoritative hourly, daily, and weekly rates. Zero hidden surcharges or broker fees.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">{t('trust.paymentTitle', 'Verified Booking Process')}</h4>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                {t('trust.paymentDesc', 'Booking requests are confirmed after owner approval and successful payment verification.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Multilingual Selector Strip */}
      <div className="border-b border-stone-800/80 bg-stone-950/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t('lang.availableIn', 'Available in 9 Indian Languages')}:</span>
          </div>
          <LanguageSelector variant="chips" />
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Col 1: Brand & Helpline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Tractor className="w-5 h-5" />
              </div>
              <span className="font-display font-extrabold text-xl text-white">
                Krishi<span className="text-emerald-400">Mitra</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              {t('footer.about', 'Empowering Indian farmers through affordable custom hiring of high-capacity tractors, combine harvesters, rotavators, and modern farm machinery.')}
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700 text-xs text-stone-200">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('common.kisanHelpline', 'Kisan Helpline:')} <strong>1800-120-KRISHI</strong></span>
              </div>
            </div>
          </div>

          {/* Col 2: Agricultural Machinery */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 font-display">{t('home.browseByCategory', 'Machinery Categories')}</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><button onClick={() => onNavigate('/equipment?category=cat-tractors')} className="hover:text-emerald-400 transition text-left">{t('category.tractors', 'Utility & 4WD Tractors (35-75 HP)')}</button></li>
              <li><button onClick={() => onNavigate('/equipment?category=cat-harvesters')} className="hover:text-emerald-400 transition text-left">{t('category.harvesters', 'Multi-Crop Combine Harvesters')}</button></li>
              <li><button onClick={() => onNavigate('/equipment?category=cat-rotavators')} className="hover:text-emerald-400 transition text-left">{t('category.rotavators', 'Rotavators & Rotary Tillers')}</button></li>
              <li><button onClick={() => onNavigate('/equipment?category=cat-seeders')} className="hover:text-emerald-400 transition text-left">{t('category.seeders', 'Super Seeders & Zero-Till Drills')}</button></li>
              <li><button onClick={() => onNavigate('/equipment?category=cat-sprayers')} className="hover:text-emerald-400 transition text-left">{t('category.sprayers', 'Tractor-Mounted Boom Sprayers')}</button></li>
              <li><button onClick={() => onNavigate('/equipment?category=cat-balers')} className="hover:text-emerald-400 transition text-left">{t('category.balers', 'Laser Land Levelers & Balers')}</button></li>
            </ul>
          </div>

          {/* Col 3: Platform & Dashboards */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 font-display">{t('footer.quickLinks', 'Portals & Workflows')}</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><button onClick={() => onNavigate('/farmer/dashboard')} className="hover:text-emerald-400 transition text-left">{t('dash.farmerWelcome', 'Farmer Rental Dashboard')}</button></li>
              <li><button onClick={() => onNavigate('/owner/dashboard')} className="hover:text-emerald-400 transition text-left">{t('dash.ownerWelcome', 'Equipment Owner Portal & Fleet Hub')}</button></li>
              <li><button onClick={() => onNavigate('/owner/equipment/add')} className="hover:text-emerald-400 transition text-left">{t('home.listMachinery', 'List Machinery for Rent')}</button></li>
              <li><button onClick={() => onNavigate('/admin/dashboard')} className="hover:text-emerald-400 transition text-left">{t('dash.adminWelcome', 'State Extension & Moderation Admin')}</button></li>
              <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-emerald-400 transition text-left">{t('nav.howItWorks', 'How Krishi Mitra Works')}</button></li>
            </ul>
          </div>

          {/* Col 4: Trust & Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 font-display">{t('footer.securityCompliance', 'Security & Compliance')}</h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <p className="leading-relaxed">
                {t('footer.securePaymentsDesc', 'Secure online payments are supported through Razorpay for eligible booking payments.')}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded text-[10px] font-mono border border-stone-700">{t('footer.securePayments', 'Secure Payments')}</span>
                <span className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded text-[10px] font-mono border border-stone-700">{t('footer.verifiedTransactions', 'Verified Transactions')}</span>
                <span className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded text-[10px] font-mono border border-stone-700">{t('footer.bookingProtection', 'Booking Protection')}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/contact')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-xs"
                >
                  {t('detail.raiseDispute', 'File a Rental Dispute or Request Help')} →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Krishi Mitra AgTech Platform. {t('footer.rights', 'All rights reserved. Dedicated to the Prosperity of Indian Farmers.')}</p>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate('/about')} className="hover:text-stone-300">{t('nav.about', 'About')}</button>
            <button onClick={() => onNavigate('/how-it-works')} className="hover:text-stone-300">{t('nav.howItWorks', 'Rental Terms')}</button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-stone-300">{t('nav.contact', 'Contact Support')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
