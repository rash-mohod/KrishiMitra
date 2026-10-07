import React, { useState } from 'react';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { disputeApi } from '../../services/api';
import { AlertCircle, CheckCircle2, ShieldAlert, X } from 'lucide-react';

interface DisputeModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reason, setReason] = useState('EQUIPMENT_BREAKDOWN');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !booking || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await disputeApi.createDispute({
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        raisedByUserId: user.id,
        raisedByRole: user.role,
        reason,
        description: description.trim()
      });

      setSuccessMessage(`${t('dispute.successPrefix', 'Dispute successfully filed for booking')} ${booking.bookingCode}. ${t('dispute.successSuffix', 'Krishi Mitra AgTech Moderator has been alerted.')}`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || t('dispute.submitError', 'Failed to submit dispute. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">{t('dispute.title', 'Raise Rental Dispute')}</h3>
              <p className="text-xs text-stone-500">{booking.bookingCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t('dispute.category', 'Dispute Category')}
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="EQUIPMENT_BREAKDOWN">{t('dispute.equipmentBreakdown', 'Machinery Breakdown / Functional Defect')}</option>
              <option value="LATE_DELIVERY">{t('dispute.lateDelivery', 'Delayed Delivery / Handover Non-compliance')}</option>
              <option value="OPERATOR_ABSENT">{t('dispute.operatorAbsent', 'Operator Not Present or Unskilled')}</option>
              <option value="DAMAGE_CLAIM">{t('dispute.damageClaim', 'Dispute on Fuel or Damage Claims')}</option>
              <option value="OTHER">{t('dispute.other', 'Other Issues')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t('dispute.description', 'Detailed Description')}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('dispute.descriptionPlaceholder', 'Explain the incident with specific timelines so our agricultural moderators can arbitrate fairly...')}
              className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
            {t('dispute.paymentRecordsNotice', 'Disputes are reviewed using the booking, payment, and communication records available to the platform.')}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMessage}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? t('dispute.submitting', 'Submitting...') : t('dispute.submit', 'Submit to Moderator')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
