import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { bookingToFrontend } from '../utils/mappers.js';
import { totalInclusiveDays } from '../utils/dates.js';
import { ok, fail } from '../utils/http.js';
import { calculateBookingPayment } from '../paymentCalculator.js';

const router = Router();
const bookingInput = z.object({
  equipmentId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupAddress: z.string().min(3),
  notes: z.string().optional(),
  farmerNote: z.string().optional(),
  operatorIncluded: z.boolean().optional().default(false)
});
const blockingStatuses = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'];

const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const select = '*, equipment:equipment!bookings_equipment_id_fkey(*, owner:profiles!equipment_owner_id_fkey(id,full_name,phone,is_verified)), farmer:profiles!bookings_farmer_id_fkey(id,full_name,email,phone,state,district,village), payment:payments(*)';

async function getBooking(id: string) {
  const { data, error } = await supabaseAdmin.from('bookings').select(select).eq('id', id).single();
  if (error || !data) return null;
  return data;
}

async function markExpiredBookings() {
  const today = indiaToday();
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id,farmer_id,booking_code')
    .eq('status', 'PENDING')
    .lt('start_date', today);

  if (error) throw new Error(error.message);
  for (const booking of data ?? []) {
    const { data: expired, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'EXPIRED' })
      .eq('id', booking.id)
      .eq('status', 'PENDING')
      .select('id')
      .maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (expired) {
      await notify(booking.farmer_id, 'Booking Expired', `Booking ${booking.booking_code} expired because the rental start date passed without owner approval.`, booking.id);
    }
  }
}

async function markExpiredRentalsCompleted() {
  const today = indiaToday();
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('status', 'ACTIVE')
    .lt('end_date', today);

  if (error) throw new Error(error.message);
  for (const booking of data ?? []) {
    await supabaseAdmin
      .from('payments')
      .update({ rental_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('booking_id', booking.id)
      .is('rental_completed_at', null);
  }
}

async function notify(userId: string, title: string, message: string, relatedBookingId?: string) {
  await supabaseAdmin.from('notifications').insert({ user_id: userId, title, message, type: 'BOOKING', related_booking_id: relatedBookingId ?? null, is_read: false });
}

async function hasConflict(equipmentId: string, startDate: string, endDate: string, excludeId?: string) {
  let q = supabaseAdmin.from('bookings').select('id').eq('equipment_id', equipmentId).in('status', blockingStatuses).lte('start_date', endDate).gte('end_date', startDate);
  if (excludeId) q = q.neq('id', excludeId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

router.post('/', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const i = bookingInput.parse(req.body);
    const days = totalInclusiveDays(i.startDate, i.endDate);
    if (days <= 0) return fail(res, 'End date cannot be before start date.', 400);

    const { data: eq, error: eqErr } = await supabaseAdmin.from('equipment').select('*').eq('id', i.equipmentId).eq('is_active', true).eq('approval_status', 'APPROVED').single();
    if (eqErr || !eq) return fail(res, 'Equipment is not available.', 404);
    if (eq.availability_status !== 'AVAILABLE') return fail(res, 'Equipment is currently unavailable.', 409);
    if (await hasConflict(i.equipmentId, i.startDate, i.endDate)) return fail(res, 'Equipment is already booked for the selected dates.', 409);

    const operatorAmount = i.operatorIncluded ? Number(eq.operator_cost_per_day ?? 0) * days : 0;
    const total = Number(eq.daily_rate) * days + operatorAmount;
    try { calculateBookingPayment({ totalRentalAmount: total, bookingAmount: Number(eq.booking_amount ?? 0) }); }
    catch (e) { return fail(res, e instanceof Error ? e.message : 'Invalid booking amount.', 400); }

    const row = {
      equipment_id: i.equipmentId,
      farmer_id: req.user!.id,
      start_date: i.startDate,
      end_date: i.endDate,
      total_days: days,
      daily_rate: eq.daily_rate,
      total_amount: total,
      operator_included: !!i.operatorIncluded,
      operator_amount: operatorAmount,
      status: 'PENDING',
      farmer_note: i.farmerNote ?? i.notes ?? null,
      pickup_address: i.pickupAddress
    };
    const { data: created, error } = await supabaseAdmin.from('bookings').insert(row).select('id').single();
    if (error) return fail(res, error.message, 400);
    const booking = await getBooking(created.id);
    if (!booking) return fail(res, 'Booking created but could not be loaded.', 500);
    await notify(eq.owner_id, 'New Booking Request', `A farmer requested ${eq.name} from ${i.startDate} to ${i.endDate}.`, created.id);
    return ok(res, { booking: bookingToFrontend(booking) }, 201);
  } catch (e) { next(e); }
});

router.get('/my', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await markExpiredBookings();
    await markExpiredRentalsCompleted();
    const { data, error } = await supabaseAdmin.from('bookings').select(select).eq('farmer_id', req.user!.id).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { bookings: (data ?? []).map(bookingToFrontend) });
  } catch (e) { next(e); }
});

