import React, { useEffect, useState } from 'react';
import { Booking, Category, Equipment, EquipmentStatus, PaymentTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { bookingApi, chatApi, equipmentApi, paymentApi } from '../../services/api';
import { AddEquipmentModal } from '../../components/owner/AddEquipmentModal';
import { Avatar } from '../../components/common/Avatar';
import { BookingDrawer } from '../../components/booking/BookingDrawer';
import { DisputeModal } from '../../components/booking/DisputeModal';
import { RentalStopModal } from '../../components/booking/RentalStopModal';
import { BookingRejectModal } from '../../components/booking/BookingRejectModal';
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

const formatDate = (value?: string) => {
  if (!value) return '—';
  const raw = value.slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(d);
};

const downloadPaymentReceipt = (txn: PaymentTransaction) => {
  const pdfEscape = (value: unknown) => String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '');

  const money = (value: unknown) => `INR ${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const paidAmount = Number(txn.onlinePaymentAmount ?? 0) +
    (txn.remainingPaymentStatus === 'PAID' ? Number(txn.remainingRentalAmount ?? 0) : 0);

  const rows = [
    ['Invoice / Booking', txn.bookingCode || txn.bookingId],
    ['Equipment', txn.equipmentName || 'Equipment'],
    ['Farmer', txn.userName || '—'],
    ['Owner', txn.ownerName || '—'],
    ['Payment date', formatDate(txn.createdAt)],
    ['Payment method', txn.paymentMethod || '—'],
    ['Razorpay payment ID', txn.razorpayPaymentId || '—'],
    ['Rental amount', money(txn.totalRentalAmount)],
    ['Booking / advance amount', money(txn.bookingAmount)],
    ['Platform fee', money(txn.platformFee)],
    ['Remaining rental amount', money(txn.remainingRentalAmount)],
    ['Remaining payment status', txn.remainingPaymentStatus || '—'],
    ['Amount paid', money(paidAmount)],
  ];

  // Dependency-free PDF writer: creates a standard PDF using Helvetica so the
  // receipt downloads directly as .pdf without adding another npm package.
  const lines: string[] = [];
  const addText = (text: string, x: number, y: number, size = 10) => {
    lines.push(`BT /F1 ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`);
  };

  addText('KRISHIMITRA', 50, 790, 20);
  addText('PAYMENT INVOICE / RECEIPT', 50, 765, 13);
  addText(`Booking: ${txn.bookingCode || txn.bookingId}`, 50, 742, 10);
  addText(`Invoice date: ${formatDate(txn.createdAt)}`, 390, 742, 10);

  let y = 710;
  rows.forEach(([label, value], index) => {
    if (index === rows.length - 1) {
      lines.push(`0.92 g 45 ${y + 17} 502 1 re f 0 g`);
    }
    addText(label, 55, y, index === rows.length - 1 ? 11 : 10);
    addText(value, 260, y, index === rows.length - 1 ? 11 : 10);
    y -= 30;
  });

  addText('This invoice is generated from the KrishiMitra payment record.', 50, 300, 9);
  addText('Keep this invoice for your rental/payment records.', 50, 285, 9);

  const content = lines.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  objects.forEach((obj, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KrishiMitra-Invoice-${txn.bookingCode || txn.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};;

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
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [stopRentalBookingId, setStopRentalBookingId] = useState<string | null>(null);
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

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

  const openAddEquipmentModal = () => {
    setEditingEquipment(null);
    setAddModalOpen(true);
  };

  const openEditEquipmentModal = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setAddModalOpen(true);
  };

  const handleDeleteEquipment = async (equipment: Equipment) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Delete "${equipment.name}" from your fleet? It will be moved to Other and kept for record history.`
    );
    if (!confirmed) return;

    try {
      await equipmentApi.updateEquipment(equipment.id, user.id, {
        status: 'INACTIVE',
        isActive: false
      });
      await loadOwnerData();
    } catch (err: any) {
      alert(err?.message || 'Unable to delete equipment.');
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
    try {
      await bookingApi.acceptBooking(bookingId, user.id);
      await loadOwnerData();
      setDrawerOpen(false);
    } catch (err: any) {
      setActionMessage(err?.message || t('booking.acceptFailed', 'Unable to accept this booking.'));
    }
  };

  const handleConfirmRemainingPayment = async (bookingId: string, method: 'CASH' | 'UPI') => {
    try {
      await paymentApi.confirmRemainingPayment(bookingId, method);
      await loadOwnerData();
      setActionMessage(t('rentalPayment.confirmed', `Remaining ${method} payment confirmed.`));
    } catch (err: any) {
      setActionMessage(err?.message || t('rentalPayment.confirmFailed', 'Unable to confirm payment.'));
    }
  };

  const handleStartRental = async (bookingId: string) => {
    if (!user) return;
    const booking = bookings.find(item => item.id === bookingId);
    const today = INDIA_DATE_FORMATTER.format(new Date());
    if (booking && isValidBookingDate(booking.startDate) && booking.startDate > today) {
      setActionMessage(`${t('rentalStart.notYet', 'Rental cannot be started yet.')}\n${t('rentalStart.startsOn', 'This rental starts on')} ${booking.startDate}.`);
      return;
    }
    try {
      await bookingApi.startRental(bookingId, user.id);
      await loadOwnerData();
    } catch (err: any) {
      setActionMessage(err?.message || t('rentalStart.unable', 'Unable to start rental.'));
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

  const handleRejectBooking = async (bookingId: string, reason: string) => {
    if (!user) return;
    try {
      setActionSubmitting(true);
      await bookingApi.rejectBooking(bookingId, user.id, reason);
      await loadOwnerData();
      setRejectBookingId(null);
      setDrawerOpen(false);
    } catch (err: any) {
      setActionMessage(err?.message || t('booking.rejectFailed', 'Unable to reject this booking.'));
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleStopRental = async (bookingId: string, reason: string, message?: string) => {
    if (!user) return;
    try {
      setActionSubmitting(true);
      await bookingApi.stopRental(bookingId, user.id, reason, message);
      await loadOwnerData();
      setStopRentalBookingId(null);
      setDrawerOpen(false);
    } catch (err: any) {
      setActionMessage(err?.message || t('rentalStop.failed', 'Unable to stop rental.'));
    } finally {
      setActionSubmitting(false);
    }
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

  // Metrics
  const totalEarnings = transactions
    .filter(txn => txn.status === 'PAID' || txn.status === 'SUCCESS')
    .reduce((sum, txn) => sum + Math.max(0, Number(txn.ownerNetEarnings ?? 0)), 0);
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
            onClick={() => onNavigate('/contact')}
            className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>{t('support.agriDesk', 'Agri Support Desk')}</span>
          </button>
          <button
            onClick={openAddEquipmentModal}
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
              onClick={openAddEquipmentModal}
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
                onClick={openAddEquipmentModal}
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditEquipmentModal(eq)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition"
                      >
                        {t('common.edit', 'Edit')}
                      </button>

                      <button
                        onClick={() => handleDeleteEquipment(eq)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('common.delete', 'Delete')}</span>
                      </button>

                      <button
                        onClick={() => onViewEquipment(eq.id)}
                        className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-bold transition"
                      >
                        {t('common.viewDetails', 'View')}
                      </button>
                    </div>
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
                      b.rentalNotCompleted
                        ? 'bg-amber-100 text-amber-900'
                        : ((b.status === 'ACTIVE' && b.rentalCompletedAt) || b.status === 'COMPLETED')
                        ? 'bg-blue-100 text-blue-900'
                        : b.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-900 font-extrabold'
                        : b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {b.rentalNotCompleted
                        ? t('status.rentalNotCompleted', 'Rental Not Completed')
                        : translateStatus(b.status)}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{b.equipmentName}</h4>
                  <p className="text-xs text-stone-600">
                    <strong>Farmer:</strong> {b.farmerName} ({b.farmerPhone}) • {isValidBookingDate(b.startDate) && isValidBookingDate(b.endDate) ? `${formatDate(b.startDate)} to ${formatDate(b.endDate)}` : 'Rental dates unavailable'}
                  </p>
                  <p className="text-xs text-stone-500"><strong>Farm Address:</strong> {b.pickupAddress}</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-stone-400 block">{t('dash.totalPayout', 'Total Payout')}</span>
                    <span className="font-bold text-emerald-800 text-sm">₹{(b.paymentStatus === 'PAID' ? Number(b.bookingAmount ?? 0) + (b.remainingPaymentStatus === 'PAID' ? Number(b.remainingRentalAmount ?? 0) : 0) : 0).toLocaleString('en-IN')}</span>
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
                      b.rentalNotCompleted ? (
                        <span className="px-3 py-2 bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold">{t('status.rentalNotCompleted', 'Rental Not Completed')}</span>
                      ) : (
                        <button onClick={() => handleStartRental(b.id)} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold">{t('rentalStart.start', 'Start Rental')}</button>
                      )
                    )}
                    {b.status === 'ACTIVE' && Number(b.remainingRentalAmount ?? 0) > 0 && b.remainingPaymentStatus !== 'PAID' && (
                      b.remainingPaymentMethod === 'CASH' ? (
                        <button onClick={() => handleConfirmRemainingPayment(b.id, 'CASH')} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold">{t('rentalPayment.confirmCash', 'Confirm Cash Received')}</button>
                      ) : (
                        <span className="px-3 py-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold">{t('rentalPayment.awaitingOnline', 'Awaiting Farmer Online / UPI Payment')}</span>
                      )
                    )}
                    {b.status === 'ACTIVE' && b.remainingRentalAmount > 0 && b.remainingPaymentStatus === 'PAID' && (
                      <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                        {t('rentalPayment.paid', 'Remaining Payment Paid')} ({b.remainingPaymentMethod === 'RAZORPAY' ? t('rentalPayment.online', 'Online / UPI') : b.remainingPaymentMethod})
                      </span>
                    )}
                    {b.status === 'ACTIVE' && (
                      <button onClick={() => setStopRentalBookingId(b.id)} className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-bold">{t('rentalStop.confirm', 'Stop Rental')}</button>
                    )}
                    {b.status === 'ACTIVE' && b.rentalCompletedAt && (b.remainingRentalAmount === 0 || b.remainingPaymentStatus === 'PAID') && (
                      <button onClick={() => handleCompleteRental(b.id)} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold">{t('rentalCompletion.complete', 'Complete Rental')}</button>
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
                          onClick={() => setRejectBookingId(b.id)}
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
                  <th className="p-3.5">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-stone-50/50">
                    <td className="p-3.5 font-mono text-stone-800 font-bold">{(txn as any).invoiceNumber || txn.razorpayPaymentId || txn.id?.slice(0, 10) || txn.id}</td>
                    <td className="p-3.5 text-stone-500">{formatDate(txn.createdAt)}</td>
                    <td className="p-3.5 font-semibold text-stone-900">{txn.equipmentName || txn.bookingCode || txn.bookingId}</td>
                    <td className="p-3.5 text-stone-600">{txn.userName || '—'}</td>
                    <td className="p-3.5 font-bold text-emerald-800">₹{txn.ownerNetEarnings.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-3.5"><button type="button" onClick={() => downloadPaymentReceipt(txn)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-700"><Download className="w-3.5 h-3.5" />Download</button></td>
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
        editingEquipment={editingEquipment}
        onClose={() => {
          setAddModalOpen(false);
          setEditingEquipment(null);
        }}
        onSuccess={() => {
          setAddModalOpen(false);
          setEditingEquipment(null);
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
          onRejectBooking={(reason) => handleRejectBooking(selectedBooking.id, reason || '')}
          onStopRental={() => setStopRentalBookingId(selectedBooking.id)}
          onRaiseDispute={() => {
            setDrawerOpen(false);
            setDisputeModalOpen(true);
          }}
          onRefresh={loadOwnerData}
        />
      )}

      {actionMessage && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-stone-900">{t('common.notice', 'Notice')}</h3>
            <p className="text-sm text-stone-600 whitespace-pre-line">{actionMessage}</p>
            <div className="flex justify-end"><button onClick={() => setActionMessage('')} className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold">{t('common.close', 'Close')}</button></div>
          </div>
        </div>
      )}
      {stopRentalBookingId && (
        <RentalStopModal isOpen={!!stopRentalBookingId} submitting={actionSubmitting} onClose={() => !actionSubmitting && setStopRentalBookingId(null)} onSubmit={(reason, message) => handleStopRental(stopRentalBookingId, reason, message)} />
      )}
      {rejectBookingId && (
        <BookingRejectModal isOpen={!!rejectBookingId} submitting={actionSubmitting} onClose={() => !actionSubmitting && setRejectBookingId(null)} onSubmit={(reason) => handleRejectBooking(rejectBookingId, reason)} />
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
