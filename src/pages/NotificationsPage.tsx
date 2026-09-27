import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, CheckCheck, Clock, ShieldCheck, Tractor, UserCheck } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, unreadNotificationsCount, markAllNotificationsAsRead, markNotificationAsRead } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-stone-900">
              {t('notifications.title', 'Notification Center')}
            </h1>
            <p className="text-xs text-stone-500">
              {t('notifications.desc', 'Real-time alerts on equipment approvals, booking requests, and payment confirmations.')}
            </p>
          </div>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('notifications.markAllRead', 'Mark all as read')}</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500 space-y-2">
          <Bell className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="font-bold text-stone-800 text-sm">{t('notifications.emptyTitle', 'No notifications right now')}</p>
          <p>{t('notifications.emptyDesc', 'You are fully up to date with your farm machinery bookings.')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100 overflow-hidden">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markNotificationAsRead(n.id);
                if (n.link) onNavigate(n.link);
              }}
              className={`p-4 flex items-start gap-3.5 transition cursor-pointer ${
                !n.isRead ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-stone-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                {n.type.includes('BOOKING') && <Tractor className="w-4 h-4 text-emerald-600" />}
                {n.type.includes('PAYMENT') && <ShieldCheck className="w-4 h-4 text-amber-600" />}
                {n.type.includes('EQUIPMENT') && <UserCheck className="w-4 h-4 text-blue-600" />}
                {!n.type.includes('BOOKING') && !n.type.includes('PAYMENT') && !n.type.includes('EQUIPMENT') && (
                  <Bell className="w-4 h-4 text-stone-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs ${!n.isRead ? 'font-extrabold text-stone-900' : 'font-semibold text-stone-800'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-stone-400">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2"></span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