router.get('/owner', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res, next) => {
  try {
    await markExpiredBookings();
    await markExpiredRentalsCompleted();
    const { data, error } = await supabaseAdmin.from('bookings').select(select).eq('equipment.owner_id', req.user!.id).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { bookings: (data ?? []).map(bookingToFrontend) });
  } catch (e) { next(e); }
});

router.get('/admin', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    await markExpiredBookings();
    const { data, error } = await supabaseAdmin.from('bookings').select(select).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { bookings: (data ?? []).map(bookingToFrontend) });
  } catch (e) { next(e); }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  await markExpiredBookings();
  const b = await getBooking(req.params.id);
  if (!b) return fail(res, 'Booking not found.', 404);
  const ownerId = b.equipment?.owner_id;
  const allowed = req.user!.role === 'ADMIN' || b.farmer_id === req.user!.id || ownerId === req.user!.id;
  if (!allowed) return fail(res, 'Forbidden.', 403);
  return ok(res, { booking: bookingToFrontend(b) });
});

router.get('/:id/availability', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('bookings').select('id,start_date,end_date').eq('equipment_id', req.params.id).in('status', blockingStatuses);
  if (error) return fail(res, error.message, 500);
  const start = String(req.query.startDate), end = String(req.query.endDate);
  return ok(res, { available: !(data ?? []).some((b: any) => start <= b.end_date && end >= b.start_date) });
});

router.post('/calculate-price', async (req, res) => {
  const s = z.object({ equipmentId: z.string(), startDate: z.string(), endDate: z.string(), operatorIncluded: z.boolean().optional().default(false) }).parse(req.body);
  const { data, error } = await supabaseAdmin.from('equipment').select('daily_rate,booking_amount,security_deposit,operator_cost_per_day').eq('id', s.equipmentId).single();
  if (error || !data) return fail(res, 'Equipment not found.', 404);
  const days = totalInclusiveDays(s.startDate, s.endDate);
  if (days <= 0) return fail(res, 'End date cannot be before start date.', 400);
  const operatorAmount = s.operatorIncluded ? Number(data.operator_cost_per_day ?? 0) * days : 0;
  const total = Number(data.daily_rate) * days + operatorAmount;
  const calculation = calculateBookingPayment({ totalRentalAmount: total, bookingAmount: Number(data.booking_amount ?? 0) });
  return ok(res, { durationDays: days, pricePerDay: Number(data.daily_rate), baseAmount: total, totalAmount: total, platformFee: calculation.platformFee, bookingAmount: calculation.bookingAmount, remainingRentalAmount: calculation.remainingRentalAmount, onlinePaymentAmount: calculation.onlinePaymentAmount, operatorAmount, securityDeposit: Number(data.security_deposit ?? 0) });
});

