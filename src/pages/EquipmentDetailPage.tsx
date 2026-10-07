import React, { useEffect, useState } from 'react';
import { Booking, Equipment, Review } from '../types';
import { bookingApi, chatApi, equipmentApi, reviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EquipmentCard } from '../components/equipment/EquipmentCard';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Heart,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Tractor,
  UserCheck,
  Zap
} from 'lucide-react';

interface EquipmentDetailPageProps {
  equipmentId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
  onBookingCreated: (booking: Booking) => void;
}

export const EquipmentDetailPage: React.FC<EquipmentDetailPageProps> = ({
  equipmentId,
  onBack,
  onNavigate,
  onBookingCreated
}) => {
  const { user, role, favorites, toggleFavorite } = useAuth();
  const { t, translateCategory, translateCondition, translateFuel } = useLanguage();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarEquipment, setSimilarEquipment] = useState<Equipment[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Form State
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [operatorIncluded, setOperatorIncluded] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<{ isAvailable: boolean; reason?: string }>({ isAvailable: true });

  // Direct Message State
  const [directMsgText, setDirectMsgText] = useState('');
  const [isSendingDirectMsg, setIsSendingDirectMsg] = useState(false);
  const [directMsgSuccess, setDirectMsgSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadEquipmentDetails();
  }, [equipmentId]);

  useEffect(() => {
    if (user?.village) {
      setPickupAddress(`${user.village}, ${user.district}, ${user.state}`);
    }
  }, [user]);

  useEffect(() => {
    validateDates();
  }, [startDate, endDate, equipment?.id]);

  const loadEquipmentDetails = async () => {
    setIsLoading(true);
    try {
      const eq = await equipmentApi.getEquipmentById(equipmentId);
      setEquipment(eq);

      if (eq) {
        const revs = await reviewApi.getEquipmentReviews(eq.id);
        setReviews(revs);

        const all = await equipmentApi.getEquipmentList({ category: eq.categoryId });
        setSimilarEquipment((all?.items || []).filter(item => item.id !== eq.id).slice(0, 3));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateDates = async () => {
  if (!equipment) return;

  // Make sure both dates are selected
  if (!startDate || !endDate) {
    setAvailabilityCheck({ isAvailable: false });
    setBookingError('Please select both rental start and end dates.');
    return;
  }

  // Start date must not be after end date
  if (startDate > endDate) {
    setAvailabilityCheck({ isAvailable: false });
    setBookingError('Rental start date cannot be after the rental end date.');
    return;
  }

  // Dates are valid, so check equipment availability
  const res = await equipmentApi.checkAvailability(
    equipment.id,
    startDate,
    endDate
  );

  setAvailabilityCheck(res);

  if (!res.isAvailable) {
    setBookingError(
      res.reason || 'Not available for selected dates.'
    );
  } else {
    setBookingError(null);
  }
};

  const handleChatWithOwner = async (customInitialMessage?: string) => {
    if (!equipment) return;
    if (!user) {
      onNavigate('/login');
      return;
    }
    if (user.id === equipment.ownerId) {
      onNavigate('/messages');
      return;
    }

    try {
      const msg = customInitialMessage || `Namaste ${equipment.ownerName} ji, I am interested in renting your ${equipment.name} (${equipment.horsepower ? equipment.horsepower + ' HP' : ''}). Is it available for upcoming field operations?`;
      const conv = await chatApi.getOrCreateConversation({
        currentUserId: user.id,
        targetUserId: equipment.ownerId,
        type: 'RENTER_OWNER',
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentImage: equipment.images[0],
        equipmentRate: equipment.pricePerDay,
        topic: `Rental Inquiry for ${equipment.name}`,
        initialMessage: msg
      });

      onNavigate(`/messages?id=${conv.id}`);
    } catch (err) {
      console.error('Failed to initiate chat:', err);
    }
  };

  const handleSendDirectMessageInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || !directMsgText.trim()) return;

    if (!user) {
      onNavigate('/login');
      return;
    }

    setIsSendingDirectMsg(true);
    setDirectMsgSuccess(null);

    try {
      const conv = await chatApi.getOrCreateConversation({
        currentUserId: user.id,
        targetUserId: equipment.ownerId,
        type: 'RENTER_OWNER',
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentImage: equipment.images[0],
        equipmentRate: equipment.pricePerDay,
        topic: `Rental Inquiry for ${equipment.name}`,
        initialMessage: directMsgText.trim()
      });

      setDirectMsgText('');
      setDirectMsgSuccess(`Message sent directly to ${equipment.ownerName}!`);
    } catch (err) {
      console.error('Failed to send direct message:', err);
    } finally {
      setIsSendingDirectMsg(false);
    }
  };

  if (isLoading || !equipment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-stone-500">{t('common.loading', 'Loading machinery specifications...')}</p>
      </div>
    );
  }

  // Calculate live authoritative price
  const priceBreakdown = bookingApi.calculatePrice(equipment, startDate, endDate, operatorIncluded);
  const isFav = favorites.includes(equipment.id);
  const isOwnerViewer = role === 'OWNER' || role === 'ADMIN';

  const handleRequestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('/login');
      return;
    }

    if (role !== 'FARMER') {
      setBookingError('Only farmer accounts can submit machinery booking requests.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const newBooking = await bookingApi.createBooking({
        equipmentId: equipment.id,
        farmer: user,
        startDate,
        endDate,
        operatorIncluded,
        pickupAddress,
        notes
      });

      onBookingCreated(newBooking);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit booking request.');
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition py-1.5 px-3 rounded-lg hover:bg-stone-100"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('detail.backToCatalog', 'Back to Equipment Catalog')}</span>
        </button>

        <button
          onClick={() => toggleFavorite(equipment.id)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
            isFav
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
          <span>{isFav ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
        </button>
      </div>

      {/* Main Grid: Left Details + Right Booking Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Gallery, Specs, Owner Info, Reviews */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-16/10 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 relative shadow-sm">
              <img
                src={equipment.images[selectedImageIdx] || equipment.images[0]}
                alt={equipment.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                {translateCategory(equipment.categoryId || equipment.categoryName)}
              </span>
              <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-stone-900 text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                {translateCondition(equipment.condition)}
              </span>
            </div>

            {/* Thumbnails */}
            {equipment.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {equipment.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      selectedImageIdx === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Heading & Meta */}
          <div className="space-y-3 border-b border-stone-200 pb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded">
                {t('common.brand', 'Brand')}: {equipment.brand}
              </span>
              <span className="bg-stone-100 text-stone-700 font-medium px-2.5 py-0.5 rounded">
                {t('common.model', 'Model')}: {equipment.model} ({equipment.manufacturingYear})
              </span>
              {equipment.horsepower && (
                <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>{equipment.horsepower} {t('detail.hpEngine', 'HP Engine')}</span>
                </span>
              )}
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
              {equipment.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{equipment.rating.toFixed(1)}</span>
                <span className="text-stone-400 font-normal">({reviews.length} {t('common.reviews', 'reviews')})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>{equipment.location}, {equipment.district}, {equipment.state}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-stone-400" />
                <span>{equipment.totalRentals} {t('detail.completedRentals', 'completed rentals')}</span>
              </div>
            </div>
          </div>

          {/* Overview Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 text-base font-display">{t('detail.overview', 'Machinery Overview')}</h3>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {equipment.description}
            </p>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 text-base font-display">{t('detail.specs', 'Technical Specifications')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-500 block">{t('common.fuelType', 'Fuel Type')}</span>
                <span className="text-xs font-bold text-stone-900">{translateFuel(equipment.fuelType)}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-500 block">{t('common.condition', 'Condition')}</span>
                <span className="text-xs font-bold text-stone-900">{translateCondition(equipment.condition)}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-500 block">{t('common.operatorAvailable', 'Driver/Operator')}</span>
                <span className="text-xs font-bold text-stone-900">
                  {equipment.operatorAvailable ? `${t('detail.available', 'Available')} (+₹${equipment.operatorCostPerDay}/${t('common.perDay', 'day')})` : t('common.selfOperated', 'Self-operated')}
                </span>
              </div>

              {/* Dynamic specs dictionary */}
              {equipment.specifications && Object.entries(equipment.specifications).map(([k, v]) => (
                <div key={k} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[11px] text-stone-500 block truncate">{k}</span>
                  <span className="text-xs font-bold text-stone-900 truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 text-sm font-display flex items-center justify-between">
              <span>{t('detail.ownerDetails', 'Equipment Owner Profile')}</span>
              {equipment.ownerVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('common.verifiedOwner', 'Verified Owner')}</span>
                </span>
              )}
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                {equipment.ownerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900 truncate">{equipment.ownerName}</p>
                <p className="text-xs text-stone-500 truncate">{equipment.district}, {equipment.state}</p>
              </div>

              {role === 'FARMER' && (
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChatWithOwner()}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Message Equipment Owner"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('chat.chatWithOwner', 'Message Owner')}</span>
                </button>
                <a
                  href={`tel:${equipment.ownerPhone}`}
                  className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition"
                  title="Call Owner"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
              )}
            </div>
          </div>

          {/* Direct In-Page Message & Inquiry Section */}
          {role === 'FARMER' && (
          <div className="p-6 bg-white rounded-3xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 font-display">
                    {t('detail.sendDirectMessageTo', 'Send Direct Message to')} {equipment.ownerName}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {t('detail.directMsgHint', 'Ask about delivery schedule, operator availability, soil condition, or custom pricing.')}
                  </p>
                </div>
              </div>
            </div>

            {directMsgSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{directMsgSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/messages')}
                  className="underline font-bold text-xs hover:text-emerald-950"
                >
                  {t('chat.viewInChat', 'View in Chat')} &rarr;
                </button>
              </div>
            )}

            <form onSubmit={handleSendDirectMessageInline} className="space-y-3">
              <textarea
                rows={2}
                value={directMsgText}
                onChange={e => setDirectMsgText(e.target.value)}
                placeholder={`Namaste ${equipment.ownerName} ji, is this ${equipment.name} available with operator for ploughing next week?`}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition leading-relaxed"
              />

              {/* 1-Click Quick Inquiries */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {t('chat.quickInquiries', 'Quick Inquiries:')}
                </span>
                <button
                  type="button"
                  onClick={() => setDirectMsgText(`Namaste ${equipment.ownerName} ji, is this tractor available for rental next Monday?`)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 text-[11px] rounded-lg border border-stone-200 transition"
                >
                  {t('chat.availNextWeek', 'Availability next week?')}
                </button>
                <button
                  type="button"
                  onClick={() => setDirectMsgText(`Namaste ${equipment.ownerName} ji, do you provide delivery directly to farm gate in our village?`)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 text-[11px] rounded-lg border border-stone-200 transition"
                >
                  {t('chat.farmGateDelivery', 'Farm gate delivery?')}
                </button>
                <button
                  type="button"
                  onClick={() => setDirectMsgText(`Namaste ${equipment.ownerName} ji, does the machine come with driver and fuel included?`)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 text-[11px] rounded-lg border border-stone-200 transition"
                >
                  {t('chat.driverFuelIncluded', 'Driver & Fuel included?')}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleChatWithOwner(directMsgText || undefined)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('chat.openFullChat', 'Open Full Chat Screen')}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSendingDirectMsg || !directMsgText.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingDirectMsg ? t('common.sending', 'Sending...') : t('detail.sendMsgBtn', 'Send Message to Owner')}</span>
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-base font-display">
                {t('detail.customerReviews', 'Farmer Reviews & Ratings')} ({reviews.length})
              </h3>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-stone-500 italic">{t('detail.noReviews', 'No reviews yet for this equipment. Be the first to rent!')}</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 bg-white rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">{rev.reviewerName || 'Anonymous Farmer'}</span>
                        <span className="text-[10px] text-stone-400">({rev.reviewerRole === 'FARMER' ? t('role.farmer', 'Farmer') : rev.reviewerRole})</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600">{rev.comment}</p>
                    <span className="text-[10px] text-stone-400 block">{rev.createdAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Booking Sidebar / Owner Analysis */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          {isOwnerViewer ? (
            <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-lg space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{t('detail.ownerMarketAnalysis', 'Owner Market Analysis')}</h3>
                  <p className="text-xs text-stone-500">{t('detail.compareOwnerPricing', "Compare another owner's rental pricing.")}</p>
                </div>
              </div>

              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">{t('marketplace.pricePerDay', 'Rental Rate')}</span>
                <div className="mt-1">
                  <span className="text-3xl font-black text-stone-900 font-display">₹{equipment.pricePerDay.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-stone-500"> / {t('common.perDay', 'day')}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{t('common.deposit', 'Security Deposit')}</span>
                  <span className="font-bold text-stone-900">₹{equipment.securityDeposit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{t('common.operatorAvailable', 'Driver/Operator')}</span>
                  <span className="font-bold text-stone-900">{equipment.operatorAvailable ? `${t('detail.available', 'Available')} (+₹${equipment.operatorCostPerDay}/${t('common.perDay', 'day')})` : t('common.notIncluded', 'Not included')}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800">
                {t('detail.marketViewNotice', 'Owner and administrative accounts can view machinery specifications and rental rates for market comparison, but cannot book or rent this machinery.')}
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-lg space-y-6">
            
            {/* Header Tariff */}
            <div className="flex items-baseline justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  {t('marketplace.pricePerDay', 'Rental Rate')}
                </span>
                <span className="text-2xl font-black text-stone-900 font-display">
                  ₹{equipment.pricePerDay.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-500"> / {t('common.perDay', 'day')}</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-stone-500 block">{t('common.deposit', 'Security Deposit')}</span>
                <span className="text-xs font-bold text-stone-800">₹{equipment.securityDeposit.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleRequestBooking} className="space-y-4 text-xs">
              
              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t('booking.startDate', 'Rental Start Date')}</label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t('booking.endDate', 'Rental End Date')}</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Operator Checkbox if available */}
              {equipment.operatorAvailable && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={operatorIncluded}
                      onChange={e => setOperatorIncluded(e.target.checked)}
                      className="w-4 h-4 accent-emerald-700 rounded"
                    />
                    <span>{t('booking.includeOperator', 'Include Machine Driver/Operator')} (+₹{equipment.operatorCostPerDay}/{t('common.perDay', 'day')})</span>
                  </label>
                  <p className="text-[10px] text-stone-500 mt-1 pl-6">
                    {t('booking.operatorDesc', 'Professional, verified operator handles all field operations and fuel efficiency.')}
                  </p>
                </div>
              )}

              {/* Farm Address */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t('booking.deliveryLocation', 'Delivery Farm / Village Address *')}</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="e.g. Survey 42, Mauza Hingna Farm, Nagpur"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('booking.notes', 'Special Instructions or Crop Details')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. 5 acres cotton field tillage required"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              {/* Live Tariff Breakdown */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{t('booking.baseRent', 'Base Rental')} ({priceBreakdown.durationDays} {t('common.days', 'days')} × ₹{equipment.pricePerDay})</span>
                  <span className="font-semibold text-stone-900">₹{priceBreakdown.baseAmount.toLocaleString('en-IN')}</span>
                </div>

                {operatorIncluded && (
                  <div className="flex justify-between text-stone-600">
                    <span>{t('booking.operatorFee', 'Operator Fee')} ({priceBreakdown.durationDays} {t('common.days', 'days')} × ₹{equipment.operatorCostPerDay})</span>
                    <span className="font-semibold text-stone-900">₹{priceBreakdown.operatorAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>{t('booking.advanceAmount', 'Booking / Advance Amount')}</span>
                  <span className="font-semibold text-stone-900">₹{Number(priceBreakdown.bookingAmount || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>{t('booking.platformFee', 'Platform Fee')}</span>
                  <span className="font-semibold text-stone-900">₹{priceBreakdown.platformFee.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>{t('booking.onlinePaymentNote', 'Online payment after owner approval')}</span>
                  <span>₹{Number(priceBreakdown.onlinePaymentAmount || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>{t('booking.remainingRentalNote', 'Remaining rental paid directly to owner')}</span>
                  <span className="font-semibold text-stone-900">₹{Number(priceBreakdown.remainingRentalAmount || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>{t('booking.refundableDeposit', 'Refundable Security Deposit')}</span>
                  <span className="font-semibold text-stone-900">₹{equipment.securityDeposit.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-stone-900 text-sm">
                  <span>{t('booking.totalRentalAmount', 'Total Rental Amount')}</span>
                  <span className="font-display font-black text-lg text-emerald-800">
                    ₹{priceBreakdown.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmittingBooking || !availabilityCheck.isAvailable}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition disabled:opacity-60 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingBooking ? t('booking.submitting', 'Submitting Request...') : t('booking.submitRequest', 'Submit Booking Request')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChatWithOwner()}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('booking.questionsBeforeBooking', 'Questions before booking? Message')} {equipment.ownerName}</span>
                </button>
              </div>
            </form>

            <div className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('booking.razorpayPaymentNote', 'Razorpay payment is available after the owner approves the booking')}</span>
            </div>

          </div>
                  )}
        </div>

      </div>

      {/* Similar Equipment Row */}
      {similarEquipment.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-stone-200">
          <h3 className="font-display font-extrabold text-xl text-stone-900">
            {t('detail.similarEquipment', 'Other Recommended Farm Machinery')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarEquipment.map(item => (
              <EquipmentCard
                key={item.id}
                equipment={item}
                onViewDetails={(id) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onNavigate(`/equipment/${id}`);
                }}
                onRentNow={(item) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onNavigate(`/equipment/${item.id}`);
                }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
