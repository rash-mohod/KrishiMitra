import React, { useEffect, useState } from 'react';
import { Booking, Category, Equipment, EquipmentStatus, PaymentTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { bookingApi, chatApi, equipmentApi, paymentApi } from '../../services/api';
import { AddEquipmentModal } from '../../components/owner/AddEquipmentModal';
import { Avatar } from '../../components/common/Avatar';
import { BookingDrawer } from '../../components/booking/BookingDrawer';
import { DisputeModal } from '../../components/booking/DisputeModal';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  MapPin,
  MessageSquare,
  PlusCircle,
  Power,
  RefreshCw,
  Star,
  Tractor,
  Trash2,
  TrendingUp,
  User,
  Wrench,
  XCircle
} from 'lucide-react';

const INDIA_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
const isValidBookingDate = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

interface OwnerDashboardProps {
  initialTab?: string;
  onNavigate: (path: string) => void;
  onViewEquipment: (id: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  initialTab = 'fleet',
  onNavigate,
  onViewEquipment
}) => {
  const { user } = useAuth();
  const { t, translateStatus, translateCategory } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // Active machines stay in My Fleet. Soft-deleted/inactive machines remain
  // available under Other for record history, but are excluded from fleet counts.
  const activeEquipmentList = equipmentList.filter(eq => eq.isActive !== false && eq.status !== 'INACTIVE');
  const deletedEquipmentList = equipmentList.filter(eq => eq.isActive === false || eq.status === 'INACTIVE');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadOwnerData();
    }
  }, [user]);

  const loadOwnerData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const cats = await equipmentApi.getCategories();
      const eqList = await equipmentApi.getOwnerEquipment(user.id);
      const bList = await bookingApi.getOwnerBookings(user.id);
      const tList = await paymentApi.getOwnerTransactions(user.id);

      setCategories(cats);
      setEquipmentList(eqList);
      setBookings(bList);
      setTransactions(tList);
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (equipmentId: string, currentStatus: EquipmentStatus) => {
    if (!user) return;
    const nextStatus: EquipmentStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    await equipmentApi.updateEquipment(equipmentId, user.id, { status: nextStatus });
    loadOwnerData();
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (!user) return;
    await bookingApi.acceptBooking(bookingId, user.id);
    loadOwnerData();
    if (selectedBooking) {
      const updated = bookings.find(b => b.id === bookingId);
      if (updated) setSelectedBooking(updated);
    }
  };

  const handleConfirmRemainingPayment = async (bookingId: string, method: 'CASH' | 'UPI') => {
    try {
      await paymentApi.confirmRemainingPayment(bookingId, method);
      await loadOwnerData();
      alert(`Remaining ${method} payment confirmed.`);
    } catch (err: any) {
      alert(err?.message || 'Unable to confirm payment.');
    }
  };

  const handleStartRental = async (bookingId: string) => {
    try {
      await bookingApi.startRental(bookingId, user!.id);
      await loadOwnerData();
    } catch (err: any) {
      alert(err?.message || 'Unable to start rental.');
    }
  };

  const handleCompleteRental = async (bookingId: string) => {
    try {
      await bookingApi.completeRental(bookingId, user!.id);
      await loadOwnerData();
    } catch (err: any) {
      alert(err?.message || 'Unable to complete rental.');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!user) return;
    await bookingApi.rejectBooking(bookingId, user.id, 'Machinery unavailable on specified dates');
    loadOwnerData();
  };

  const handleChatWithFarmer = async (b: Booking) => {
    if (!user) return;
    try {
      const conv = await chatApi.getOrCreateConversation({
        currentUserId: user.id,
        targetUserId: b.farmerId,
        type: 'RENTER_OWNER',
        equipmentId: b.equipmentId,
        equipmentName: b.equipmentName,
        equipmentImage: b.equipmentImage,
        bookingId: b.id,
        bookingCode: b.bookingCode,
        topic: `Rental Coordination for #${b.bookingCode} (${b.equipmentName})`,
        initialMessage: `Namaste ${b.farmerName} ji, regarding your machinery booking #${b.bookingCode}. Machine dispatch and driver arrival schedule ready.`
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
        topic: 'Owner KYC Verification & Fast Payout Clearance'
      });
      onNavigate(`/messages?id=${conv.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalEarnings = transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);
  const pendingRequests = bookings.filter(b => b.status === 'PENDING').length;
  const activeRentals = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Profile & Actions Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatarUrl} name={user?.name} className="w-16 h-16 rounded-2xl border-2 border-emerald-600 shrink-0" iconClassName="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-stone-900">
                {t('dash.ownerWelcome', 'Equipment Owner Hub')} - {user?.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                🚜 {t('role.owner', 'Fleet Owner')}
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
            title="Chat with Agri Support & KYC Verification Officers"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>{t('chat.adminSupport', 'Agri Support Desk')}</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.addMachinery', 'Add Machinery to Fleet')}</span>
          </button>
          <button
            onClick={loadOwnerData}
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
            <span>{t('dash.myFleetCount', 'Fleet Size')}</span>
            <Tractor className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-display">
            {activeEquipmentList.length}
          </div>
          <span className="text-[11px] text-stone-400">{t('dash.registeredMachines', 'Registered machines')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.tabRequests', 'Pending Requests')}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-display">
            {pendingRequests}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">{t('dash.requiresOwnerApproval', 'Requires owner approval')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.activeRentals', 'Active Bookings')}</span>
            <Calendar className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-display">
            {activeRentals}
          </div>
          <span className="text-[11px] text-stone-400">{t('dash.deployedOrConfirmed', 'Deployed or confirmed')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>{t('dash.totalEarnings', 'Total Earnings')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-display">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">{t('dash.netOwnerPayouts', 'Net owner payouts')}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 space-x-2 sm:space-x-4 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'border-emerald-700 text-emerald-900 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('dash.tabFleet', 'My Machinery Fleet')} ({activeEquipmentList.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'border-emerald-700 text-emerald-900 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('dash.tabRequests', 'Incoming Bookings & Rentals')} ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'border-emerald-700 text-emerald-900 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('dash.tabEarnings', 'Earnings & Payouts')}
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'other'
              ? 'border-emerald-700 text-emerald-900 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Other ({deletedEquipmentList.length})
        </button>
      </div>

      {/* TAB 1: FLEET LIST */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm">Machinery in Your Fleet ({activeEquipmentList.length})</h3>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition"
            >
              + {t('nav.addMachinery', 'Add Machinery')}
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-500">{t('common.loading', 'Loading fleet...')}</div>
          ) : activeEquipmentList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <Tractor className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="font-bold text-stone-900 text-sm">You haven't listed any equipment yet</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Start earning daily rental income from your tractors, rotavators, seeders, or combine harvesters.
              </p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                {t('addMachinery.title', 'List First Machine')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeEquipmentList.map(eq => (
                <div
                  key={eq.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 bg-stone-100">
                      <img
                        src={eq.images[0]}
                        alt={eq.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {translateCategory(eq.categoryId || eq.categoryName)}
                      </span>
                      <span className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        eq.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {translateStatus(eq.status)}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4
                        onClick={() => onViewEquipment(eq.id)}
                        className="font-bold text-stone-900 text-sm hover:text-emerald-700 cursor-pointer line-clamp-1"
                      >
                        {eq.name}
                      </h4>
                      <p className="text-xs text-stone-500">{eq.brand} • {eq.model} ({eq.manufacturingYear})</p>
                      
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                        <span className="font-bold text-stone-900">₹{eq.pricePerDay.toLocaleString('en-IN')}/{t('common.perDay', 'day')}</span>
                        <span className="text-stone-500">{eq.totalRentals} rentals</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleStatusToggle(eq.id, eq.status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        eq.status === 'AVAILABLE'
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{eq.status === 'AVAILABLE' ? 'Set Maintenance' : 'Set Available'}</span>
                    </button>

                    <button
                      onClick={() => onViewEquipment(eq.id)}
                      className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-bold transition"
                    >
                      {t('common.viewDetails', 'View')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {bookings.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 font-mono">#{b.bookingCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ((b.status === 'ACTIVE' && b.rentalCompletedAt) || b.status === 'COMPLETED')
                        ? 'bg-blue-100 text-blue-900'
                        : b.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-900 font-extrabold'
                        : b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {((b.status === 'ACTIVE' && b.rentalCompletedAt) || b.status === 'COMPLETED')
                        ? 'Rental Completed'
                        : (b.status === 'CONFIRMED' && (!isValidBookingDate(b.startDate) || !isValidBookingDate(b.endDate)))
                        ? 'Rental Not Completed'
                        : b.status === 'CONFIRMED' && isValidBookingDate(b.startDate) && isValidBookingDate(b.endDate) && b.endDate < INDIA_DATE_FORMATTER.format(new Date())
                        ? 'Rental Not Completed'
                        : translateStatus(b.status)}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{b.equipmentName}</h4>
                  <p className="text-xs text-stone-600">
                    <strong>Farmer:</strong> {b.farmerName} ({b.farmerPhone}) • {isValidBookingDate(b.startDate) && isValidBookingDate(b.endDate) ? `${b.startDate} to ${b.endDate}` : 'Rental dates unavailable'}
                  </p>
                  <p className="text-xs text-stone-500"><strong>Farm Address:</strong> {b.pickupAddress}</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-stone-400 block">Total Payout</span>
                    <span className="font-bold text-emerald-800 text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChatWithFarmer(b)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Chat with Farmer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t('chat.chatWithRenter', 'Chat Farmer')}</span>
                    </button>

                    {b.status === 'CONFIRMED' && (
                      !isValidBookingDate(b.startDate) || !isValidBookingDate(b.endDate) ? (
                        <span className="px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">Rental not completed — dates unavailable</span>
                      ) : b.endDate < INDIA_DATE_FORMATTER.format(new Date()) ? (
                        <span className="px-3 py-2 bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold">Rental not completed</span>
                      ) : (
                        <button onClick={() => handleStartRental(b.id)} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold">Start Rental</button>
                      )
                    )}
                    {b.rentalCompletedAt && Number(b.remainingRentalAmount ?? 0) > 0 && b.remainingPaymentStatus !== 'PAID' && (
                      <>
                        {b.remainingPaymentMethod === 'CASH' ? (
                          <button onClick={() => handleConfirmRemainingPayment(b.id, 'CASH')} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold">Confirm Cash Received</button>
                        ) : (
                          <span className="px-3 py-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold">Awaiting Farmer Online Payment</span>
                        )}
                      </>
                    )}
                    {b.rentalCompletedAt && b.remainingRentalAmount > 0 && b.remainingPaymentStatus === 'PAID' && (
                      <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                        Remaining Paid {b.remainingPaymentMethod === 'RAZORPAY' ? 'Online' : b.remainingPaymentMethod}
                      </span>
                    )}

                    {b.status === 'ACTIVE' && b.rentalCompletedAt && (b.remainingRentalAmount === 0 || b.remainingPaymentStatus === 'PAID') && (
                      <button onClick={() => handleCompleteRental(b.id)} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold">Complete Rental</button>
                    )}

                    {b.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAcceptBooking(b.id)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          Accept Booking
                        </button>
                        <button
                          onClick={() => handleRejectBooking(b.id)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition"
                        >
                          Decline
                        </button>
                      </>
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
        </div>
      )}

      {/* TAB 3: EARNINGS & TRANSACTIONS */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm">{t('nav.ownerEarnings', 'Owner Earnings & Payout Records')}</h3>
            <span className="text-xs text-stone-500 font-mono">Direct Bank Transferred</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Rental Item</th>
                  <th className="p-3.5">Farmer</th>
                  <th className="p-3.5">Net Payout (₹)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-stone-50/50">
                    <td className="p-3.5 font-mono text-stone-800 font-bold">{(txn as any).invoiceNumber || txn.razorpayPaymentId || txn.id?.slice(0, 10) || txn.id}</td>
                    <td className="p-3.5 text-stone-500">{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 font-semibold text-stone-900">{txn.bookingId}</td>
                    <td className="p-3.5 text-stone-600">Farmer Account</td>
                    <td className="p-3.5 font-bold text-emerald-800">₹{txn.amount.toLocaleString('en-IN')}</td>
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


      {/* TAB 4: OTHER / DELETED MACHINERY */}
      {activeTab === 'other' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Other Machinery</h3>
            <p className="text-xs text-stone-500 mt-1">Deleted or inactive machinery is kept here for record history and is not counted in My Fleet.</p>
          </div>

          {deletedEquipmentList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <Tractor className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="font-bold text-stone-900 text-sm">No deleted machinery</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">Machinery you delete from My Fleet will appear here. Historical bookings and records remain preserved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {deletedEquipmentList.map(eq => (
                <div key={eq.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs opacity-80">
                  <div className="relative aspect-16/10 bg-stone-100">
                    {eq.images?.[0] ? (
                      <img src={eq.images[0]} alt={eq.name} className="w-full h-full object-cover grayscale" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Tractor className="w-10 h-10 text-stone-400" /></div>
                    )}
                    <span className="absolute top-2 left-2 bg-stone-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">Deleted</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{eq.name}</h4>
                    <p className="text-xs text-stone-500">{eq.brand || 'No brand'}{eq.model ? ` • ${eq.model}` : ''}</p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500">Rental history preserved</span>
                      <span className="font-bold text-stone-500">Not in Fleet</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Modal */}
      <AddEquipmentModal
        categories={categories}
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          loadOwnerData();
        }}
      />

      {/* Booking Drawer for Details & Handover OTP */}
      {selectedBooking && (
        <BookingDrawer
          booking={selectedBooking}
          isOpen={drawerOpen}
          userRole="OWNER"
          onClose={() => setDrawerOpen(false)}
          onAcceptBooking={() => handleAcceptBooking(selectedBooking.id)}
          onRejectBooking={() => handleRejectBooking(selectedBooking.id)}
          onRaiseDispute={() => {
            setDrawerOpen(false);
            setDisputeModalOpen(true);
          }}
          onRefresh={loadOwnerData}
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
            loadOwnerData();
          }}
        />
      )}

    </div>
  );
};
