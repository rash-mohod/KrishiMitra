import React, { useEffect, useState } from 'react';
import { Booking, PaymentTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { bookingApi, chatApi, paymentApi } from '../../services/api';
import { startRazorpayPayment, startRemainingRazorpayPayment } from '../../services/razorpayCheckout';
import { BookingDrawer } from '../../components/booking/BookingDrawer';
import { Avatar } from '../../components/common/Avatar';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { DisputeModal } from '../../components/booking/DisputeModal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Heart,
  HelpCircle,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Tractor,
  User,
  Zap
} from 'lucide-react';

interface FarmerDashboardProps {
  initialTab?: string;
  onNavigate: (path: string) => void;
  onViewEquipment: (id: string) => void;
}

const isValidBookingDate = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  initialTab = 'bookings',
  onNavigate,
  onViewEquipment
}) => {
  const { user } = useAuth();
  const { t, translateStatus, translateCategory } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadFarmerData();
    }
  }, [user]);

  const loadFarmerData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const bList = await bookingApi.getFarmerBookings(user.id);
      setBookings(bList);
      const tList = await paymentApi.getFarmerTransactions(user.id);
      setTransactions(tList);
    } catch (err) {
      console.error('Failed to load farmer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayBooking = async (bookingId: string) => {
    if (!user) return;
    try {
      await startRazorpayPayment(bookingId, { name: user.name, email: user.email, phone: user.phone });
      await loadFarmerData();
      alert('Payment verified. Your booking is confirmed.');
    } catch (err: any) {
      alert(err?.message || 'Payment failed. Please try again.');
    }
  };

  const handlePayRemainingOnline = async (bookingId: string) => {
    if (!user) return;
    try {
      await startRemainingRazorpayPayment(bookingId, { name: user.name, email: user.email, phone: user.phone });
      await loadFarmerData();
      alert('Remaining rental payment verified successfully.');
    } catch (err: any) {
      alert(err?.message || 'Remaining payment failed. Please try again.');
    }
  };

  const handleRequestRemainingCash = async (bookingId: string) => {
    try {
      await paymentApi.requestRemainingCashPayment(bookingId);
      await loadFarmerData();
      alert('Cash payment request sent to the equipment owner. Pay the owner directly and wait for confirmation.');
    } catch (err: any) {
      alert(err?.message || 'Unable to request cash payment.');
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    if (!user) return;
    await bookingApi.cancelBooking(bookingId, user.id, reason);
    loadFarmerData();
    setDrawerOpen(false);
  };

  const handleChatWithOwner = async (b: Booking) => {
    if (!user) return;
    try {
      const conv = await chatApi.getOrCreateConversation({
        currentUserId: user.id,
        targetUserId: b.ownerId,
        type: 'RENTER_OWNER',
        equipmentId: b.equipmentId,
        equipmentName: b.equipmentName,
        equipmentImage: b.equipmentImage,
        bookingId: b.id,
        bookingCode: b.bookingCode,
        topic: `Rental Discussion for #${b.bookingCode} (${b.equipmentName})`,
        initialMessage: `Namaste ${b.ownerName} ji, inquiry regarding our booking #${b.bookingCode} for ${b.equipmentName}. Please confirm field delivery status.`
      });
      onNavigate(`/messages?id=${conv.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChatWithAdmin = async () => {
    if (!user) return;
    try {
      const conv = await chatApi.getOrCreateConversation({
        currentUserId: user.id,
        targetUserId: 'user-admin-1',
        type: 'ADMIN_RENTER',
        topic: 'Official Escrow Protection & Mahadbt CHC Subsidy Claim'
      });
      onNavigate(`/messages?id=${conv.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalSpent = transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);
  const activeRentalsCount = bookings.filter(b => b.status === 'ACTIVE').length;
  const pendingPaymentCount = bookings.filter(b => b.status === 'PAYMENT_PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Profile & Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatarUrl} name={user?.name} className="w-16 h-16 rounded-2xl border-2 border-emerald-500 shrink-0" iconClassName="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-stone-900">
                {t('dash.farmerWelcome', 'Farmer Dashboard')} - {user?.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
                🌾 {t('role.farmer', 'Farmer Account')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{user?.village ? user.village + ', ' : ''}{user?.district}, {user?.state}</span>
              <span className="text-stone-300">•</span>
              <span>{user?.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleChatWithAdmin}
            className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Chat with Krishi Mitra Support & Escrow Arbitrator"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Agri Support Desk</span>
          </button>
          <button
            onClick={() => onNavigate('/equipment')}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>{t('hero.findEquipment', 'Find Farm Equipment')}</span>
          </button>
          <button
            onClick={loadFarmerData}
            title="Refresh Data"
            className="p-2.5 text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.tabBookings', 'Total Bookings')}</span>
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-display">
            {bookings.length}
          </div>
          <span className="text-[11px] text-stone-400">All season requests</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.activeRentals', 'Active Rentals')}</span>
            <Tractor className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-display">
            {activeRentalsCount}
          </div>
          <span className="text-[11px] text-stone-400">Currently operating</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.pendingRequests', 'Pending Requests')}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-display">
            {pendingPaymentCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            {pendingPaymentCount > 0 ? 'Action required' : 'All clear'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.totalSpent', 'Total Spent')}</span>
            <CreditCard className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-display">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">100% Escrow Protected</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 space-x-2 sm:space-x-4 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'border-emerald-700 text-emerald-900 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('dash.tabBookings', 'My Bookings')} ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-emerald-700 text-emerald-900 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('dash.tabPayments', 'Payment Receipts & Invoices')} ({transactions.length})
        </button>
      </div>

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-500">{t('common.loading', 'Loading bookings...')}</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <Tractor className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="font-bold text-stone-900 text-sm">No rental bookings yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore our verified equipment catalog to book high-efficiency machinery for your farm.
              </p>
              <button
                onClick={() => onNavigate('/equipment')}
                className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                {t('hero.findEquipment', 'Browse Equipment')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map(b => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={b.equipmentImage || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=400&q=80'}
                      alt={b.equipmentName}
                      className="w-20 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-400 font-mono">#{b.bookingCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (b.status === 'ACTIVE' && b.rentalCompletedAt) || b.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-900'
                            : b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'PAYMENT_PENDING'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {(b.status === 'ACTIVE' && b.rentalCompletedAt) || b.status === 'COMPLETED' ? 'Rental Completed' : (!isValidBookingDate(b.startDate) || !isValidBookingDate(b.endDate)) ? 'Rental Dates Unavailable' : b.status === 'ACTIVE' ? 'Rental In Progress' : translateStatus(b.status)}
                        </span>
                      </div>
                      <h4
                        onClick={() => onViewEquipment(b.equipmentId)}
                        className="font-bold text-stone-900 text-sm hover:text-emerald-800 cursor-pointer"
                      >
                        {b.equipmentName}
                      </h4>
                      <p className="text-xs text-stone-500 flex items-center gap-2">
                        <span>{isValidBookingDate(b.startDate) && isValidBookingDate(b.endDate) ? `${b.startDate} to ${b.endDate} (${b.durationDays} ${t('common.perDay', 'days')})` : 'Rental dates unavailable'}</span>
                        <span>•</span>
                        <span>Owner: {b.ownerName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-stone-400 block">{t('common.total', 'Total Amount')}</span>
                      <span className="font-bold text-stone-900 text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleChatWithOwner(b)}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Chat with Owner"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t('chat.chatWithOwner', 'Chat Owner')}</span>
                      </button>

                      {b.status === 'PAYMENT_PENDING' && (
                        <button
                          onClick={() => handlePayBooking(b.id)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                        >
                          Pay ₹{b.platformFee + b.bookingAmount}
                        </button>
                      )}

                      {b.rentalCompletedAt && Number(b.remainingRentalAmount ?? 0) > 0 && b.remainingPaymentStatus !== 'PAID' && b.remainingPaymentMethod !== 'CASH' && (
                        <>
                          <button
                            onClick={() => handlePayRemainingOnline(b.id)}
                            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                          >
                            Pay Remaining Online ₹{Number(b.remainingRentalAmount ?? 0).toLocaleString('en-IN')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestRemainingCash(b.id)}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold"
                          >
                            Pay Remaining by Cash
                          </button>
                        </>
                      )}

                      {b.rentalCompletedAt && Number(b.remainingRentalAmount ?? 0) > 0 && b.remainingPaymentStatus !== 'PAID' && b.remainingPaymentMethod === 'CASH' && (
                        <span className="px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">
                          Cash Payment Awaiting Owner Confirmation
                        </span>
                      )}

                      {b.rentalCompletedAt && (Number(b.remainingRentalAmount ?? 0) <= 0 || b.remainingPaymentStatus === 'PAID') && (
                        <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                          Payment Completed
                        </span>
                      )}

                      {b.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setReviewModalOpen(true);
                          }}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
                        >
                          {t('detail.writeReview', 'Review')}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setDrawerOpen(true);
                        }}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('common.viewDetails', 'Details')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSACTIONS / INVOICES */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm">{t('nav.paymentReceipts', 'Payment Receipts & Invoices')}</h3>
            <span className="text-xs text-stone-500 font-mono">Razorpay advance + platform fee receipts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Equipment</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Amount (₹)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-stone-50/50">
                    <td className="p-3.5 font-mono text-stone-800 font-bold">{(txn as any).invoiceNumber || txn.razorpayPaymentId || txn.id?.slice(0, 10) || txn.id}</td>
                    <td className="p-3.5 text-stone-500">{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 font-semibold text-stone-900">{txn.bookingId}</td>
                    <td className="p-3.5 text-stone-600">{txn.paymentMethod}</td>
                    <td className="p-3.5 font-bold text-stone-900">₹{txn.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Drawer for Details & Handover OTP */}
      {selectedBooking && (
        <BookingDrawer
          booking={selectedBooking}
          isOpen={drawerOpen}
          userRole="FARMER"
          onClose={() => setDrawerOpen(false)}
          onCancelBooking={(reason) => handleCancelBooking(selectedBooking.id, reason)}
          onRaiseDispute={() => {
            setDrawerOpen(false);
            setDisputeModalOpen(true);
          }}
          onReview={() => {
            setDrawerOpen(false);
            setReviewModalOpen(true);
          }}
          onRefresh={loadFarmerData}
        />
      )}

      {/* Review Modal */}
      {selectedBooking && reviewModalOpen && user && (
        <ReviewModal
          booking={selectedBooking}
          farmer={user}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            setReviewModalOpen(false);
            loadFarmerData();
          }}
        />
      )}

      {/* Dispute Modal */}
      {selectedBooking && disputeModalOpen && (
        <DisputeModal
          booking={selectedBooking}
          isOpen={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          onSuccess={() => {
            setDisputeModalOpen(false);
            loadFarmerData();
          }}
        />
      )}

    </div>
  );
};
