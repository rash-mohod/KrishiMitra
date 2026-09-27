import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Trash2, UserRound, X } from 'lucide-react';

interface ProfilePhotoPickerProps {
  value?: string;
  onChange: (dataUrl?: string) => void;
  label?: string;
  compact?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;

export const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  value,
  onChange,
  label = 'Profile Picture',
  compact = false
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isReading, setIsReading] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const readFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select an image file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setCameraError('Profile picture must be 5 MB or smaller.');
      return;
    }
    setCameraError('');
    setIsReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === 'string' ? reader.result : undefined);
      setIsReading(false);
    };
    reader.onerror = () => {
      setCameraError('Could not read that image. Please try another photo.');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' } },
        audio: false
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err: any) {
      setCameraError(err?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Please allow camera access in your browser settings.'
        : 'Unable to open the camera.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement('canvas');
    const maxSize = 900;
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL('image/jpeg', 0.88));
    stopCamera();
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div>
        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px]">
          {label}
        </label>
      </div>

      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative shrink-0">
            <img src={value} alt="Profile preview" className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} rounded-2xl object-cover border-2 border-emerald-500`} />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow cursor-pointer"
              title="Remove profile picture"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} rounded-2xl bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center shrink-0`}>
            <UserRound className={compact ? 'w-7 h-7' : 'w-9 h-9'} strokeWidth={1.5} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => readFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isReading}
            className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl text-[11px] font-bold text-stone-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4 text-emerald-700" />
            From Device
          </button>
          <button
            type="button"
            onClick={startCamera}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-[11px] font-bold text-stone-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      {cameraError && <p className="text-[10px] font-semibold text-red-600">{cameraError}</p>}
      {cameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-200">
              <div>
                <h3 className="font-bold text-stone-900">Take Profile Picture</h3>
                <p className="text-[10px] text-stone-500">Allow camera access, then capture.</p>
              </div>
              <button type="button" onClick={stopCamera} className="p-2 rounded-xl hover:bg-stone-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black aspect-square flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={stopCamera} className="py-3 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-xs cursor-pointer flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Cancel
              </button>
              <button type="button" onClick={capture} className="py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
