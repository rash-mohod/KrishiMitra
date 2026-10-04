import React from 'react';
import { Equipment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  CheckCircle,
  Heart,
  MapPin,
  MessageSquare,
  Star,
  UserCheck,
  Zap,
  Tractor
} from 'lucide-react';

interface EquipmentCardProps {
  equipment: Equipment;
  onViewDetails?: (id: string) => void;
  onSelect?: (equipment: Equipment) => void;
  onSelectEquipment?: (id: string) => void;
  onRentNow?: (equipment: Equipment) => void;
  onMessageOwner?: (equipment: Equipment) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onViewDetails,
  onSelect,
  onSelectEquipment,
  onRentNow,
  onMessageOwner
}) => {
  const { favorites, toggleFavorite } = useAuth();
  const { t, translateCategory, translateCondition } = useLanguage();
  const isFav = favorites.includes(equipment.id);

  const handleCardClick = () => {
    if (typeof onViewDetails === 'function') {
      onViewDetails(equipment.id);
    } else if (typeof onSelectEquipment === 'function') {
      onSelectEquipment(equipment.id);
    } else if (typeof onSelect === 'function') {
      onSelect(equipment);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Image & Badges */}
      <div className="relative aspect-16/10 bg-stone-100 overflow-hidden shrink-0">
        {equipment.images[0] ? (
          <img src={equipment.images[0]} alt={equipment.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300"><Tractor className="w-16 h-16" strokeWidth={1.2} /></div>
        )}

        {/* Category Pill */}
        <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
          {translateCategory(equipment.categoryId || equipment.categoryName)}
        </span>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(equipment.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition backdrop-blur-xs ${
            isFav
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-stone-900/60 text-white hover:bg-stone-900/80'
          }`}
          aria-label={t('common.saveToWishlist', 'Save to wishlist')}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
        </button>

        {/* HP / Power badge if tractor */}
        {equipment.horsepower && (
          <span className="absolute bottom-3 left-3 bg-emerald-800 text-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 text-amber-300" />
            <span>{equipment.horsepower} HP</span>
          </span>
        )}

        {/* Condition Tag */}
        <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
          {translateCondition(equipment.condition)}
        </span>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating and Reviews */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{equipment.rating > 0 ? equipment.rating.toFixed(1) : t('common.available', 'New')}</span>
              <span className="text-stone-400 font-normal">
                ({equipment.reviewCount} {t('common.reviews', 'reviews')})
              </span>
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              {equipment.totalRentals} {t('marketplace.rentals', 'rentals')}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="font-bold text-stone-900 text-sm hover:text-emerald-700 transition cursor-pointer line-clamp-1 font-display"
          >
            {equipment.name}
          </h3>

          {/* Location */}
          <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{equipment.district}, {equipment.state}</span>
          </p>

          {/* Owner & Operator Perks */}
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-stone-600 truncate">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-medium">{equipment.ownerName}</span>
              {equipment.ownerVerified && (
                <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
            </div>
            {equipment.operatorAvailable && (
              <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                {t('detail.driverAvailable', 'Driver Opt.')}
              </span>
            )}
          </div>
        </div>

        {/* Pricing and Action Footer */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-stone-400 block font-medium">{t('marketplace.pricePerDay', 'Rental Rate')}</span>
            <div className="text-base font-extrabold text-stone-900 font-display">
              ₹{equipment.pricePerDay.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-stone-500"> / {t('common.day', 'day')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onMessageOwner ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMessageOwner(equipment);
                }}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                title={t('chat.chatWithOwner', 'Message Owner')}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
            >
              {t('marketplace.viewDetails', 'Details')}
            </button>
            {onRentNow && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRentNow(equipment);
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('marketplace.bookNow', 'Rent')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