router.patch('/:id/accept', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res, next) => {
  try {
    await markExpiredBookings();
    const b = await getBooking(req.params.id);
    if (!b) return fail(res, 'Booking not found.', 404);
    if (b.equipment.owner_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
    if (b.status === 'EXPIRED') return fail(res, 'This booking has expired because the rental start date has passed.', 409);
    if (b.status !== 'PENDING') return fail(res, 'Only pending bookings can be accepted.', 409);
    if (await hasConflict(b.equipment_id, b.start_date, b.end_date, b.id)) return fail(res, 'Equipment is already booked for the selected dates.', 409);
    const note = z.object({ ownerNotes: z.string().optional() }).parse(req.body ?? {});
    const { data, error } = await supabaseAdmin.from('bookings').update({ status: 'PAYMENT_PENDING', owner_note: note.ownerNotes ?? null }).eq('id', b.id).eq('status', 'PENDING').select('id').single();
    if (error) return fail(res, error.message, 400);
    const total = Number(b.total_amount);
    const calc = calculateBookingPayment({ totalRentalAmount: total, bookingAmount: Number(b.equipment.booking_amount ?? 0) });
    await supabaseAdmin.from('payments').upsert({ booking_id: b.id, farmer_id: b.farmer_id, owner_id: b.equipment.owner_id, total_rental_amount: calc.totalRentalAmount, booking_amount: calc.bookingAmount, platform_fee: calc.platformFee, online_payment_amount: calc.onlinePaymentAmount, remaining_rental_amount: calc.remainingRentalAmount, payment_status: 'PENDING', remaining_payment_status: calc.remainingRentalAmount > 0 ? 'PENDING' : 'NOT_REQUIRED' }, { onConflict: 'booking_id' });
    const updated = await getBooking(data.id);
    await notify(b.farmer_id, 'Booking Approved — Payment Required', `Your booking for ${b.equipment.name} was approved. Pay ₹${calc.onlinePaymentAmount} online to confirm the booking.`, b.id);
    return ok(res, { booking: bookingToFrontend(updated) });
  } catch (e) { next(e); }
});

router.patch('/:id/reject', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res, next) => {
  try {
    await markExpiredBookings();
    const b = await getBooking(req.params.id);
    if (!b) return fail(res, 'Booking not found.', 404);
    if (b.equipment.owner_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
    if (b.status === 'EXPIRED') return fail(res, 'This booking has already expired.', 409);
    const reason = z.object({ reason: z.string().min(2) }).parse(req.body).reason;
    const { data, error } = await supabaseAdmin.from('bookings').update({ status: 'REJECTED', rejection_reason: reason }).eq('id', b.id).eq('status', 'PENDING').select('id').single();
    if (error) return fail(res, error.message, 400);
    const updated = await getBooking(data.id);
    await notify(b.farmer_id, 'Booking Rejected', `Your booking for ${b.equipment.name} was rejected: ${reason}`, b.id);
    return ok(res, { booking: bookingToFrontend(updated) });
  } catch (e) { next(e); }
});

router.patch('/:id/cancel', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const b = await getBooking(req.params.id);
    if (!b) return fail(res, 'Booking not found.', 404);
    const allowed = req.user!.role === 'ADMIN' || b.farmer_id === req.user!.id || b.equipment.owner_id === req.user!.id;
    if (!allowed) return fail(res, 'Forbidden.', 403);
    if (!['PENDING', 'PAYMENT_PENDING'].includes(b.status)) return fail(res, 'This booking can no longer be cancelled.', 409);
    const reason = z.object({ reason: z.string().min(2) }).parse(req.body).reason;
    const { data, error } = await supabaseAdmin.from('bookings').update({ status: 'CANCELLED', cancellation_reason: reason }).eq('id', b.id).select('id').single();
    if (error) return fail(res, error.message, 400);
    const updated = await getBooking(data.id);
    const other = b.farmer_id === req.user!.id ? b.equipment.owner_id : b.farmer_id;
    await notify(other, 'Booking Cancelled', `Booking ${b.booking_code} was cancelled.`, b.id);
    return ok(res, { booking: bookingToFrontend(updated) });
  } catch (e) { next(e); }
});

