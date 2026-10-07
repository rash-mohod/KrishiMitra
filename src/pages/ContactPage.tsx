import React, { useEffect, useState } from 'react';
import { Mail, Phone, Send, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { inquiryApi } from '../services/api';
import { SupportInquiry } from '../types';

const TOPICS = [
  'EQUIPMENT_AVAILABILITY',
  'BOOKING_ISSUE',
  'PAYMENT_ISSUE',
  'RENTAL_ISSUE',
  'ACCOUNT_ISSUE',
  'OTHER'
] as const;

export const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('EQUIPMENT_AVAILABILITY');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadInquiries = async () => {
    if (!user || (user.role !== 'FARMER' && user.role !== 'OWNER')) return;
    setIsLoadingInquiries(true);
    try {
      setInquiries(await inquiryApi.getMine());
    } catch (err: any) {
      setError(err?.message || t('contact.loadInquiriesFailed', 'Unable to load your inquiries right now.'));
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'FARMER' && user.role !== 'OWNER') || !message.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      await inquiryApi.create(topic, message.trim());
      setMessage('');
      setSubmitted(true);
      await loadInquiries();
    } catch (err: any) {
      setError(err?.message || t('contact.submitFailed', 'Unable to submit your inquiry. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const topicLabel = (value: string) => t(`inquiry.topic.${value}`, value);

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
          {t('contact.subtitle', 'Have questions about machinery, bookings, payments, or rentals? Send an inquiry and our support team will respond through your account.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">{t('contact.helplineLabel', 'Toll-Free Kisan Helpline')}</span>
                <p className="font-bold text-stone-900 text-sm">1800-120-KRISHI</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">{t('contact.emailLabel', 'Support Desk')}</span>
                <p className="font-bold text-stone-900 text-sm">support@krishimitra.agri.in</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>{t('contact.emergencyTitle', 'Urgent Field Emergency?')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('contact.emergencyDesc', 'If machinery experiences a critical problem during a rental, use the rental stop process or contact the support desk for assistance.')}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {!user ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-3">
              <h3 className="font-bold text-lg text-stone-900 font-display">{t('contact.loginRequiredTitle', 'Login required to submit an inquiry')}</h3>
              <p className="text-xs text-stone-600">{t('contact.loginRequiredDesc', 'Please log in as a Farmer or Owner to send an inquiry. Your account details are added automatically.')}</p>
            </div>
          ) : user.role === 'ADMIN' ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-3">
              <h3 className="font-bold text-lg text-stone-900 font-display">{t('contact.adminManagedTitle', 'User inquiries are managed in the Admin Dashboard')}</h3>
              <p className="text-xs text-stone-600">{t('contact.adminManagedDesc', 'Administrative accounts receive and reply to Farmer and Owner inquiries from the User Inquiries section.')}</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-stone-900 font-display">{t('contact.formTitle', 'Send us a message')}</h3>
                  <p className="text-xs text-stone-500 mt-1">{t('contact.accountDetailsNote', 'Your name, account ID, and role are taken automatically from your signed-in account.')}</p>
                </div>

                {submitted && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold">
                    {t('contact.successDesc', 'Your inquiry was submitted successfully. You can track the reply below.')}
                  </div>
                )}

                {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">{t('contact.topicLabel', 'Inquiry Topic')}</label>
                    <select value={topic} onChange={e => setTopic(e.target.value as (typeof TOPICS)[number])} className="w-full px-3 py-2.5 border border-stone-300 rounded-xl">
                      {TOPICS.map(value => <option key={value} value={value}>{topicLabel(value)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">{t('contact.messageLabel', 'Message / Details')} *</label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={t('contact.messagePlaceholder', 'Describe your equipment, booking, payment, rental, account, or other issue...')}
                      required
                      className="w-full px-3 py-2.5 border border-stone-300 rounded-xl"
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting || !message.trim()} className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? t('contact.submitting', 'Submitting...') : t('contact.submitButton', 'Submit Inquiry')}</span>
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-stone-200">
                  <h3 className="font-bold text-stone-900 font-display">{t('contact.myInquiries', 'My Inquiries')}</h3>
                  <p className="text-xs text-stone-500 mt-1">{t('contact.myInquiriesDesc', 'View your submitted inquiries and administrator replies.')}</p>
                </div>
                {isLoadingInquiries ? (
                  <div className="p-6 text-xs text-stone-500">{t('common.loading', 'Loading...')}</div>
                ) : inquiries.length === 0 ? (
                  <div className="p-6 text-xs text-stone-500">{t('contact.noInquiries', 'You have not submitted any inquiries yet.')}</div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {inquiries.map(inquiry => (
                      <div key={inquiry.id} className="p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">{inquiry.inquiryId}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">{topicLabel(inquiry.topic)}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inquiry.status === 'NEW' ? 'bg-amber-100 text-amber-900' : inquiry.status === 'REPLIED' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800'}`}>
                            {t(`inquiry.status.${inquiry.status}`, inquiry.status)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 whitespace-pre-wrap">{inquiry.message}</p>
                        <p className="text-[10px] text-stone-400">{new Date(inquiry.createdAt).toLocaleString()}</p>
                        {inquiry.adminReply && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t('contact.adminReply', 'Admin Reply')}</p>
                            <p className="text-xs text-emerald-950 whitespace-pre-wrap">{inquiry.adminReply}</p>
                            {inquiry.repliedAt && <p className="text-[10px] text-emerald-700">{new Date(inquiry.repliedAt).toLocaleString()}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
