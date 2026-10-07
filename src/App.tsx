import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { EquipmentPage } from './pages/EquipmentPage';
import { EquipmentDetailPage } from './pages/EquipmentDetailPage';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AuthPages } from './pages/AuthPages';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ChatPage } from './pages/ChatPage';
import { FloatingChatWidget } from './components/chat/FloatingChatWidget';


import { Booking } from './types';
import { CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, role } = useAuth();
  
  // Simple SPA Router State based on current route string & query
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search || '/';
  });

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [bookingSuccessToast, setBookingSuccessToast] = useState<string | null>(null);

  // Sync route on popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle equipment detail routing directly
    if (path.startsWith('/equipment/') && !path.includes('?')) {
      const id = path.replace('/equipment/', '');
      setSelectedEquipmentId(id);
    } else {
      setSelectedEquipmentId(null);
    }
  };

  const handleSelectEquipment = (id: string) => {
    setSelectedEquipmentId(id);
    navigate(`/equipment/${id}`);
  };

  const handleBookingCreated = (booking: Booking) => {
    setBookingSuccessToast(`Booking request submitted! Reference #${booking.bookingCode}. Awaiting owner approval.`);
    setTimeout(() => {
      setBookingSuccessToast(null);
    }, 6000);
    navigate('/farmer/dashboard');
  };

  // Determine current page render
  const renderCurrentView = () => {
    // 1. Equipment Details
    if (selectedEquipmentId || currentPath.startsWith('/equipment/')) {
      const eqId = selectedEquipmentId || currentPath.replace('/equipment/', '').split('?')[0];
      return (
        <EquipmentDetailPage
          equipmentId={eqId}
          onBack={() => navigate('/equipment')}
          onNavigate={navigate}
          onBookingCreated={handleBookingCreated}
        />
      );
    }

    // 2. Equipment Marketplace (with query params)
    if (currentPath.startsWith('/equipment')) {
      const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
      const categoryParam = urlParams.get('category') || undefined;
      const searchParam = urlParams.get('search') || undefined;
      const locationParam = urlParams.get('location') || undefined;

      return (
        <EquipmentPage
          initialCategory={categoryParam}
          initialSearch={searchParam}
          initialLocation={locationParam}
          onSelectEquipment={handleSelectEquipment}
        />
      );
    }

    // 3. Farmer Routes (Protected: Require Farmer/Admin Login)
    if (currentPath.startsWith('/farmer')) {
      if (!user) {
        return (
          <AuthPages
            initialMode="login"
            initialRole="FARMER"
            redirectMessage="Please log in as a Farmer to access your rental bookings, history, and farm services."
            onSuccess={(userRole) => {
              if (userRole === 'OWNER') navigate('/owner/dashboard');
              else if (userRole === 'ADMIN') navigate('/admin/dashboard');
              else navigate('/farmer/dashboard');
            }}
            onNavigate={navigate}
          />
        );
      }
      if (user.role !== 'FARMER') {
        if (user.role === 'ADMIN') { navigate('/admin/dashboard'); return null; }
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-sm text-center space-y-4">
            <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
            <p className="text-stone-600 text-xs leading-relaxed">
              Your account is registered as a <span className="font-bold text-stone-800">{user.role}</span>. The Farmer Dashboard is restricted to farmer accounts.
            </p>
            <button
              onClick={() => navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/')}
              className="px-6 py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-xs hover:bg-emerald-900 transition cursor-pointer"
            >
              Go to Your Portal
            </button>
          </div>
        );
      }
      return (
        <FarmerDashboard
          initialTab={currentPath.includes('payments') ? 'payments' : currentPath.includes('active') ? 'active' : 'bookings'}
          onNavigate={navigate}
          onViewEquipment={handleSelectEquipment}
        />
      );
    }

    // 4. Owner Routes (Protected: Require Owner/Admin Login)
    if (currentPath.startsWith('/owner')) {
      if (!user) {
        return (
          <AuthPages
            initialMode="login"
            initialRole="OWNER"
            redirectMessage="Please log in as an Equipment Owner to list machinery, view rental requests, and manage earnings."
            onSuccess={(userRole) => {
              if (userRole === 'OWNER') navigate('/owner/dashboard');
              else if (userRole === 'ADMIN') navigate('/admin/dashboard');
              else navigate('/farmer/dashboard');
            }}
            onNavigate={navigate}
          />
        );
      }
      if (user.role !== 'OWNER') {
        if (user.role === 'ADMIN') { navigate('/admin/dashboard'); return null; }
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-sm text-center space-y-4">
            <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
            <p className="text-stone-600 text-xs leading-relaxed">
              Your account is registered as a <span className="font-bold text-stone-800">{user.role}</span>. The Owner Dashboard is restricted to equipment owners.
            </p>
            <button
              onClick={() => navigate(user.role === 'FARMER' ? '/farmer/dashboard' : '/')}
              className="px-6 py-2.5 bg-amber-700 text-white font-bold rounded-xl text-xs hover:bg-amber-800 transition cursor-pointer"
            >
              Go to Your Portal
            </button>
          </div>
        );
      }
      return (
        <OwnerDashboard
          initialTab={currentPath.includes('requests') ? 'requests' : currentPath.includes('earnings') ? 'earnings' : 'fleet'}
          onNavigate={navigate}
          onViewEquipment={handleSelectEquipment}
        />
      );
    }

    // 5. Admin Routes (Protected: Require Admin Login)
    if (currentPath.startsWith('/admin')) {
      if (!user || user.role !== 'ADMIN') {
        return (
          <AuthPages
            initialMode="login"
            initialRole="ADMIN"
            redirectMessage="Please log in with Administrator credentials to access platform KYC moderation and dispute arbitration."
            onSuccess={(userRole) => {
              if (userRole === 'ADMIN') navigate('/admin/dashboard');
              else if (userRole === 'OWNER') navigate('/owner/dashboard');
              else navigate('/farmer/dashboard');
            }}
            onNavigate={navigate}
          />
        );
      }
      return (
        <AdminDashboard
          initialTab={currentPath.includes('users') ? 'users' : currentPath.includes('bookings') ? 'bookings' : currentPath.includes('payments') ? 'payments' : currentPath.includes('inquiries') ? 'inquiries' : 'moderation'}
          onNavigate={navigate}
          onViewEquipment={handleSelectEquipment}
        />
      );
    }

    // 6. Auth Routes (login, register, forgot-password, reset-password, callback)
    if (
      currentPath === '/login' ||
      currentPath === '/register' ||
      currentPath === '/forgot-password' ||
      currentPath.startsWith('/reset-password') ||
      currentPath.startsWith('/auth/callback')
    ) {
      const authMode = currentPath.startsWith('/reset-password')
        ? 'reset-password'
        : currentPath === '/forgot-password'
        ? 'forgot-password'
        : currentPath === '/register'
        ? 'register'
        : 'login';

      return (
        <AuthPages
          initialMode={authMode}
          onSuccess={(userRole) => {
            if (userRole === 'ADMIN') navigate('/admin/dashboard');
            else if (userRole === 'OWNER') navigate('/owner/dashboard');
            else navigate('/farmer/dashboard');
          }}
          onNavigate={navigate}
        />
      );
    }

    // 7. Informational Routes
    if (currentPath === '/how-it-works') {
      return <HowItWorksPage onNavigate={navigate} />;
    }

    if (currentPath === '/about') {
      return <AboutPage />;
    }

    if (currentPath === '/contact') {
      return <ContactPage />;
    }

    if (currentPath === '/notifications') {
      if (!user) {
        return (
          <AuthPages
            initialMode="login"
            redirectMessage="Please log in to view your account notifications and booking alerts."
            onSuccess={(userRole) => {
              if (userRole === 'OWNER') navigate('/owner/dashboard');
              else if (userRole === 'ADMIN') navigate('/admin/dashboard');
              else navigate('/farmer/dashboard');
            }}
            onNavigate={navigate}
          />
        );
      }
      return <NotificationsPage onNavigate={navigate} />;
    }

    // 8. Messages & Chat Route (Renter-Owner & Admin-Renter)
    if (currentPath.startsWith('/messages') || currentPath.startsWith('/chat')) {
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
        return null;
      }
      if (!user) {
        return (
          <AuthPages
            initialMode="login"
            redirectMessage="Please log in to chat with machinery owners and platform support."
            onSuccess={(userRole) => {
              if (userRole === 'OWNER') navigate('/owner/dashboard');
              else if (userRole === 'ADMIN') navigate('/admin/dashboard');
              else navigate('/messages');
            }}
            onNavigate={navigate}
          />
        );
      }
      const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
      const convParam = urlParams.get('id') || selectedConversationId || undefined;
      return (
        <ChatPage
          initialConversationId={convParam}
          onNavigate={navigate}
          onViewEquipment={handleSelectEquipment}
        />
      );
    }

    // Default: Home Page
    return (
      <HomePage
        onNavigate={navigate}
        onSelectEquipment={handleSelectEquipment}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Global Navbar */}
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      {/* Global Booking Toast Notification */}
      {bookingSuccessToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold leading-snug">{bookingSuccessToast}</span>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1">
        {renderCurrentView()}
      </main>

      
      {/* Global Floating Messenger Widget (Active everywhere for logged-in users except on full /messages page) */}
      {user && user.role !== 'ADMIN' && !currentPath.startsWith('/messages') && !currentPath.startsWith('/chat') && (
        <FloatingChatWidget
          onNavigateToMessages={(convId) => {
            if (convId) setSelectedConversationId(convId);
            navigate(convId ? `/messages?id=${convId}` : '/messages');
          }}
          onViewEquipment={handleSelectEquipment}
        />
      )}

      {/* Global Footer */}
      <Footer onNavigate={navigate} />

    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
