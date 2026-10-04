import React, { useState } from 'react';
import { Booking, UserRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, CheckCircle2, Clock, MapPin, MessageSquare, Tractor, User, X } from 'lucide-react';

interface BookingDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  userRole: UserRole | null;
  onClose: () => void;
  onAcceptBooking?: (notes?: string) => void;
  onRejectBooking?: (reason?: string) => void;
  onCancelBooking?: (reason: string) => void;
  onRaiseDispute?: () => void;
  onReview?: () => void;
  onRefresh?: () => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  booking,
  isOpen,
  userRole,
  onClose,
  onAcceptBooking,
  onRejectBooking,
  onCancelBooking,
  onRaiseDispute,
  onReview,
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  if (!isOpen || !booking) return null;

  const farmer = userRole === 'FARMER';
  const owner = userRole === 'OWNER';
  const steps: [string, boolean][] = [
    [t('booking.requested', 'Requested'), true],
    [t('booking.ownerDecision', 'Owner decision'), ['ACCEPTED', 'ACTIVE', 'COMPLETED'].includes(booking.status)],
    [t('booking.rentalActive', 'Rental active'), ['ACTIVE', 'COMPLETED'].includes(booking.status)],
    [t('booking.completed', 'Completed'), booking.status === 'COMPLETED'],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
        <div className="p-5 border-b flex justify-between items-start bg-stone-50">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">{booking.bookingCode}</h3>
              <p className="text-xs text-stone-500">{booking.equipmentName}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={t('common.close', 'Close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {steps.map(([label, done], i) => (
              <div key={i} className="text-center">
                <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <p className="text-[10px] mt-1 text-stone-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-4 space-y-3">
            <h4 className="font-bold text-sm">{t('booking.rentalDetails', 'Rental Details')}</h4>
            <p className="text-xs flex gap-2">
              <Calendar className="w-4 h-4" /> {booking.startDate} {t('common.to', 'to')} {booking.endDate} ({booking.durationDays} {t('common.days', 'days')})
            </p>
            <p className="text-xs flex gap-2">
              <MapPin className="w-4 h-4" /> {booking.pickupAddress || booking.equipmentLocation}
            </p>
            <p className="text-xs flex gap-2">
              <User className="w-4 h-4" /> {t('booking.farmer', 'Farmer')}: {booking.farmerName} • {t('booking.owner', 'Owner')}: {booking.ownerName}
            </p>
            <div className="pt-3 border-t flex justify-between">
              <span className="font-semibold text-xs">{t('booking.dailyRate', 'Daily rate')}</span>
              <b>₹{booking.pricePerDay.toLocaleString('en-IN')}</b>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-xs">{t('common.total', 'Total')}</span>
              <b className="text-emerald-700">₹{booking.totalAmount.toLocaleString('en-IN')}</b>
            </div>
          </div>

          {booking.notes && (
            <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-600">
              <b>{t('booking.farmerNote', 'Farmer note:')}</b> {booking.notes}
            </div>
          )}
          {booking.ownerNotes && (
            <div className="bg-emerald-50 rounded-xl p-4 text-xs text-emerald-900">
              <b>{t('booking.ownerNote', 'Owner note:')}</b> {booking.ownerNotes}
            </div>
          )}
          {booking.rejectionReason && (
            <div className="bg-red-50 rounded-xl p-4 text-xs text-red-800">
              <b>{t('booking.rejectionReason', 'Rejection reason:')}</b> {booking.rejectionReason}
            </div>
          )}
          {booking.cancellationReason && (
            <div className="bg-red-50 rounded-xl p-4 text-xs text-red-800">
              <b>{t('booking.cancellationReason', 'Cancellation reason:')}</b> {booking.cancellationReason}
            </div>
          )}

          {owner && booking.status === 'PENDING' && (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="font-bold text-sm text-emerald-900">{t('booking.reviewRequest', 'Review request')}</h4>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t('booking.optionalRejectionReason', 'Optional note / rejection reason')}
                className="w-full rounded-lg border p-2 text-xs"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={() => onAcceptBooking?.(reason || undefined)} className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold">
                  {t('common.accept', 'Accept')}
                </button>
                <button onClick={() => onRejectBooking?.(reason || t('booking.defaultRejectionReason', 'Dates are not available.'))} className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold">
                  {t('common.reject', 'Reject')}
                </button>
              </div>
            </div>
          )}

          {farmer && ['PENDING', 'ACCEPTED'].includes(booking.status) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
              <h4 className="font-bold text-sm text-red-900">{t('booking.cancelBooking', 'Cancel booking')}</h4>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t('booking.cancellationReasonPlaceholder', 'Reason for cancellation')}
                className="w-full rounded-lg border p-2 text-xs"
                rows={2}
              />
              <button onClick={() => onCancelBooking?.(reason || t('booking.defaultCancellationReason', 'Change in farming schedule.'))} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold">
                {t('booking.cancelBooking', 'Cancel Booking')}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {onRaiseDispute && (
              <button onClick={onRaiseDispute} className="px-3 py-2 rounded-lg bg-stone-100 text-stone-700 text-xs font-bold">
                {t('detail.raiseDispute', 'Raise Dispute')}
              </button>
            )}
            {onReview && booking.status === 'COMPLETED' && (
              <button onClick={onReview} className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {t('common.review', 'Review')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
