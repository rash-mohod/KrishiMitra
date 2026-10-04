import React from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  ListChecks,
  MessageCircle,
  Search,
  ShieldCheck,
  Tractor,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const HowItWorksPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {t('howWorksV2.badge', 'Transparent Farm Equipment Rental')}
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-stone-900">
          {t('howWorksV2.title', 'How Krishi Mitra Works')}
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          {t(
            'howWorksV2.subtitle',
            'A simple digital workflow for finding agricultural equipment, checking availability, requesting a rental, completing the required payment, and managing the rental.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-stone-900">
                {t('howWorksV2.farmerTitle', 'For Farmers (Renters)')}
              </h2>
              <p className="text-[11px] text-stone-500">
                {t('howWorksV2.farmerSubtitle', 'Find and rent suitable agricultural machinery')}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <WorkflowStep number="1" icon={<Search className="w-4 h-4" />} title={t('howWorksV2.farmerStep1Title', 'Search & Compare Equipment')} description={t('howWorksV2.farmerStep1Desc', 'Browse listed tractors, harvesters, seeders, rotavators, sprayers, trailers, and other agricultural machinery using search and available filters.')} />
            <WorkflowStep number="2" icon={<CalendarCheck className="w-4 h-4" />} title={t('howWorksV2.farmerStep2Title', 'Check Availability & Request Booking')} description={t('howWorksV2.farmerStep2Desc', 'Select suitable rental dates, review the displayed rental price and other details, and submit a booking request for available equipment.')} />
            <WorkflowStep number="3" icon={<UserCheck className="w-4 h-4" />} title={t('howWorksV2.farmerStep3Title', 'Wait for Owner Approval')} description={t('howWorksV2.farmerStep3Desc', 'The equipment owner reviews the request and can accept or decline it based on the requested dates and rental details.')} />
            <WorkflowStep number="4" icon={<CreditCard className="w-4 h-4" />} title={t('howWorksV2.farmerStep4Title', 'Complete Booking Payment')} description={t('howWorksV2.farmerStep4Desc', 'After owner acceptance, complete the required online booking payment and applicable platform fee through the integrated Razorpay payment flow. Payment verification is required for confirmation.')} />
            <WorkflowStep number="5" icon={<CheckCircle2 className="w-4 h-4" />} title={t('howWorksV2.farmerStep5Title', 'Use the Machinery & Complete the Rental')} description={t('howWorksV2.farmerStep5Desc', 'Use the machinery during the confirmed rental period. After completion, record the remaining rental payment using the payment options provided by the platform.')} />

            <button
              onClick={() => { window.location.hash = '#/equipment'; }}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-2.5 text-xs font-bold transition"
            >
              {t('howWorksV2.farmerCta', 'Find Farm Equipment')} →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-stone-900">
                {t('howWorksV2.ownerTitle', 'For Equipment Owners')}
              </h2>
              <p className="text-[11px] text-stone-500">
                {t('howWorksV2.ownerSubtitle', 'List machinery and manage rental requests')}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <WorkflowStep number="1" icon={<FileText className="w-4 h-4" />} title={t('howWorksV2.ownerStep1Title', 'List Machinery with Details')} description={t('howWorksV2.ownerStep1Desc', 'Add machinery information, photos, category, location, condition, rental rate, security deposit where applicable, and operator availability where supported.')} />
            <WorkflowStep number="2" icon={<ListChecks className="w-4 h-4" />} title={t('howWorksV2.ownerStep2Title', 'Review Booking Requests')} description={t('howWorksV2.ownerStep2Desc', 'Review incoming rental requests, requested dates, farmer details, and booking information before accepting or declining a request.')} />
            <WorkflowStep number="3" icon={<CalendarCheck className="w-4 h-4" />} title={t('howWorksV2.ownerStep3Title', 'Accept the Rental Request')} description={t('howWorksV2.ownerStep3Desc', 'Accept a suitable request so the farmer can proceed with the required booking payment. A booking is confirmed only after the applicable payment is successfully verified.')} />
            <WorkflowStep number="4" icon={<MessageCircle className="w-4 h-4" />} title={t('howWorksV2.ownerStep4Title', 'Coordinate the Rental')} description={t('howWorksV2.ownerStep4Desc', 'Coordinate pickup, delivery, operator requirements, and other practical rental details with the farmer using the available platform communication features.')} />
            <WorkflowStep number="5" icon={<CheckCircle2 className="w-4 h-4" />} title={t('howWorksV2.ownerStep5Title', 'Complete the Rental')} description={t('howWorksV2.ownerStep5Desc', 'After the rental period, manage the rental completion and remaining payment through the owner dashboard using the available payment options.')} />

            <button
              onClick={() => { window.location.hash = '#/owner/equipment/add'; }}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl py-2.5 text-xs font-bold transition"
            >
              {t('howWorksV2.ownerCta', 'List Your Machinery')} →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-emerald-950 rounded-3xl p-6 sm:p-8 text-white">
        <div className="mb-6">
          <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            {t('howWorksV2.infoBadge', 'Platform Information')}
          </p>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl mt-1">
            {t('howWorksV2.infoTitle', 'A Clear and Transparent Rental Process')}
          </h2>
          <p className="text-emerald-100/75 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
            {t(
              'howWorksV2.infoSubtitle',
              'Krishi Mitra provides digital tools for discovering equipment, checking availability, managing bookings, processing supported payments, and tracking rental completion.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            icon={<CreditCard className="w-5 h-5" />}
            title={t('howWorksV2.infoPaymentTitle', 'Secure Online Booking Payment')}
            description={t('howWorksV2.infoPaymentDesc', 'Razorpay is integrated for supported online booking payments. Payment verification is performed before the booking is confirmed.')}
          />
          <InfoCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title={t('howWorksV2.infoListingTitle', 'Equipment Listing Information')}
            description={t('howWorksV2.infoListingDesc', 'Equipment listings provide details such as machinery type, photos, pricing, condition, location, and availability information to help users evaluate rental options.')}
          />
          <InfoCard
            icon={<MessageCircle className="w-5 h-5" />}
            title={t('howWorksV2.infoSupportTitle', 'Booking & Rental Management')}
            description={t('howWorksV2.infoSupportDesc', 'Farmers and equipment owners can manage booking requests, rental dates, booking status, communication, and rental completion through their respective dashboards.')}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
        <Globe2 className="w-4 h-4 text-emerald-600" />
        <span>
          {t('howWorksV2.languageNote', 'The platform interface supports multiple Indian languages through the built-in language selector.')}
        </span>
      </div>
    </div>
  );
};

interface WorkflowStepProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ number, icon, title, description }) => (
  <div className="flex gap-3">
    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
      {number}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-emerald-700">{icon}</span>
        <h3 className="font-bold text-xs text-stone-900">{title}</h3>
      </div>
      <p className="text-[10px] text-stone-500 leading-relaxed mt-1.5">{description}</p>
    </div>
  </div>
);

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, description }) => (
  <div className="bg-emerald-900/70 border border-emerald-800 rounded-2xl p-5">
    <div className="w-9 h-9 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="font-bold text-sm text-white">{title}</h3>
    <p className="text-[11px] text-emerald-100/75 leading-relaxed mt-1.5">{description}</p>
  </div>
);
