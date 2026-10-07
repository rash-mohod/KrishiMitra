import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X } from 'lucide-react';

const REASONS = [
  'Machinery unavailable',
  'Machinery maintenance',
  'Schedule conflict',
  'Unable to fulfill request',
  'Other'
] as const;

interface BookingRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting?: boolean;
}

export const BookingRejectModal: React.FC<BookingRejectModalProps> = ({ isOpen, onClose, onSubmit, submitting = false }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  if (!isOpen) return null;
  const label = (value: string) => t(`booking.rejectReason.${value.toLowerCase().replace(/[^a-z]+/g, '_')}`, value);
  const submit = () => {
    if (!reason) return;
    const finalReason = reason === 'Other' && message.trim() ? `Other: ${message.trim()}` : reason;
    onSubmit(finalReason);
  };
  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div><h3 className="font-bold text-stone-900">{t('booking.rejectTitle', 'Reject Booking')}</h3><p className="text-xs text-stone-500 mt-1">{t('booking.rejectSubtitle', 'Select a reason to send to the farmer.')}</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-xl border border-stone-300 p-3 text-sm bg-white">
            <option value="">{t('booking.selectRejectReason', 'Select a rejection reason')}</option>
            {REASONS.map(item => <option key={item} value={item}>{label(item)}</option>)}
          </select>
          {reason === 'Other' && <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full rounded-xl border border-stone-300 p-3 text-sm" placeholder={t('booking.rejectOtherPlaceholder', 'Additional details (optional)')} />}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold">{t('common.cancel', 'Cancel')}</button>
            <button disabled={!reason || submitting} onClick={submit} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold">{submitting ? t('common.loading', 'Loading...') : t('common.reject', 'Reject')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
