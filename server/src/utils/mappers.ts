import { calculateBookingPayment } from '../paymentCalculator.js';
export const profileToUser = (p: any) => ({
  id: p.id, name: p.full_name, email: p.email, phone: p.phone ?? '', role: p.role,
  avatarUrl: p.profile_image ?? undefined, state: p.state ?? '', district: p.district ?? '',
  village: p.village ?? '', isVerified: !!p.is_verified, isActive: !!p.is_active,
  createdAt: p.created_at, bio: p.bio ?? ''
});

export function equipmentToFrontend(e: any) {
  const owner = e.owner;
  const images = Array.isArray(e.image_urls) ? e.image_urls : (e.image_url ? [e.image_url] : []);
  return {
    id: e.id, ownerId: e.owner_id, ownerName: owner?.full_name ?? '', ownerPhone: owner?.phone ?? '',
    ownerRating: Number(owner?.rating ?? 0), ownerVerified: !!owner?.is_verified,
    name: e.name, categoryId: e.category_id ?? '', categoryName: e.category_name ?? e.category?.name ?? '',
    brand: e.brand ?? '', model: e.model ?? '', manufacturingYear: Number(e.manufacturing_year ?? new Date().getFullYear()),
    horsepower: e.horsepower ?? undefined, fuelType: e.fuel_type ?? undefined, condition: e.condition,
    description: e.description ?? '', specifications: e.specifications ?? {}, images,
    pricePerHour: Number(e.price_per_hour ?? 0), pricePerDay: Number(e.daily_rate ?? 0), pricePerWeek: Number(e.price_per_week ?? Number(e.daily_rate ?? 0) * 7),
    securityDeposit: Number(e.security_deposit ?? 0), operatorAvailable: !!e.operator_available, operatorCostPerDay: Number(e.operator_cost_per_day ?? 0), bookingAmount: Number(e.booking_amount ?? 0),
    location: e.location ?? '', district: e.district ?? '', state: e.state ?? '', pincode: e.pincode ?? '',
    status: e.availability_status === 'AVAILABLE' ? 'AVAILABLE' : e.availability_status === 'MAINTENANCE' ? 'MAINTENANCE' : 'INACTIVE',
    approvalStatus: e.approval_status, rejectionReason: e.rejection_reason ?? undefined,
    rating: Number(e.rating ?? 0), reviewCount: Number(e.review_count ?? 0), totalRentals: Number(e.total_rentals ?? 0),
    createdAt: e.created_at, isFeatured: !!e.is_featured
  };
}

export function bookingToFrontend(b: any) {
  const e = b.equipment;
  const farmer = b.farmer;
  const owner = e?.owner ?? b.owner;
  const payment = b.payment ?? null;
  let calc = { totalRentalAmount: Number(b.total_amount ?? 0), bookingAmount: Number(e?.booking_amount ?? 0), remainingRentalAmount: Number(b.total_amount ?? 0) - Number(e?.booking_amount ?? 0), platformFee: 0, onlinePaymentAmount: Number(e?.booking_amount ?? 0) };
  try { calc = calculateBookingPayment({ totalRentalAmount: Number(b.total_amount ?? 0), bookingAmount: Number(e?.booking_amount ?? 0) }); } catch { /* invalid legacy data is surfaced without crashing reads */ }
  return {
    id: b.id, bookingCode: b.booking_code, equipmentId: b.equipment_id, equipmentName: e?.name ?? '',
    equipmentImage: e?.image_urls?.[0] ?? e?.image_url ?? '', equipmentLocation: e?.location ?? '',
    categoryId: e?.category_id ?? '', categoryName: e?.category_name ?? '', farmerId: b.farmer_id,
    farmerName: farmer?.full_name ?? '', farmerPhone: farmer?.phone ?? '', farmerEmail: farmer?.email ?? '',
    farmerLocation: [farmer?.district, farmer?.state].filter(Boolean).join(', '), ownerId: e?.owner_id ?? b.owner_id,
    ownerName: owner?.full_name ?? '', ownerPhone: owner?.phone ?? '', startDate: b.start_date ? String(b.start_date).slice(0, 10) : '', endDate: b.end_date ? String(b.end_date).slice(0, 10) : '',
    durationDays: b.total_days, pricePerDay: Number(b.daily_rate), baseAmount: Number(b.total_amount), platformFee: Number(payment?.platform_fee ?? calc.platformFee),
    operatorIncluded: !!b.operator_included, operatorAmount: Number(b.operator_amount ?? 0), securityDeposit: Number(e?.security_deposit ?? 0), totalAmount: Number(b.total_amount), status: b.status,
    paymentStatus: payment?.payment_status ?? (b.status === 'PAYMENT_PENDING' ? 'PENDING' : 'PENDING'),
    bookingAmount: Number(payment?.booking_amount ?? calc.bookingAmount), remainingRentalAmount: Number(payment?.remaining_rental_amount ?? calc.remainingRentalAmount),
    paymentId: payment?.id, razorpayOrderId: payment?.razorpay_order_id, razorpayPaymentId: payment?.razorpay_payment_id, paidAt: payment?.payment_status === 'PAID' ? payment?.updated_at : undefined, remainingPaymentStatus: payment?.remaining_payment_status, remainingPaymentMethod: payment?.remaining_payment_method, rentalCompletedAt: payment?.rental_completed_at, ownerPaymentConfirmedAt: payment?.owner_payment_confirmed_at,
    ownerNotes: b.owner_note ?? undefined, rejectionReason: b.rejection_reason ?? undefined, cancellationReason: b.cancellation_reason ?? undefined,
    pickupAddress: b.pickup_address ?? '', notes: b.farmer_note ?? '', createdAt: b.created_at, updatedAt: b.updated_at
  };
}
