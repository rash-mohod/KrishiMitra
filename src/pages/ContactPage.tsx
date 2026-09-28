import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Phone, Send, ShieldAlert } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('EQUIPMENT_SUPPORT');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {t('contact.badge', '24/7 Kisan Agri-Support')}
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900">
          {t('contact.title', 'Get in Touch with Krishi Mitra')}
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm">
          {t('contact.subtitle', 'Have questions about machinery dispatch, escrow payments, or Custom Hiring Center partnerships? Our agronomy desk is here to assist.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">
                  {t('contact.helplineLabel', 'Toll-Free Kisan Helpline')}
                </span>
                <p className="font-bold text-stone-900 text-sm">
                  1800-120-KRISHI
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">
                  {t('contact.emailLabel', 'Support & Escrow Desk')}
                </span>
                <p className="font-bold text-stone-900 text-sm">
                  support@krishimitra.agri.in
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>{t('contact.emergencyTitle', 'Urgent Field Emergency?')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('contact.emergencyDesc', 'If machinery experiences breakdown during critical sowing windows, call our emergency dispatch hotline for immediate local backup deployment.')}
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-stone-200 shadow-xl space-y-6">
          <h3 className="font-bold text-lg text-stone-900 font-display">
            {t('contact.formTitle', 'Send us a message')}
          </h3>

          {submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <p className="font-bold text-emerald-900 text-base">
                {t('contact.successTitle', 'Thank you for contacting Krishi Mitra!')}
              </p>
              <p className="text-xs text-emerald-700">
                {t('contact.successDesc', 'Our district agronomist coordinator will call your mobile number shortly.')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('common.name', 'Your Name')} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Suresh Patil"
                    required
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('common.phone', 'Mobile Number')} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98220 00000"
                    required
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('contact.topicLabel', 'Inquiry Topic')}
                </label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl"
                >
                  <option value="EQUIPMENT_SUPPORT">
                    {t('contact.topicEquipment', 'Machinery Availability & Custom Hiring')}
                  </option>
                  <option value="PAYMENT_ESCROW">
                    {t('contact.topicPayment', 'Escrow Payments & Refund Inquiry')}
                  </option>
                  <option value="OWNER_ONBOARDING">
                    {t('contact.topicOwner', 'Listing Multiple Tractors / CHC Partnership')}
                  </option>
                  <option value="DISPUTE">
                    {t('contact.topicDispute', 'Escalating Rental Dispute')}
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('contact.messageLabel', 'Message / Farm Details')} *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('contact.messagePlaceholder', 'Provide your district, required machinery, and dates...')}
                  required
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t('contact.submitButton', 'Submit Inquiry')}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
