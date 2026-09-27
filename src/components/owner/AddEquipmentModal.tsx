import React, { useState, useRef, useEffect } from 'react';
import { Category, Equipment, EquipmentCondition } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { equipmentApi } from '../../services/api';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  Plus,
  Tractor,
  Trash2,
  Upload,
  UploadCloud,
  X
} from 'lucide-react';

interface AddEquipmentModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEquipment?: Equipment | null;
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  categories,
  isOpen,
  onClose,
  onSuccess,
  editingEquipment = null
}) => {
  const { user } = useAuth();
  const { t, translateCategory } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-tractors');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState<number>(2024);
  const [horsepower, setHorsepower] = useState<number>(50);
  const [fuelType, setFuelType] = useState<'DIESEL' | 'ELECTRIC' | 'PETROL' | 'MANUAL'>('DIESEL');
  const [condition, setCondition] = useState<EquipmentCondition>('EXCELLENT');
  const [pricePerHour, setPricePerHour] = useState<string>('');
  const [pricePerDay, setPricePerDay] = useState<string>('');
  const [bookingAmount, setBookingAmount] = useState<string>('');
  const [pricePerWeek, setPricePerWeek] = useState<string>('');
  const [securityDeposit, setSecurityDeposit] = useState<string>('');
  const [operatorAvailable, setOperatorAvailable] = useState(true);
  const [operatorCostPerDay, setOperatorCostPerDay] = useState<string>('');
  const [location, setLocation] = useState(user?.village ? `${user.village}, ${user.district}` : 'Katol Road, Nagpur');
  const [district, setDistrict] = useState(user?.district || 'Nagpur');
  const [state, setState] = useState(user?.state || 'Maharashtra');
  const [pincode, setPincode] = useState('440013');
  const [description, setDescription] = useState('');

  // Image Management State
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Spec presets
  const [spec1Key, setSpec1Key] = useState('Engine Power');
  const [spec1Val, setSpec1Val] = useState('50 HP @ 2100 RPM');
  const [spec2Key, setSpec2Key] = useState('Lifting Capacity');
  const [spec2Val, setSpec2Val] = useState('1800 kg');

  const resetForm = () => {
    setError(null);
    setName('');
    setCategoryId(categories[0]?.id || 'cat-tractors');
    setBrand('');
    setModel('');
    setManufacturingYear(2024);
    setHorsepower(50);
    setFuelType('DIESEL');
    setCondition('EXCELLENT');
    setPricePerHour('');
    setPricePerDay('');
    setBookingAmount('');
    setPricePerWeek('');
    setSecurityDeposit('');
    setOperatorAvailable(true);
    setOperatorCostPerDay('');
    setLocation(user?.village ? `${user.village}, ${user.district}` : 'Katol Road, Nagpur');
    setDistrict(user?.district || 'Nagpur');
    setState(user?.state || 'Maharashtra');
    setPincode('440013');
    setDescription('');
    setImages([]);
    setSpec1Key('Engine Power');
    setSpec1Val('50 HP @ 2100 RPM');
    setSpec2Key('Lifting Capacity');
    setSpec2Val('1800 kg');
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!editingEquipment) {
      resetForm();
      return;
    }

    const specs = Object.entries(editingEquipment.specifications || {});
    setError(null);
    setName(editingEquipment.name || '');
    setCategoryId(editingEquipment.categoryId || categories[0]?.id || 'cat-tractors');
    setBrand(editingEquipment.brand || '');
    setModel(editingEquipment.model || '');
    setManufacturingYear(Number(editingEquipment.manufacturingYear || new Date().getFullYear()));
    setHorsepower(Number(editingEquipment.horsepower || 0));
    setFuelType(editingEquipment.fuelType || 'DIESEL');
    setCondition(editingEquipment.condition || 'GOOD');
    setPricePerHour(editingEquipment.pricePerHour != null ? String(editingEquipment.pricePerHour) : '');
    setPricePerDay(editingEquipment.pricePerDay != null ? String(editingEquipment.pricePerDay) : '');
    setBookingAmount(editingEquipment.bookingAmount != null ? String(editingEquipment.bookingAmount) : '');
    setPricePerWeek(editingEquipment.pricePerWeek != null ? String(editingEquipment.pricePerWeek) : '');
    setSecurityDeposit(editingEquipment.securityDeposit != null ? String(editingEquipment.securityDeposit) : '');
    setOperatorAvailable(Boolean(editingEquipment.operatorAvailable));
    setOperatorCostPerDay(editingEquipment.operatorCostPerDay != null ? String(editingEquipment.operatorCostPerDay) : '');
    setLocation(editingEquipment.location || '');
    setDistrict(editingEquipment.district || '');
    setState(editingEquipment.state || '');
    setPincode(editingEquipment.pincode || '');
    setDescription(editingEquipment.description || '');
    setImages(editingEquipment.images?.length ? editingEquipment.images : []);
    setSpec1Key(specs[0]?.[0] || 'Engine Power');
    setSpec1Val(specs[0]?.[1] || '');
    setSpec2Key(specs[1]?.[0] || 'Lifting Capacity');
    setSpec2Val(specs[1]?.[1] || '');
  }, [isOpen, editingEquipment?.id, categories.length]);

  // Category changes no longer inject stock/preset images.
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsStartingCamera(false);
  };

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !cameraStreamRef.current) return;
    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => undefined);
  }, [isCameraOpen]);

  // Open the real device camera using getUserMedia instead of a file picker.
  const handleTakePhoto = async () => {
    setError(null);
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera access is not supported by this browser. Please use Choose From Device instead.');
      setIsCameraOpen(true);
      return;
    }

    setIsStartingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err: any) {
      const message = err?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Please allow camera access in your browser settings and try again.'
        : err?.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : 'Could not open the camera. Please check your browser permissions and try again.';
      setCameraError(message);
      setIsCameraOpen(true);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (isUploadingPhoto) return;

    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera is still starting. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Could not capture the camera image. Please try again.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCameraError(null);

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => {
          if (result) resolve(result);
          else reject(new Error('Could not create the captured photo.'));
        }, 'image/jpeg', 0.9);
      });

      if (blob.size > 5 * 1024 * 1024) {
        setCameraError('Captured photo is larger than 5 MB. Please retake the photo.');
        return;
      }

      const file = new File([blob], `krishimitra-camera-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // The photo is captured locally first. Stop the live camera immediately so
      // the user does not remain stuck on a "Processing..." camera screen.
      stopCamera();
      setIsUploadingPhoto(true);
      try {
        await handleFileUpload([file]);
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Camera photo upload failed.');
    }
  };

  // Open the normal device gallery/file picker without forcing camera capture.
  const handleChooseFromDevice = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // Handle Device Camera/File Upload
  const handleFileUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { setError('Please upload a valid machinery photo.'); continue; }
      if (file.size > 5 * 1024 * 1024) { setError('Each photo must be 5 MB or smaller.'); continue; }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Could not read photo.'));
          reader.readAsDataURL(file);
        });
        const publicUrl = await equipmentApi.uploadImage(dataUrl, file.name);
        setImages(prev => [...prev, publicUrl]);
      } catch (err: any) {
        setError(err.message || 'Photo upload failed.');
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      setError('Please keep at least one machinery image.');
      return;
    }
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setImages(prev => {
      const item = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      return [item, ...rest];
    });
  };

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Please provide machinery title and detailed description.');
      return;
    }

    if (images.length === 0) {
      setError('At least one real machinery photo is required before you can create or save this listing.');
      return;
    }

    if (!pricePerDay.trim() || Number(pricePerDay) <= 0) {
      setError('Please enter the Price Per Day before saving the machinery listing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedCat = categories.find(c => c.id === categoryId);

    try {
      const payload = {
        name: name.trim(),
        categoryId,
        categoryName: selectedCat ? selectedCat.name : (editingEquipment?.categoryName || 'Tractors'),
        brand,
        model: model.trim() || name.trim(),
        manufacturingYear: Number(manufacturingYear),
        horsepower: horsepower ? Number(horsepower) : undefined,
        fuelType,
        condition,
        description: description.trim(),
        specifications: {
          [spec1Key]: spec1Val,
          [spec2Key]: spec2Val
        },
        images,
        pricePerHour: Number(pricePerHour || 0),
        pricePerDay: Number(pricePerDay || 0),
        bookingAmount: Number(bookingAmount || 0),
        pricePerWeek: Number(pricePerWeek || 0),
        securityDeposit: Number(securityDeposit || 0),
        operatorAvailable,
        operatorCostPerDay: operatorAvailable ? Number(operatorCostPerDay || 0) : 0,
        location,
        district,
        state,
        pincode,
        status: editingEquipment?.status || 'AVAILABLE'
      };

      if (editingEquipment) {
        await equipmentApi.updateEquipment(editingEquipment.id, user.id, payload);
      } else {
        await equipmentApi.createEquipment(user, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit equipment listing.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isCameraOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-stone-900">Take Machinery Photo</h3>
                <p className="text-xs text-stone-500 mt-0.5">Position the machinery clearly inside the camera frame.</p>
              </div>
              <button type="button" onClick={stopCamera} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isStartingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">Opening camera…</div>
              )}
              {cameraError && (
                <div className="absolute inset-x-4 bottom-4 bg-red-600/95 text-white rounded-xl p-3 text-xs">
                  {cameraError}
                </div>
              )}
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <button type="button" onClick={handleTakePhoto} disabled={isStartingCamera} className="px-4 py-2.5 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-50 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Restart Camera
              </button>
              <button type="button" onClick={handleCapturePhoto} disabled={isStartingCamera || !!cameraError || isUploadingPhoto} className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl space-y-6 border border-stone-200 animate-in fade-in zoom-in-95 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-stone-900">
                {editingEquipment ? 'Edit Machinery Details' : t('addMachinery.title', 'List New Farm Machinery for Rent')}
              </h2>
              <p className="text-xs text-stone-500">
                {editingEquipment ? 'Update the machinery information and save your changes.' : t('addMachinery.subtitle', 'Submissions are reviewed by State Ag Extension Moderators within 2-4 hours.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isUploadingPhoto && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
            Photo captured. Uploading the machinery photo…
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                {t('addMachinery.titleLabel', 'Equipment Title / Name *')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mahindra 575 DI Sarpanch 47 HP"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                {t('common.category', 'Category *')}
              </label>
              <select
                value={categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm font-medium"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {translateCategory(c.id) || c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Brand, Model, Year, HP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('common.brand', 'Brand')}</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="John Deere, Mahindra..."
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('common.model', 'Model / Series')}</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="5310 PowerPro"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('common.manufacturingYear', 'Mfg Year')}</label>
              <input
                type="number"
                value={manufacturingYear}
                min={2010}
                max={2026}
                onChange={e => setManufacturingYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('common.horsepower', 'Horsepower (HP)')}</label>
              <input
                type="number"
                value={horsepower}
                onChange={e => setHorsepower(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* MACHINERY IMAGES SECTION - REAL DEVICE/CAMERA PHOTOS ONLY */}
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3.5">
            <div>
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>Machinery Photos *</span>
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Take a real photo of the machinery using your device. At least one photo is required for every listing.
              </p>
            </div>

            {/* Normal device/gallery picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => { handleFileUpload(e.target.files); e.currentTarget.value = ''; }}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleChooseFromDevice}
                className="border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-stone-50 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-11 h-11 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="font-bold text-stone-800 text-xs">
                  Choose From Device
                </span>
                <span className="text-[10px] text-stone-500">
                  Select existing machinery photos from your phone or computer.
                </span>
              </button>

              <button
                type="button"
                onClick={handleTakePhoto}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="font-bold text-stone-800 text-xs">
                  Take Photo With Camera
                </span>
                <span className="text-[10px] text-stone-500">
                  Permission will be requested before opening the camera.
                </span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-700">
                  Attached Photos ({images.length})
                </span>
                <span className="text-[10px] text-stone-500">
                  First photo is used as the main listing cover
                </span>
              </div>

              {images.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-[10px] text-amber-800 font-semibold">
                  No photo added yet. Add at least one real machinery photo before saving.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-300 aspect-4/3 bg-stone-100">
                      <img
                        src={imgUrl}
                        alt={`Machinery Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-emerald-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 p-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            title="Set as Cover"
                            className="p-1 bg-white text-stone-800 rounded text-[10px] font-bold hover:bg-emerald-100"
                          >
                            ★
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove Photo"
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Tariff */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
              {t('addMachinery.pricingTitle', 'Authoritative Rental Rates (INR ₹)')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-stone-600 mb-1">{t('common.pricePerDay', 'Price Per Day *')}</label>
                <input
                  type="number"
                  value={pricePerDay}
                  onChange={e => setPricePerDay(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-bold text-stone-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">{t('common.pricePerHour', 'Price Per Hour')}</label>
                <input
                  type="number"
                  value={pricePerHour}
                  onChange={e => setPricePerHour(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">{t('common.pricePerWeek', 'Price Per Week')}</label>
                <input
                  type="number"
                  value={pricePerWeek}
                  onChange={e => setPricePerWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">{t('common.deposit', 'Security Deposit')}</label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={e => setSecurityDeposit(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">Booking / Advance Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={Math.floor(Number(pricePerDay || 0) * 0.2)}
                  value={bookingAmount}
                  onChange={e => {
                    const rawValue = e.target.value;
                    if (rawValue === '') {
                      setBookingAmount('');
                      return;
                    }

                    const value = Math.max(0, Number(rawValue));
                    const maximumBookingAmount = Math.floor(Number(pricePerDay || 0) * 0.2);

                    if (value > maximumBookingAmount) {
                      window.alert(`Booking / Advance Amount cannot exceed 20% of the daily rent. Maximum allowed: ₹${maximumBookingAmount}`);
                      setBookingAmount(String(maximumBookingAmount));
                      return;
                    }

                    setBookingAmount(rawValue);
                  }}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-bold text-xs"
                />
                <p className="text-[10px] text-stone-500 mt-1">Maximum booking / advance amount is 20% of the daily rent (₹{Math.floor(Number(pricePerDay || 0) * 0.2).toLocaleString('en-IN')}).</p>
              </div>
            </div>
          </div>

          {/* Operator & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-900 mb-2">
                <input
                  type="checkbox"
                  checked={operatorAvailable}
                  onChange={e => setOperatorAvailable(e.target.checked)}
                  className="accent-emerald-700 w-4 h-4 rounded"
                />
                <span>{t('addMachinery.operatorOption', 'Can provide skilled certified driver/operator')}</span>
              </label>
              {operatorAvailable && (
                <div>
                  <label className="block text-stone-600 mb-1">{t('addMachinery.operatorFeeLabel', 'Operator Cost Per Day (₹)')}</label>
                  <input
                    type="number"
                    value={operatorCostPerDay}
                    onChange={e => setOperatorCostPerDay(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                {t('common.condition', 'Machinery Working Condition')}
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs font-semibold"
              >
                <option value="EXCELLENT">{t('marketplace.excellent', 'EXCELLENT (New or recently serviced)')}</option>
                <option value="GOOD">{t('marketplace.good', 'GOOD (Well-maintained, reliable)')}</option>
                <option value="FAIR">{t('marketplace.fair', 'FAIR (Functional standard wear)')}</option>
              </select>
            </div>
          </div>

          {/* Location & Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('addMachinery.yardAddress', 'Yard Address / Tehsil')}</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('addMachinery.districtState', 'District & State')}</label>
              <input
                type="text"
                value={`${district}, ${state}`}
                onChange={e => {
                  const parts = e.target.value.split(',');
                  setDistrict(parts[0]?.trim() || district);
                  if (parts[1]) setState(parts[1]?.trim());
                }}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('addMachinery.pincode', 'Pincode')}</label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              {t('addMachinery.descriptionLabel', 'Description & Implements Supported *')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detail engine condition, clutch type, hydraulic capacity, compatible implements, and maintenance schedule..."
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>{t('addMachinery.submitting', 'Submitting for Approval...')}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingEquipment ? 'Save Changes' : t('addMachinery.submitBtn', 'Submit Machinery for Review')}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
    </>
  );
};
