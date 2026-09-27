import React, { useState } from 'react';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { reviewApi } from '../../services/api';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback about equipment performance and owner communication.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reviewApi.createReview({
        bookingId: booking.id,
        equipmentId: booking.equipmentId,
        reviewer: user,
        rating,
        comment
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Rate Your Experience</h3>
            <p className="text-xs text-stone-500">{booking.equipmentName}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Overall Equipment & Service Rating
            </label>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-2xl transition hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating !== null ? star <= hoverRating : star <= rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 mt-1 inline-block">
              {rating === 5 && 'Outstanding Condition & Operator'}
              {rating === 4 && 'Very Good Service'}
              {rating === 3 && 'Average / Acceptable'}
              {rating === 2 && 'Below Expectations'}
              {rating === 1 && 'Poor / Machinery Issues'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Share Your Feedback
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="How was the equipment condition, fuel consumption, and owner responsiveness?"
              className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? 'Publishing Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
