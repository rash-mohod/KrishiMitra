import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ProfilePhotoPicker } from '../components/common/ProfilePhotoPicker';
import { INDIA_STATES_AND_UTS, getDistrictsForState } from '../data/indiaLocations';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  RotateCcw,
  Shield,
  Tractor,
  User,
  Users
} from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register' | 'forgot-password' | 'reset-password';
  initialRole?: UserRole;
  redirectMessage?: string;
  onSuccess: (role: UserRole) => void;
  onNavigate: (path: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  initialRole = 'FARMER',
  redirectMessage,
  onSuccess,
  onNavigate
}) => {
  const { login, register, resendConfirmation, forgotPassword, resetPassword } = useAuth();
  const { t, currentLanguage, setLanguage, languages } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'confirmation-sent'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole === 'ADMIN' && initialMode === 'register' ? 'FARMER' : initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Email unconfirmed state & resend cooldown
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState(false);

  // Login credentials (no prefilled demo accounts)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register credentials
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAvatar, setRegAvatar] = useState<string | undefined>();
  const [regPassword, setRegPassword] = useState('');
  const [regState, setRegState] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regLandAcreage, setRegLandAcreage] = useState('');
  const [regFleetType, setRegFleetType] = useState('');

  // Recovery credentials
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  // Detect recovery or confirmation tokens in URL query or hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    if (hash.includes('access_token=') || search.includes('token_hash=')) {
      const params = new URLSearchParams(hash.replace(/^#/, '') || search.replace(/^\?/, ''));
      const type = params.get('type');
      const accessToken = params.get('access_token');

      if (type === 'recovery' && accessToken) {
        setRecoveryToken(accessToken);
        setMode('reset-password');
        setInfoNotice(t('auth.verificationVerified', 'Verification verified. Please enter your new password.'));
      } else if (type === 'signup') {
        setInfoNotice(t('auth.emailVerified', 'Your email has been verified successfully! Please log in with your credentials.'));
        setMode('login');
      }
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInfoNotice(null);

    try {
      const normalizedEmail = loginEmail.trim().toLowerCase();
      const u = await login(normalizedEmail, loginPassword);
      onSuccess(u.role);
    } catch (err: any) {
      if (err.code === 'EMAIL_NOT_CONFIRMED' || err.message?.toLowerCase().includes('not confirmed')) {
        setUnconfirmedEmail(loginEmail.trim().toLowerCase());
        setError(t('auth.emailNotConfirmed', 'Your email has not been confirmed yet. Please verify your email before logging in.'));
      } else {
        setError(err.message || t('auth.invalidCredentials', 'Invalid email or password. Please verify your credentials.'));
      }
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInfoNotice(null);

    if (!/^\d{10}$/.test(regPhone.trim())) {
      setError(t('auth.invalidMobile', 'Mobile number must contain exactly 10 digits.'));
      setIsSubmitting(false);
      return;
    }

    if (!regState || !regDistrict) {
      setError(t('auth.selectStateDistrict', 'Please select your state and district.'));
      setIsSubmitting(false);
      return;
    }

    if (regPassword.length < 8) {
      setError(t('auth.passwordMinLength', 'Password must be at least 8 characters long.'));
      setIsSubmitting(false);
      return;
    }

    try {
      const bioDetails = [
        regBio.trim(),
        selectedRole === 'FARMER' && regLandAcreage ? `Cultivating ${regLandAcreage} acres` : '',
        selectedRole === 'OWNER' && regFleetType ? `Fleet: ${regFleetType}` : ''
      ].filter(Boolean).join('. ');

      const result = await register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        role: selectedRole === 'ADMIN' ? 'FARMER' : selectedRole,
        state: regState.trim(),
        district: regDistrict.trim(),
        village: regVillage.trim(),
        bio: bioDetails,
        avatarDataUrl: regAvatar,
        password: regPassword
      });

      if (result.requiresEmailConfirmation) {
        setUnconfirmedEmail(regEmail.trim().toLowerCase());
        setMode('confirmation-sent');
        setResendCooldown(60);
      } else {
        onSuccess(result.user.role);
      }
    } catch (err: any) {
      setError(err.message || t('auth.registrationFailed', 'Registration failed. Please check your information.'));
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async (targetEmail?: string) => {
    const emailToResend = targetEmail || unconfirmedEmail || loginEmail || regEmail;
    if (!emailToResend) {
      setError(t('auth.emailRequiredForConfirmation', 'Please provide your email address to receive the confirmation link.'));
      return;
    }

    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      const res = await resendConfirmation(emailToResend.trim().toLowerCase());
      setInfoNotice(res.message || t('auth.confirmationLinkSent', 'If an unconfirmed account exists, a new verification link has been sent.'));
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || t('auth.resendConfirmationFailed', 'Failed to resend confirmation email. Please try again later.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInfoNotice(null);

    try {
      const res = await forgotPassword(recoveryEmail.trim().toLowerCase());
      setInfoNotice(res.message || t('auth.recoveryInstructionsSent', 'If this email is registered, recovery instructions have been sent.'));
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || t('auth.recoveryRequestFailed', 'Failed to dispatch recovery request. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (newPassword.length < 8) {
      setError(t('auth.newPasswordMinLength', 'New password must be at least 8 characters long.'));
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch', 'Passwords do not match. Please re-enter.'));
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await resetPassword(newPassword, recoveryToken || undefined);
      setInfoNotice(res.message || t('auth.passwordUpdated', 'Password updated successfully! Please sign in with your new password.'));
      setMode('login');
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryToken(null);
    } catch (err: any) {
      setError(err.message || t('auth.passwordResetFailed', 'Password reset failed or token expired. Please request a new link.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleMeta = {
    FARMER: {
      title: t('auth.roleFarmerTitle', 'Farmer / Renter'),
      subtitle: t('auth.roleFarmerSub', 'Browse agricultural equipment, check rental details, and place booking requests with clear payment information'),
      badge: t('nav.farmerPortal', 'Farmer Portal'),
      icon: User,
      benefits: [
        t('auth.benefitFarmer1', 'Browse available tractors and agricultural machinery'),
        t('auth.benefitFarmer2', 'View equipment details, rental rates and availability'),
        t('auth.benefitFarmer3', 'Transparent payment tracking & receipts'),
        t('auth.benefitFarmer4', 'Contact the equipment owner when required')
      ]
    },
    OWNER: {
      title: t('auth.roleOwnerTitle', 'Equipment Owner'),
      subtitle: t('auth.roleOwnerSub', 'List your agricultural equipment, manage booking requests, and track payments'),
      badge: t('nav.ownerPortal', 'Owner Portal'),
      icon: Tractor,
      benefits: [
        t('auth.benefitOwner1', 'List agricultural equipment available for rental'),
        t('auth.benefitOwner2', 'Review booking requests before confirming a rental'),
        t('auth.benefitOwner3', 'Track bookings, payments and rental status'),
        t('auth.benefitOwner4', 'Receive payment information for completed rentals')
      ]
    },
    ADMIN: {
      title: t('auth.roleAdminTitle', 'Platform Admin / Officer'),
      subtitle: t('auth.roleAdminSub', 'Manage platform operations, review equipment listings, and assist with support requests'),
      badge: t('nav.adminPortal', 'Admin Hub'),
      icon: Shield,
      benefits: [
        t('auth.benefitAdmin1', 'Review equipment listings and platform activity'),
        t('auth.benefitAdmin2', 'Monitor bookings and payment records'),
        t('auth.benefitAdmin3', 'Payment review and dispute support'),
        t('auth.benefitAdmin4', 'Respond to support inquiries and manage platform records')
      ]
    }
  };

  const activeRoleData = roleMeta[selectedRole];

  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header with Title & Language Switch */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-800 text-white rounded-xl shadow-xs">
              <Tractor className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
                {t('auth.welcomeTitle', 'Welcome to Krishi Mitra')}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                {t('auth.welcomeSubtitle', 'India’s Unified Agricultural Machinery Sharing & Custom Hiring Platform')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Language Switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-stone-200 shadow-2xs">
          <Globe className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={currentLanguage}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Redirect Notice Banner */}
      {redirectMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{redirectMessage}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-800" />
            <span>
              {mode === 'register'
                ? t('auth.selectAccountType', 'Select Account Type to Register')
                : t('auth.selectPortal', 'Select Target Portal')}
            </span>
          </label>
          <span className="text-[11px] text-stone-500 font-medium">
            {mode === 'register' ? t('auth.registrationRolesOnly', 'Farmers & Equipment Owners only') : t('auth.secureEmailVerification', 'Secure email + password verification')}
          </span>
        </div>

        <div className={`grid grid-cols-1 ${mode === 'register' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
          {/* Farmer Role Button */}
          <button
            type="button"
            onClick={() => handleRoleSelect('FARMER')}
            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between cursor-pointer ${
              selectedRole === 'FARMER'
                ? 'border-emerald-800 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-700/20'
                : 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-900 font-bold">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 uppercase tracking-wider">
                {t('auth.renterPill', 'Renter / Farmer')}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 font-display">
                {t('auth.roleFarmerTitle', 'Farmer / Renter')}
              </h3>
              <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                {t('auth.roleFarmerSub', 'Rent tractors & machinery at fixed daily rates.')}
              </p>
            </div>
            {selectedRole === 'FARMER' && (
              <div className="mt-3 pt-2 border-t border-emerald-200 flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('auth.activeSelected', 'Active Selected Role')}</span>
              </div>
            )}
          </button>

          {/* Owner Role Button */}
          <button
            type="button"
            onClick={() => handleRoleSelect('OWNER')}
            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between cursor-pointer ${
              selectedRole === 'OWNER'
                ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-1 ring-amber-600/20'
                : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                <Tractor className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 uppercase tracking-wider">
                {t('auth.ownerPill', 'Machinery Owner')}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 font-display">
                {t('auth.roleOwnerTitle', 'Equipment Owner')}
              </h3>
              <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                {t('auth.roleOwnerSub', 'List farm fleet, manage bookings & get paid directly.')}
              </p>
            </div>
            {selectedRole === 'OWNER' && (
              <div className="mt-3 pt-2 border-t border-amber-200 flex items-center gap-1 text-[11px] font-bold text-amber-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{t('auth.activeSelected', 'Active Selected Role')}</span>
              </div>
            )}
          </button>

          {/* Admin Role Button: Only available for Login; NEVER for Register */}
          {mode !== 'register' && (
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'border-slate-800 bg-slate-50 shadow-sm ring-1 ring-slate-800/20'
                  : 'border-stone-200 bg-white hover:border-slate-300 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-800 font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 uppercase tracking-wider">
                  {t('auth.adminPill', 'Moderator')}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-display">
                  {t('auth.roleAdminTitle', 'Platform Admin / Officer')}
                </h3>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                  {t('auth.roleAdminSub', 'Review equipment approvals, audits & arbitrate disputes.')}
                </p>
              </div>
              {selectedRole === 'ADMIN' && (
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1 text-[11px] font-bold text-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t('auth.activeSelected', 'Active Selected Role')}</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Form & Benefits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Main Card: Forms */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6">
          
          {/* Sign-In vs Register Tabs */}
          <div className="flex rounded-2xl bg-stone-100 p-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setInfoNotice(null);
              }}
              className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login' || mode === 'forgot-password' || mode === 'reset-password'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{t('auth.signIn', 'Sign In')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                if (selectedRole === 'ADMIN') setSelectedRole('FARMER');
                setError(null);
                setInfoNotice(null);
              }}
              className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register' || mode === 'confirmation-sent'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('auth.createAccount', 'Create Account')}</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              {unconfirmedEmail && (
                <button
                  type="button"
                  onClick={() => handleResendConfirmation()}
                  disabled={resendCooldown > 0 || isResending}
                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded-lg transition disabled:opacity-50 shrink-0 text-[11px]"
                >
                  {resendCooldown > 0 ? t('auth.resendCountdown', 'Resend ({seconds}s)').replace('{seconds}', String(resendCooldown)) : isResending ? t('auth.sending', 'Sending...') : t('auth.resendEmail', 'Resend Email')}
                </button>
              )}
            </div>
          )}

          {infoNotice && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('auth.emailAddress', 'Email Address')} *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder', 'farmer@example.com')}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50/30"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {t('auth.password', 'Password')} *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setError(null);
                      setInfoNotice(null);
                    }}
                    className="text-[11px] text-emerald-800 font-semibold hover:underline cursor-pointer"
                  >
                    {t('auth.forgotPassword', 'Forgot Password?')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder', '••••••••')}
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50/30"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <span>{t('auth.verifying', 'Authenticating...')}</span>
                ) : (
                  <>
                    <span>
                      {t('auth.signInToRole', 'Sign In as')} {activeRoleData.title}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= REGISTER FORM ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
                    {React.createElement(activeRoleData.icon, { className: 'w-4 h-4' })}
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase tracking-wider font-bold">
                      {t('auth.registeringAs', 'Registering As')}
                    </span>
                    <span className="font-bold text-stone-900 text-xs">
                      {activeRoleData.title}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {t('auth.freeRegistration', 'Verified Account')}
                </span>
              </div>

              {/* Profile picture - internal account setup field */}
              <ProfilePhotoPicker value={regAvatar} onChange={setRegAvatar} label={t('auth.profilePicture', 'Profile Picture')} />

              {/* Name */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('auth.fullName', 'Full Name')} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t('auth.namePlaceholder', 'e.g. Ramesh Patel')}
                    required
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('auth.mobileNumber', 'Mobile Number')} *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={t('auth.mobilePlaceholder', '9876543210')}
                      required
                      minLength={10}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">{t('auth.mobileHint', 'Enter exactly 10 digits.')}</p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('auth.emailAddress', 'Email Address')} *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={t('auth.registrationEmailPlaceholder', 'ramesh@agri.com')}
                      required
                      className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Location hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {t('auth.state', 'State')} *
                  </label>
                  <select
                    value={regState}
                    onChange={(e) => { setRegState(e.target.value); setRegDistrict(''); }}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">{t('auth.selectState', 'Select State')}</option>
                    {INDIA_STATES_AND_UTS.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {t('auth.district', 'District')} *
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    required
                    disabled={!regState}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">{regState ? t('auth.selectDistrict', 'Select District') : t('auth.selectStateFirst', 'Select State First')}</option>
                    {getDistrictsForState(regState).map(district => <option key={district} value={district}>{district}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {t('auth.villageTehsil', 'Village / Tehsil')}
                  </label>
                  <input
                    type="text"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    placeholder={t('auth.villagePlaceholder', 'Enter village or tehsil')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Role Specific Additional Details */}
              {selectedRole === 'FARMER' ? (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {t('auth.cultivationAcreage', 'Cultivation Land Area (Acres)')}
                  </label>
                  <input
                    type="text"
                    value={regLandAcreage}
                    onChange={(e) => setRegLandAcreage(e.target.value)}
                    placeholder={t('auth.acreagePlaceholder', 'e.g. 10 Acres')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ) : selectedRole === 'OWNER' ? (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {t('auth.machineryFleet', 'Primary Machinery You Own & Rent Out')}
                  </label>
                  <input
                    type="text"
                    value={regFleetType}
                    onChange={(e) => setRegFleetType(e.target.value)}
                    placeholder={t('auth.fleetPlaceholder', 'e.g. 2 Tractors (50 HP), Rotavator, Super Seeder')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ) : null}

              {/* Bio / Description */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {t('auth.bioSummary', 'Bio / Farm Summary (Optional)')}
                </label>
                <textarea
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder={t('auth.bioPlaceholder', 'Share a short note about your agricultural work or machinery operations...')}
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider">
                    {t('auth.createPassword', 'Create Password')} *
                  </label>
                  <span className="text-[10px] text-stone-500">{t('auth.minimumEightCharacters', 'Minimum 8 characters')}</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder', 'At least 8 characters')}
                    required
                    minLength={8}
                    className="w-full pl-9 pr-10 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2 cursor-pointer text-stone-600 pt-1">
                <input
                  type="checkbox"
                  required
                  defaultChecked
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 mt-0.5"
                />
                <span className="text-[11px]">
                  {t('auth.termsAgree', 'I agree to the Krishi Mitra Terms of Service, Machinery Safety Guidelines, and Payment Terms.')}
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? t('auth.creatingProfile', 'Creating Account...') : `${t('auth.registerAs', 'Register as')} ${activeRoleData.title}`}
              </button>
            </form>
          )}

          {/* ================= CONFIRMATION PENDING / SENT VIEW ================= */}
          {mode === 'confirmation-sent' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-900">{t('auth.checkEmail', 'Check Your Email')}</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  {t('auth.verificationLinkSentTo', "We've sent a verification link to")} <span className="font-bold text-stone-800">{unconfirmedEmail}</span>. {t('auth.clickVerificationLink', 'Click the link in your inbox to confirm your account.')}
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 max-w-sm mx-auto text-left space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{t('auth.didntReceiveEmail', "Didn't receive the email?")}</span>
                </div>
                <p className="text-[11px]">
                  {t('auth.checkSpam', "Check your spam/junk folder. If it hasn't arrived within a minute, you can dispatch a new verification link below.")}
                </p>
                <button
                  type="button"
                  onClick={() => handleResendConfirmation()}
                  disabled={resendCooldown > 0 || isResending}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? t('auth.resendAvailableIn', 'Resend available in {seconds}s').replace('{seconds}', String(resendCooldown))
                      : isResending
                      ? t('auth.sendingVerification', 'Sending Verification...')
                      : t('auth.resendVerificationEmail', 'Resend Verification Email')}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfoNotice(t('auth.confirmedLoginHint', 'Once confirmed, log in with your email and password below.'));
                }}
                className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>{t('auth.backToSignIn', 'Back to Sign In')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ================= FORGOT PASSWORD FORM ================= */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900">{t('auth.resetPasswordTitle', 'Reset Your Password')}</h3>
                <p className="text-xs text-stone-600">
                  {t('auth.resetPasswordDescription', 'Enter your registered account email. If an account is associated with this email, a secure password recovery link will be sent.')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('auth.emailAddress', 'Email Address')} *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder', 'farmer@example.com')}
                    required
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || resendCooldown > 0}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{t('auth.sendingLink', 'Sending Link...')}</span>
                ) : resendCooldown > 0 ? (
                  <span>{t('auth.waitBeforeRetry', 'Wait {seconds}s before retrying').replace('{seconds}', String(resendCooldown))}</span>
                ) : (
                  <>
                    <span>{t('auth.sendResetInstructions', 'Send Password Reset Instructions')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  ← {t('auth.returnToSignIn', 'Return to Sign In')}
                </button>
              </div>
            </form>
          )}

          {/* ================= RESET PASSWORD FORM ================= */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900">{t('auth.setNewPassword', 'Set a New Password')}</h3>
                <p className="text-xs text-stone-600">
                  {t('auth.strongPasswordHint', 'Please choose a strong password with at least 8 characters.')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('auth.newPassword', 'New Password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder', '••••••••')}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('auth.confirmNewPassword', 'Confirm New Password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder', '••••••••')}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{t('auth.updatingPassword', 'Updating Password...')}</span>
                ) : (
                  <>
                    <span>{t('auth.updatePasswordAndLogin', 'Update Password & Proceed to Login')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Right Card: Role Benefits, Trust Badges & Helpline */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Dynamic Role Highlights */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-900 font-bold">
                {React.createElement(activeRoleData.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  {t('auth.portalBenefits', 'Portal Privileges & Features')}
                </span>
                <h4 className="font-bold text-stone-900 text-sm font-display">
                  {activeRoleData.title}
                </h4>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {activeRoleData.subtitle}
            </p>

            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              {activeRoleData.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Verification Guarantee */}
          <div className="bg-stone-900 text-white rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>{t('auth.securityPromise', 'Krishi Mitra Trust & Payment Information')}</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {t('auth.securityDesc', 'Equipment listings are provided by registered users. Booking requests are reviewed by the equipment owner before confirmation. Online booking payments are processed through Razorpay.')}
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800">
              <span>🇮🇳 {t('auth.paymentNote', 'Booking confirmation required')}</span>
              <span className="text-emerald-400 font-bold">{t('auth.paymentSecureBadge', 'Secure online payments')}</span>
            </div>
          </div>

          {/* Kisan Helpline Support */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-950 flex items-center justify-center font-bold">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-amber-900 font-bold block uppercase tracking-wider">
                  {t('auth.kisanHelpline', 'Kisan Support Desk')}
                </span>
                <span className="font-bold text-xs text-stone-900">
                  {t('auth.supportPrompt', 'Need help with a booking, payment or account?')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="text-[10px] font-bold text-stone-700 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition"
            >
              {t('auth.contactSupport', 'Contact Support')}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