router.patch('/:id/start', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res) => {
  const b = await getBooking(req.params.id);
  if (!b) return fail(res, 'Booking not found.', 404);
  if (b.equipment.owner_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
  if (b.status !== 'CONFIRMED') return fail(res, 'Only paid and confirmed bookings can be started.', 409);
  const today = indiaToday();
  if (String(b.end_date) < today) return fail(res, 'Rental period has already ended. This rental cannot be started.', 409);
  if (String(b.start_date) > today) return fail(res, 'Rental cannot be started before the rental start date.', 409);
  const { data, error } = await supabaseAdmin.from('bookings').update({ status: 'ACTIVE' }).eq('id', b.id).eq('status', 'CONFIRMED').select('id').single();
  if (error) return fail(res, error.message, 400);
  const u = await getBooking(data.id);
  await notify(b.farmer_id, 'Rental Started', 'Your equipment rental has been marked active.', b.id);
  return ok(res, { booking: bookingToFrontend(u) });
});

router.patch('/:id/stop', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const b = await getBooking(req.params.id);
    if (!b) return fail(res, 'Booking not found.', 404);
    const isOwner = req.user!.role === 'OWNER' && b.equipment.owner_id === req.user!.id;
    const isFarmer = req.user!.role === 'FARMER' && b.farmer_id === req.user!.id;
    if (!isOwner && !isFarmer) return fail(res, 'Forbidden.', 403);
    if (b.status !== 'ACTIVE') return fail(res, 'Only active rentals can be stopped.', 409);
    const input = z.object({
      reason: z.string().min(2),
      message: z.string().optional()
    }).parse(req.body);
    const stoppedBy = isOwner ? 'OWNER' : 'FARMER';
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'STOPPED', stopped_by: stoppedBy, stop_reason: input.reason, stop_message: input.message?.trim() || null, stopped_at: new Date().toISOString() })
      .eq('id', b.id)
      .eq('status', 'ACTIVE')
      .select('id')
      .single();
    if (error) return fail(res, error.message, 400);
    const updated = await getBooking(data.id);
    const otherUserId = isOwner ? b.farmer_id : b.equipment.owner_id;
    const who = isOwner ? 'Owner' : 'Farmer';
    const detail = input.message?.trim() ? ` Message: ${input.message.trim()}` : '';
    await notify(otherUserId, 'Rental Stopped', `${who} stopped rental ${b.booking_code}. Reason: ${input.reason}.${detail}`, b.id);
    return ok(res, { booking: bookingToFrontend(updated) });
  } catch (e) { next(e); }
});

router.post('/:id/rental-completed', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res) => {
  const b = await getBooking(req.params.id);
  if (!b) return fail(res, 'Booking not found.', 404);
  if (b.farmer_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
  if (b.status !== 'ACTIVE') return fail(res, 'Only active rentals can be completed.', 409);
  const { error } = await supabaseAdmin.from('payments').update({ rental_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('booking_id', b.id);
  if (error) return fail(res, error.message, 400);
  await notify(b.equipment.owner_id, 'Farmer Marked Rental Completed', `Farmer marked booking ${b.booking_code} as rental completed. Confirm the remaining payment when received.`, b.id);
  const updated = await getBooking(b.id);
  return ok(res, { booking: bookingToFrontend(updated) });
});

router.patch('/:id/complete', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res) => {
  const b = await getBooking(req.params.id);
  if (!b) return fail(res, 'Booking not found.', 404);
  if (b.equipment.owner_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
  if (b.status !== 'ACTIVE') return fail(res, 'Only active rentals can be completed.', 409);
  if (!b.payment) return fail(res, 'Payment record not found.', 409);
  if (!b.payment.rental_completed_at) return fail(res, 'Farmer must mark the rental completed first.', 409);
  if (Number(b.payment.remaining_rental_amount) > 0 && b.payment.remaining_payment_status !== 'PAID') return fail(res, 'Confirm the remaining Cash/UPI payment before completing the booking.', 409);
  const { data, error } = await supabaseAdmin.from('bookings').update({ status: 'COMPLETED' }).eq('id', b.id).select('id').single();
  if (error) return fail(res, error.message, 400);
  await supabaseAdmin.from('equipment').update({ total_rentals: Number(b.equipment.total_rentals ?? 0) + 1 }).eq('id', b.equipment_id);
  const u = await getBooking(data.id);
  await notify(b.farmer_id, 'Rental Completed', `Booking ${b.booking_code} has been completed.`, b.id);
  return ok(res, { booking: bookingToFrontend(u) });
});

export default router;
