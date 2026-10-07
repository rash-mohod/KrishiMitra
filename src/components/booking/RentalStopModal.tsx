import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X } from 'lucide-react';

export const RENTAL_STOP_REASONS = [
  'Machinery problem',
  'Machinery damaged',
  'Machinery not working properly',
  'Weather / natural conditions',
  'Farmer unable to continue',
  'Owner unable to continue',
  'Safety issue',
  'Emergency',
  'Other'
] as const;

interface RentalStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, message?: string) => void;
  submitting?: boolean;
}

export const RentalStopModal: React.FC<RentalStopModalProps> = ({ isOpen, onClose, onSubmit, submitting = false }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const reasonLabel = (value: string) => t(`rentalStop.reason.${value.toLowerCase().replace(/[^a-z]+/g, '_')}`, value);

  const submit = () => {
    if (!reason) return;
    onSubmit(reason, message.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900">{t('rentalStop.title', 'Stop Rental')}</h3>
            <p className="text-xs text-stone-500 mt-1">{t('rentalStop.subtitle', 'Please select a reason before stopping the active rental.')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100" aria-label={t('common.close', 'Close')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-stone-700">{t('rentalStop.reasonLabel', 'Stop Rental Reason')} *</span>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-xl border border-stone-300 p-3 text-sm bg-white">
              <option value="">{t('rentalStop.selectReason', 'Select a reason')}</option>
              {RENTAL_STOP_REASONS.map(item => <option key={item} value={item}>{reasonLabel(item)}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-stone-700">{t('rentalStop.messageLabel', 'Additional message (optional)')}</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full rounded-xl border border-stone-300 p-3 text-sm" placeholder={t('rentalStop.messagePlaceholder', 'Add any helpful details (optional)')} />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold">{t('common.cancel', 'Cancel')}</button>
            <button disabled={!reason || submitting} onClick={submit} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold">
              {submitting ? t('common.loading', 'Loading...') : t('rentalStop.confirm', 'Stop Rental')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
