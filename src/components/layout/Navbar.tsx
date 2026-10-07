import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Avatar } from '../common/Avatar';
import { ProfileEditModal } from '../common/ProfileEditModal';
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Shield,
  Tractor,
  User,
  X
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const {
    user,
    role,
    unreadCount,
    unreadMessagesCount,
    notifications,
    markNotificationAsRead,
    logout
  } = useAuth();

  const { t, currentLanguageInfo } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const navActionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!navActionsRef.current?.contains(event.target as Node)) {
        setUserDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navLinks = [
    { label: t('nav.home', 'Home'), path: '/' },
    { label: t('nav.equipment', 'Equipment'), path: '/equipment' },
    { label: t('nav.howItWorks', 'How It Works'), path: '/how-it-works' },
    { label: t('nav.about', 'About'), path: '/about' },
    { label: t('nav.contact', 'Contact'), path: '/contact' }
  ];

  const getDashboardPath = () => {
    if (role === 'FARMER') return '/farmer/dashboard';
    if (role === 'OWNER') return '/owner/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/login';
  };

  const roleLabel =
    user?.role === 'FARMER'
      ? t('role.farmer', 'Farmer / Renter')
      : user?.role === 'OWNER'
        ? t('role.owner', 'Equipment Owner')
        : t('role.admin', 'Platform Admin');

  const roleEmoji =
    user?.role === 'FARMER'
      ? '🌾'
      : user?.role === 'OWNER'
        ? '🚜'
        : '🛡️';

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setNotifDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3 sm:gap-4">

          {/* ZONE 1: BRAND TITLE (Single Line Contract) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleNavClick('/')}
              className="flex items-center gap-2 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:bg-emerald-800 transition">
                <Tractor className="w-5 h-5 text-emerald-100" />
              </div>

              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-stone-900 group-hover:text-emerald-800 transition whitespace-nowrap">
                Krishi<span className="text-emerald-700">Mitra</span>
              </span>
            </button>
          </div>

          {/* ZONE 2: NAV LINKS (Clean, single-line, 4-6 links) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;

              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-800 bg-emerald-50 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {user && (
              <>
                {role !== 'ADMIN' && (
                <button
                  onClick={() => handleNavClick('/messages')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                    currentPath === '/messages' || currentPath === '/chat'
                      ? 'text-emerald-800 bg-emerald-100/80 font-bold'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />

                  <span>{t('nav.messages', 'Messages')}</span>

                  {unreadMessagesCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
                )}

                <button
                  onClick={() => handleNavClick(getDashboardPath())}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                    currentPath.includes('/dashboard') ||
                    currentPath.includes('/farmer') ||
                    currentPath.includes('/owner') ||
                    currentPath.includes('/admin')
                      ? 'text-emerald-800 bg-emerald-100/80 font-bold'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {role === 'ADMIN' && (
                    <Shield className="w-4 h-4 text-blue-600" />
                  )}

                  {role === 'OWNER' && (
                    <Tractor className="w-4 h-4 text-emerald-600" />
                  )}

                  {role === 'FARMER' && (
                    <User className="w-4 h-4 text-amber-600" />
                  )}

                  <span>{t('nav.dashboard', 'Dashboard')}</span>
                </button>
              </>
            )}
          </nav>

          {/* ZONE 3: ACTIONS & MULTILINGUAL SWITCHER */}
          <div
            ref={navActionsRef}
            className="flex items-center gap-2 sm:gap-2.5"
          >

            {/* Multilingual Selector Dropdown */}
            <LanguageSelector variant="dropdown" />

            {user ? (
              <>
                {/* List Equipment quick shortcut for owners */}
                {role === 'OWNER' && (
                  <button
                    onClick={() => handleNavClick('/owner/equipment/add')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />

                    <span>
                      {t('nav.addMachinery', 'Add Machinery')}
                    </span>
                  </button>
                )}

                {/* Notifications Bell with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 relative focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    aria-label={t('nav.notifications', 'Notifications')}
                  >
                    <Bell className="w-5 h-5" />

                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-stone-900 font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                        <span className="font-semibold text-stone-900 text-sm">
                          {t('nav.notifications', 'Notifications')}
                        </span>

                        <span className="text-xs text-stone-500">
                          {notifications.length}{' '}
                          {t('nav.alerts', 'alerts')}
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-stone-500">
                            {t(
                              'nav.noNotifications',
                              'No notifications yet'
                            )}
                          </div>
                        ) : (
                          (notifications || []).slice(0, 6).map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);

                                if (n.link) {
                                  handleNavClick(n.link);
                                }
                              }}
                              className={`p-3 text-left hover:bg-stone-50 transition cursor-pointer flex gap-2.5 items-start ${
                                !n.isRead ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                {!n.isRead ? (
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 block mt-1.5"></span>
                                ) : (
                                  <Check className="w-3 h-3 text-stone-400 mt-1" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-stone-900 truncate">
                                  {n.title}
                                </p>

                                <p className="text-xs text-stone-600 line-clamp-2 mt-0.5">
                                  {n.message}
                                </p>

                                <span className="text-[10px] text-stone-400 mt-1 block">
                                  {new Date(
                                    n.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 border-t border-stone-100 text-center bg-stone-50/50">
                        <button
                          onClick={() =>
                            handleNavClick('/notifications')
                          }
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          {t(
                            'nav.viewAllNotifications',
                            'View all notifications'
                          )}{' '}
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-stone-200 hover:bg-stone-100/70 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      className="w-7 h-7 rounded-full border border-stone-300"
                      iconClassName="w-4 h-4"
                    />

                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[100px]">
                        {user.name.split(' ')[0]}
                      </div>

                      <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                        {roleLabel}
                      </div>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-bold text-stone-900">
                          {user.name}
                        </p>

                        <p className="text-[11px] text-stone-500 truncate">
                          {user.email}
                        </p>

                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {roleEmoji} {roleLabel}
                        </span>
                      </div>

                      <div className="py-1">
                        {role !== 'ADMIN' && (
                        <button
                          onClick={() =>
                            handleNavClick('/messages')
                          }
                          className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-600" />

                            <span>
                              {t(
                                'nav.messages',
                                'Messages & Chat'
                              )}
                            </span>
                          </div>

                          {unreadMessagesCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center">
                              {unreadMessagesCount}
                            </span>
                          )}
                        </button>
                        )}

                        <button
                          onClick={() =>
                            handleNavClick(getDashboardPath())
                          }
                          className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                        >
                          <Tractor className="w-4 h-4 text-stone-500" />

                          {t('nav.dashboard', 'Dashboard')}
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setProfileEditOpen(true);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-stone-500" />

                          {t('nav.editProfile', 'Edit Profile')}
                        </button>

                        {role === 'FARMER' && (
                          <>
                            <button
                              onClick={() =>
                                handleNavClick('/farmer/bookings')
                              }
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                            >
                              <User className="w-4 h-4 text-stone-500" />

                              {t(
                                'nav.myBookings',
                                'My Bookings'
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleNavClick(
                                  '/farmer/payment-history'
                                )
                              }
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                            >
                              {t(
                                'nav.paymentReceipts',
                                'Payment Receipts'
                              )}
                            </button>
                          </>
                        )}

                        {role === 'OWNER' && (
                          <>
                            <button
                              onClick={() =>
                                handleNavClick('/owner/equipment')
                              }
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                            >
                              {t(
                                'nav.myFleet',
                                'My Machinery Fleet'
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleNavClick('/owner/earnings')
                              }
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                            >
                              {t(
                                'nav.ownerEarnings',
                                'Owner Earnings & Payouts'
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            handleNavClick('/login');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />

                          {t('nav.logout', 'Sign Out')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleNavClick('/login')}
                  className="px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 transition whitespace-nowrap"
                >
                  {t('nav.login', 'Log In')}
                </button>

                <button
                  onClick={() => handleNavClick('/register')}
                  className="px-3 sm:px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition whitespace-nowrap"
                >
                  {t('nav.register', 'Register')}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden focus:outline-none"
              aria-label={t('nav.toggleMenu', 'Toggle Menu')}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2">

          {/* Quick Language Banner in mobile drawer */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-700" />

              <span className="text-xs font-bold text-stone-700">
                {t('lang.language', 'Language')}:
              </span>

              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                {currentLanguageInfo.nativeName}
              </span>
            </div>

            <LanguageSelector variant="compact" />
          </div>

          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => handleNavClick(link.path)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-stone-800 hover:bg-emerald-50 hover:text-emerald-900"
            >
              {link.label}
            </button>
          ))}

          {user && (
            <>
              {role !== 'ADMIN' && (
              <button
                onClick={() => handleNavClick('/messages')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-bold text-stone-900 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-700" />

                  <span>
                    {t('nav.messages', 'Messages & Chat')}
                  </span>
                </div>

                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-bold">
                    {unreadMessagesCount}{' '}
                    {t('nav.new', 'new')}
                  </span>
                )}
              </button>
              )}

              <button
                onClick={() =>
                  handleNavClick(getDashboardPath())
                }
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-bold text-emerald-800 bg-emerald-50 flex items-center justify-between mt-2"
              >
                <span>
                  {roleEmoji} {roleLabel}{' '}
                  {t('nav.dashboard', 'Dashboard')}
                </span>

                <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded">
                  {t('nav.active', 'Active')}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      <ProfileEditModal
        open={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
      />
    </header>
  );
};