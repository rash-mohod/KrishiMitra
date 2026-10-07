import { Avatar } from '../../components/common/Avatar';
import React, { useEffect, useState } from 'react';
import { Booking, Category, Dispute, Equipment, PaymentTransaction, SupportInquiry, User } from '../../types';
import { adminApi, authApi, bookingApi, equipmentApi, inquiryApi, paymentApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  Lock,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tractor,
  TrendingUp,
  Unlock,
  UserCheck,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react';

interface AdminDashboardProps {
  initialTab?: string;
  onNavigate: (path: string) => void;
  onViewEquipment: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'moderation',
  onNavigate,
  onViewEquipment
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t, translateStatus } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [transactionsList, setTransactionsList] = useState<PaymentTransaction[]>([]);
  const [disputesList, setDisputesList] = useState<Dispute[]>([]);
  const [inquiriesList, setInquiriesList] = useState<SupportInquiry[]>([]);
  const [inquiryReplies, setInquiryReplies] = useState<Record<string, string>>({});
  const [inquirySubmittingId, setInquirySubmittingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Moderation reject dialog
  const [rejectDialogItem, setRejectDialogItem] = useState<Equipment | null>(null);
  const [rejectionReason, setRejectionReason] = useState(() => t('admin.defaultRejectionReason', 'Incomplete machinery specifications or missing RC/tax papers.'));
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4000);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const pStats = await adminApi.getPlatformStats();
      const allEq = await equipmentApi.getAllEquipmentForAdmin();
      const allUsers = await authApi.getAllUsers();
      const allBookings = await bookingApi.getAllBookings();
      const allTxns = await paymentApi.getAllTransactions();
      const allDisputes = await adminApi.getDisputes();
      const allInquiries = await inquiryApi.getAll().catch(() => [] as SupportInquiry[]);

      setStats(pStats);
      setEquipmentList(allEq);
      setUsersList(allUsers);
      setBookingsList(allBookings);
      setTransactionsList(allTxns);
      setDisputesList(allDisputes);
      setInquiriesList(allInquiries);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveEquipment = async (id: string) => {
    try {
      await adminApi.approveEquipment(id);
      showToast(t('admin.approveSuccess', 'Machinery listing approved and published to the live marketplace!'), 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || t('admin.approvalFailed', 'Approval failed'), 'error');
    }
  };

  const handleRejectEquipment = async () => {
    if (!rejectDialogItem) return;
    try {
      await adminApi.rejectEquipment(rejectDialogItem.id, rejectionReason);
      showToast(t('admin.rejectSuccess', 'Listing rejected and feedback sent to owner.'), 'success');
      setRejectDialogItem(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || t('admin.rejectionFailed', 'Rejection failed'), 'error');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await adminApi.setUserStatus(userId, !currentActive);
      showToast(`${t('admin.userStatusUpdated', 'User status updated to')} ${!currentActive ? t('admin.active', 'Active') : t('admin.suspended', 'Suspended')}.`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || t('admin.statusUpdateFailed', 'Status update failed'), 'error');
    }
  };

  const pendingEquipment = equipmentList.filter(e => e.approvalStatus === 'PENDING');
  const handleInquiryReply = async (inquiry: SupportInquiry) => {
    const reply = (inquiryReplies[inquiry.id] || '').trim();
    if (!reply) return;
    try {
      setInquirySubmittingId(inquiry.id);
      const updated = await inquiryApi.update(inquiry.id, { reply, status: 'REPLIED' });
      setInquiriesList(prev => prev.map(item => item.id === updated.id ? updated : item));
      setInquiryReplies(prev => ({ ...prev, [inquiry.id]: '' }));
      showToast(t('admin.inquiryReplySaved', 'Reply sent to the user.'), 'success');
    } catch (err: any) {
      showToast(err.message || t('admin.inquiryReplyFailed', 'Unable to send reply.'), 'error');
    } finally {
      setInquirySubmittingId(null);
    }
  };

  const handleInquiryStatus = async (inquiry: SupportInquiry, status: SupportInquiry['status']) => {
    try {
      setInquirySubmittingId(inquiry.id);
      const updated = await inquiryApi.update(inquiry.id, { status });
      setInquiriesList(prev => prev.map(item => item.id === updated.id ? updated : item));
    } catch (err: any) {
      showToast(err.message || t('admin.inquiryStatusFailed', 'Unable to update inquiry status.'), 'error');
    } finally {
      setInquirySubmittingId(null);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Action Toast */}
      {actionToast && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
          actionToast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-rose-900 text-white border-rose-700'
        }`}>
          <div className="flex items-center gap-2">
            {actionToast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span>{actionToast.message}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-stone-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Top Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center font-bold text-xl shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-white">
                {t('admin.title', 'Agricultural Extension Moderation Admin')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-700">
                {t('admin.stateExtension', 'STATE EXTENSION')}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {t('admin.subtitle', 'Supervising farm mechanization, machinery verification, and payment and dispute support.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={loadAdminData}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('admin.refreshMetrics', 'Refresh Metrics')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-500 flex items-center justify-between">
            <span>{t('admin.totalGmv', 'Total GMV')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </span>
          <div className="text-xl font-black text-stone-900 font-display">
            ₹{(stats?.totalGMV || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-stone-400">{t('admin.grossPlatformRentals', 'Gross platform rentals')}</span>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>{t('admin.platformRevenue', 'Platform Revenue')}</span>
            <Zap className="w-4 h-4 text-emerald-700" />
          </span>
          <div className="text-xl font-black text-emerald-900 font-display">
            ₹{(stats?.platformRevenue || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">{t('admin.slabPlatformFee', 'Slab-based platform fee')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-500 flex items-center justify-between">
            <span>{t('admin.totalFarmers', 'Total Farmers')}</span>
            <Users className="w-4 h-4 text-amber-600" />
          </span>
          <div className="text-xl font-black text-stone-900 font-display">
            {stats?.farmersCount || 0}
          </div>
          <span className="text-[11px] text-stone-400">{stats?.ownersCount || 0} {t('admin.machineryOwners', 'machinery owners')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-500 flex items-center justify-between">
            <span>{t('admin.machineryFleet', 'Machinery Fleet')}</span>
            <Tractor className="w-4 h-4 text-emerald-700" />
          </span>
          <div className="text-xl font-black text-stone-900 font-display">
            {stats?.totalEquipment || 0}
          </div>
          <span className="text-[11px] text-stone-400">{t('admin.totalRegisteredAssets', 'Total registered assets')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-800 flex items-center justify-between">
            <span>{t('admin.pendingReview', 'Pending Review')}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </span>
          <div className="text-xl font-black text-amber-700 font-display">
            {pendingEquipment.length}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">{t('admin.requiresModeration', 'Requires moderation')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 space-x-2 sm:space-x-4 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'moderation'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>{t('admin.moderationQueue', 'Machinery Moderation Queue')}</span>
          {pendingEquipment.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-stone-900 rounded-full text-[10px] font-extrabold">
              {pendingEquipment.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('admin.userAccountsAccess', 'User Accounts & Access')} ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('admin.allRentalBookings', 'All Rental Bookings')} ({bookingsList.length})
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'inquiries'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('admin.userInquiries', 'User Inquiries')} ({inquiriesList.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {t('admin.paymentRecords', 'Payment Records')} ({transactionsList.length})
        </button>
      </div>

      {/* TAB CONTENT: MODERATION QUEUE */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-stone-900 text-sm font-display">
                {t('admin.pendingEquipmentSubmissions', 'Pending Equipment Submissions')} ({pendingEquipment.length})
              </h3>
              <p className="text-xs text-stone-500">
                {t('admin.inspectBeforePublishing', 'Inspect specifications, manufacturing year, and pricing before publishing to public farmers.')}
              </p>
            </div>
          </div>

          {pendingEquipment.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="font-bold text-stone-800 text-sm">{t('admin.queueClean', 'Moderation Queue is Clean!')}</p>
              <p>{t('admin.queueResolved', 'All machinery submissions have been inspected and resolved.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingEquipment.map(eq => (
                <div
                  key={eq.id}
                  className="bg-white rounded-2xl border border-amber-300 p-5 shadow-xs space-y-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={eq.images[0]}
                      alt={eq.name}
                      className="w-24 h-24 rounded-xl object-cover border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase">
                        {eq.categoryName}
                      </span>
                      <h4 className="font-bold text-sm text-stone-900 truncate mt-1">
                        {eq.name}
                      </h4>
                      <p className="text-xs text-stone-600">
                        {t('admin.ownerLabel', 'Owner')}: <strong>{eq.ownerName}</strong> ({eq.ownerPhone})
                      </p>
                      <p className="text-xs text-stone-500">
                        Location: {eq.location}, {eq.district}
                      </p>
                    </div>
                  </div>

                  {/* Specifications Snapshot */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-stone-400 text-[10px] block">{t('admin.dailyRental', 'Daily Rental')}</span>
                      <span className="font-bold text-stone-900">₹{eq.pricePerDay.toLocaleString('en-IN')}/{t('common.perDay', 'day')}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block">{t('admin.condition', 'Condition')}</span>
                      <span className="font-bold text-stone-900">{eq.condition}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block">{t('admin.mfgYear', 'Mfg Year')}</span>
                      <span className="font-bold text-stone-900">{eq.manufacturingYear}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] block">{t('admin.driverAvailable', 'Driver Available')}</span>
                      <span className="font-bold text-stone-900">{eq.operatorAvailable ? t('common.yes', 'Yes') : t('common.no', 'No')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2">
                    {eq.description}
                  </p>

                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleApproveEquipment(eq.id)}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('admin.approvePublish', 'Approve & Publish')}</span>
                    </button>
                    <button
                      onClick={() => setRejectDialogItem(eq)}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 font-bold text-xs text-stone-800 uppercase tracking-wider">
            {t('admin.platformUsersManagement', 'Platform Users Management')}
          </div>
          <div className="divide-y divide-stone-100 text-xs">
            {usersList.map(u => (
              <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatarUrl} name={u.name} className="w-10 h-10 rounded-full border border-stone-200" iconClassName="w-5 h-5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{u.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                          u.role === 'FARMER'
                            ? 'bg-amber-100 text-amber-900'
                            : u.role === 'OWNER'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {u.role}
                      </span>
                      {!u.isActive && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.2 rounded">
                          {t('admin.suspended', 'SUSPENDED')}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      {u.email} • {u.phone} • {u.district}, {u.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      u.isActive
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {u.isActive ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t('admin.suspendAccess', 'Suspend Access')}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>{t('admin.reactivate', 'Reactivate')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 font-bold text-xs text-stone-800 uppercase tracking-wider">
            {t('admin.allPlatformTransactions', 'All Platform Transactions & Rentals')}
          </div>
          <div className="divide-y divide-stone-100 text-xs">
            {bookingsList.map(b => (
              <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{b.bookingCode}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'COMPLETED'
                          ? 'bg-stone-200 text-stone-800'
                          : b.status === 'PAYMENT_PENDING'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-yellow-100 text-yellow-900'
                      }`}
                    >
                      {translateStatus(b.status)}
                    </span>
                  </div>
                  <p className="font-medium text-stone-800">{b.equipmentName}</p>
                  <p className="text-stone-500 text-[11px]">
                    {t('admin.farmerLabel', 'Farmer')}: {b.farmerName} ➔ {t('admin.ownerLabel', 'Owner')}: {b.ownerName} ({b.startDate} {t('common.to', 'to')} {b.endDate})
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-stone-900 text-sm">
                    ₹{b.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-semibold">
                    {t('admin.feeLabel', 'Fee')}: ₹{b.platformFee}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: USER INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {inquiriesList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500">
              <MessageSquare className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-stone-800 text-sm">{t('admin.noInquiries', 'No user inquiries yet.')}</p>
            </div>
          ) : inquiriesList.map(inquiry => (
            <div key={inquiry.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-stone-900">{inquiry.inquiryId}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">{inquiry.userRole}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inquiry.status === 'NEW' ? 'bg-amber-100 text-amber-900' : inquiry.status === 'REPLIED' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800'
                    }`}>{inquiry.status}</span>
                  </div>
                  <p className="font-bold text-stone-900">{inquiry.userName}</p>
                  <p className="text-[11px] text-stone-500">{t(`inquiry.topic.${inquiry.topic}`, inquiry.topic)} • {new Date(inquiry.createdAt).toLocaleString()}</p>
                </div>
                <select
                  value={inquiry.status}
                  onChange={e => handleInquiryStatus(inquiry, e.target.value as SupportInquiry['status'])}
                  disabled={inquirySubmittingId === inquiry.id}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="NEW">{t('inquiry.status.NEW', 'NEW')}</option>
                  <option value="REPLIED">{t('inquiry.status.REPLIED', 'REPLIED')}</option>
                  <option value="RESOLVED">{t('inquiry.status.RESOLVED', 'RESOLVED')}</option>
                </select>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 whitespace-pre-wrap">{inquiry.message}</div>

              {inquiry.adminReply && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t('admin.reply', 'Admin Reply')}</p>
                  <p className="text-xs text-emerald-950 whitespace-pre-wrap">{inquiry.adminReply}</p>
                  {inquiry.repliedAt && <p className="text-[10px] text-emerald-700">{new Date(inquiry.repliedAt).toLocaleString()}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">{t('admin.replyToInquiry', 'Reply to Inquiry')}</label>
                <textarea
                  rows={3}
                  value={inquiryReplies[inquiry.id] || ''}
                  onChange={e => setInquiryReplies(prev => ({ ...prev, [inquiry.id]: e.target.value }))}
                  placeholder={t('admin.replyPlaceholder', 'Write a reply for the user...')}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  onClick={() => handleInquiryReply(inquiry)}
                  disabled={inquirySubmittingId === inquiry.id || !(inquiryReplies[inquiry.id] || '').trim()}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl"
                >
                  {t('admin.sendReply', 'Send Reply')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 font-bold text-xs text-stone-800 uppercase tracking-wider">
            {t('admin.paymentRecords', 'Payment Records')}
          </div>
          <div className="divide-y divide-stone-100 text-xs">
            {transactionsList.map(transaction => (
              <div key={transaction.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{transaction.bookingCode}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    {t('admin.rentalId', 'Rental/Booking ID')}: {transaction.bookingCode} • {t('admin.paymentLabel', 'Payment ID')}: {transaction.razorpayPaymentId || t('admin.notAvailable', 'N/A')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-900 text-sm">
                    ₹{transaction.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    {t('admin.rentalAmount', 'Rental Amount')}: ₹{Number(transaction.totalRentalAmount ?? 0).toLocaleString('en-IN')} • {t('admin.platformFeeLabel', 'Platform Fee')}: ₹{Number(transaction.platformFee ?? 0).toLocaleString('en-IN')} • {t('admin.ownerNetLabel', 'Owner Amount')}: ₹{Number(transaction.ownerNetEarnings ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Moderation Modal */}
      {rejectDialogItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-stone-900 text-base">{t('admin.rejectMachineryListing', 'Reject Machinery Listing')}</h3>
            <p className="text-xs text-stone-500">
              {t('admin.feedbackFor', 'Provide feedback for ')}<strong>{rejectDialogItem.name}</strong> {t('admin.feedbackOwnerDocumentation', ' so the owner can correct documentation.')}
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t('admin.rejectionReason', 'Rejection Reason')}
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectDialogItem(null)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleRejectEquipment}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                {t('admin.confirmRejection', 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
