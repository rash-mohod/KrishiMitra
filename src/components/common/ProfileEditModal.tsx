import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Mail, MapPin, Phone, Save, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { ProfilePhotoPicker } from './ProfilePhotoPicker';
import { INDIA_STATES_AND_UTS, getDistrictsForState } from '../../data/indiaLocations';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

const isLegacyDemoAvatar = (value?: string) => {
  if (!value) return false;
  return /(^|\.)unsplash\.com|images\.unsplash\.com/i.test(value);
};

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ open, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setState(user.state || '');
    setDistrict(user.district || '');
    setVillage(user.village || '');
    setBio(user.bio || '');
    setPhoto(isLegacyDemoAvatar(user.avatarUrl) ? undefined : (user.avatarUrl || undefined));
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    setError('');
    setSuccess('');
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  // The modal is rendered directly under <body>. This prevents sticky/header
  // stacking contexts (backdrop-filter/transform) from clipping or hiding it.
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!state || !district) {
      setError('Please select your state and district.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = photo;
      if (photo?.startsWith('data:image/')) {
        const updated = await authApi.uploadProfileImage(photo, 'profile-picture.jpg');
        avatarUrl = updated.avatarUrl;
      }

      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        state,
        district,
        village: village.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl ?? ''
      });

      setSuccess('Profile updated successfully.');
      window.setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setError(err?.message || 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 md:p-8 flex items-start justify-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
      aria-modal="true"
    >
      <div
        ref={scrollRef}
        className="relative w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-stone-200"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-5 sm:px-7 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-xl text-stone-900">Edit Profile</h2>
            <p className="text-xs text-stone-500">Update your personal information and profile picture.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-7 space-y-6">
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
          {success && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</div>}

          <ProfilePhotoPicker value={photo} onChange={setPhoto} label="Profile Picture" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <input value={name} onChange={e => setName(e.target.value)} required className="w-full pl-9 pr-3 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                <UserRound className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Mobile Number *</label>
              <div className="relative">
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} minLength={10} inputMode="numeric" required className="w-full pl-9 pr-3 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                <Phone className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Exactly 10 digits.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Email Address</label>
            <div className="relative">
              <input value={user.email} readOnly className="w-full pl-9 pr-3 py-3 border border-stone-200 bg-stone-50 rounded-xl text-sm text-stone-500 cursor-not-allowed" />
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Email is managed by your secure login account and cannot be changed here.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">State *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-stone-400 z-10" />
                <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} required className="w-full pl-9 pr-3 py-3 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm">
                  <option value="">Select State</option>
                  {INDIA_STATES_AND_UTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">District *</label>
              <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state} required className="w-full px-3 py-3 border border-stone-300 rounded-xl bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm">
                <option value="">{state ? 'Select District' : 'Select State First'}</option>
                {getDistrictsForState(state).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Village / Tehsil</label>
            <input value={village} onChange={e => setVillage(e.target.value)} placeholder="Enter village or tehsil" className="w-full px-3 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Bio / Farm Summary</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell us a little about your agricultural work..." className="w-full px-3 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};
