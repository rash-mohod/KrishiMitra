import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { fail, ok } from '../utils/http.js';
import { calculateBookingPayment } from '../paymentCalculator.js';
import { createRazorpayOrder, getRazorpayPayment, verifyPaymentSignature, verifyWebhookSignature } from '../razorpay.js';

const router = Router();

async function loadBookingForPayment(id: string) {
  return supabaseAdmin.from('bookings').select('*, equipment:equipment!bookings_equipment_id_fkey(id,name,daily_rate,booking_amount,owner_id), farmer:profiles!bookings_farmer_id_fkey(id,full_name,email,phone)').eq('id', id).single();
}

function paymentToFrontend(p: any) {
  return {
    id: p.id, bookingId: p.booking_id, bookingCode: p.booking?.booking_code ?? '',
    userId: p.farmer_id, userName: p.booking?.farmer?.full_name ?? '', userRole: 'FARMER',
    ownerId: p.owner_id, ownerName: p.booking?.equipment?.owner?.full_name ?? '',
    amount: Number(p.online_payment_amount ?? 0), platformFee: Number(p.platform_fee ?? 0),
    ownerNetEarnings: Number(p.remaining_rental_amount ?? 0), currency: 'INR',
    status: p.payment_status, paymentMethod: 'RAZORPAY', razorpayOrderId: p.razorpay_order_id ?? '',
    razorpayPaymentId: p.razorpay_payment_id ?? undefined, razorpaySignature: p.razorpay_signature ?? undefined,
    createdAt: p.created_at,
    totalRentalAmount: Number(p.total_rental_amount ?? 0), bookingAmount: Number(p.booking_amount ?? 0),
    onlinePaymentAmount: Number(p.online_payment_amount ?? 0), remainingRentalAmount: Number(p.remaining_rental_amount ?? 0),
    remainingPaymentStatus: p.remaining_payment_status, remainingPaymentMethod: p.remaining_payment_method ?? undefined,
    rentalCompletedAt: p.rental_completed_at ?? undefined, ownerPaymentConfirmedAt: p.owner_payment_confirmed_at ?? undefined,
    gatewayError: p.gateway_error ?? undefined
  };
}

router.post('/create-order', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const { bookingId } = z.object({ bookingId: z.string().min(1) }).parse(req.body);
    const { data: booking, error } = await loadBookingForPayment(bookingId);
    if (error || !booking) return fail(res, 'Booking not found.', 404);
    if (booking.farmer_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
    if (booking.status !== 'PAYMENT_PENDING') return fail(res, 'This booking is not awaiting online payment.', 409);

    const calc = calculateBookingPayment({ totalRentalAmount: Number(booking.total_amount), bookingAmount: Number(booking.equipment.booking_amount ?? 0) });
    if (calc.onlinePaymentAmount <= 0) {
      await supabaseAdmin.from('payments').update({ payment_status: 'PAID', remaining_payment_status: calc.remainingRentalAmount > 0 ? 'PENDING' : 'NOT_REQUIRED' }).eq('booking_id', booking.id);
      await supabaseAdmin.from('bookings').update({ status: 'CONFIRMED' }).eq('id', booking.id);
      return ok(res, { noPaymentRequired: true, breakdown: calc });
    }

    const { data: existing } = await supabaseAdmin.from('payments').select('*').eq('booking_id', booking.id).single();
    if (existing?.payment_status === 'PAID') return ok(res, { alreadyPaid: true, breakdown: calc });

    const order = await createRazorpayOrder(calc.onlinePaymentAmount, `KM-${booking.booking_code}`, { bookingId: booking.id, farmerId: booking.farmer_id, ownerId: booking.equipment.owner_id });
    const { data: payment, error: paymentError } = await supabaseAdmin.from('payments').upsert({ booking_id: booking.id, farmer_id: booking.farmer_id, owner_id: booking.equipment.owner_id, total_rental_amount: calc.totalRentalAmount, booking_amount: calc.bookingAmount, platform_fee: calc.platformFee, online_payment_amount: calc.onlinePaymentAmount, remaining_rental_amount: calc.remainingRentalAmount, remaining_payment_status: calc.remainingRentalAmount > 0 ? 'PENDING' : 'NOT_REQUIRED', payment_status: 'ORDER_CREATED', razorpay_order_id: order.id, gateway_error: null }, { onConflict: 'booking_id' }).select('*').single();
    if (paymentError) return fail(res, paymentError.message, 500);

    return ok(res, { orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID, amount: calc.onlinePaymentAmount, currency: 'INR', breakdown: calc, payment: paymentToFrontend(payment) });
  } catch (e) { next(e); }
});

router.post('/verify', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ bookingId: z.string(), razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }).parse(req.body);
    const { data: booking, error: bookingError } = await loadBookingForPayment(input.bookingId);
    if (bookingError || !booking) return fail(res, 'Booking not found.', 404);
    if (booking.farmer_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
    const { data: payment } = await supabaseAdmin.from('payments').select('*').eq('booking_id', input.bookingId).single();
    if (!payment) return fail(res, 'Payment record not found.', 404);
    if (payment.razorpay_order_id && payment.razorpay_order_id !== input.razorpay_order_id) return fail(res, 'Razorpay order does not match this booking.', 400);
    if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      await supabaseAdmin.from('payments').update({ payment_status: 'VERIFICATION_FAILED', gateway_error: 'Invalid Razorpay signature' }).eq('booking_id', input.bookingId);
      return fail(res, 'Invalid payment signature.', 400);
    }

    const gatewayPayment = await getRazorpayPayment(input.razorpay_payment_id);
    if (gatewayPayment.order_id !== input.razorpay_order_id || gatewayPayment.amount !== Math.round(Number(payment.online_payment_amount) * 100) || gatewayPayment.status !== 'captured') {
      await supabaseAdmin.from('payments').update({ payment_status: 'VERIFICATION_FAILED', razorpay_status: gatewayPayment.status, gateway_error: 'Razorpay payment was not captured for the expected amount/order.' }).eq('booking_id', input.bookingId);
      return fail(res, 'Payment could not be verified as captured.', 400);
    }

    if (payment.payment_status === 'PAID' && payment.razorpay_payment_id === input.razorpay_payment_id) return ok(res, { success: true, alreadyProcessed: true, payment: paymentToFrontend(payment) });

    const { data: updated, error } = await supabaseAdmin.from('payments').update({ payment_status: 'PAID', razorpay_order_id: input.razorpay_order_id, razorpay_payment_id: input.razorpay_payment_id, razorpay_signature: input.razorpay_signature, razorpay_status: gatewayPayment.status, gateway_error: null }).eq('booking_id', input.bookingId).select('*').single();
    if (error) return fail(res, error.message, 500);
    await supabaseAdmin.from('bookings').update({ status: 'CONFIRMED' }).eq('id', input.bookingId);
    await supabaseAdmin.from('notifications').insert({ user_id: booking.equipment.owner_id, title: 'Booking Payment Received', message: `Online booking payment for ${booking.booking_code} has been verified.`, type: 'BOOKING', related_booking_id: booking.id, is_read: false });
    return ok(res, { success: true, payment: paymentToFrontend(updated) });
  } catch (e) { next(e); }
});

router.post('/webhook', async (req: any, res) => {
  try {
    const signature = String(req.headers['x-razorpay-signature'] ?? '');
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    if (!signature || !verifyWebhookSignature(rawBody, signature)) return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    const event = req.body ?? {};
    const paymentEntity = event?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;
    if (!orderId) return res.json({ success: true, ignored: true });

    const { data: payment } = await supabaseAdmin.from('payments').select('*').eq('razorpay_order_id', orderId).single();
    if (!payment) return res.json({ success: true, ignored: true });
    if (payment.payment_status === 'PAID' && payment.razorpay_payment_id === paymentId) return res.json({ success: true, alreadyProcessed: true });

    if (event.event === 'payment.captured') {
      if (Number(paymentEntity.amount) !== Math.round(Number(payment.online_payment_amount) * 100)) return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
      await supabaseAdmin.from('payments').update({ payment_status: 'PAID', razorpay_payment_id: paymentId, razorpay_status: 'captured', gateway_error: null }).eq('id', payment.id);
      await supabaseAdmin.from('bookings').update({ status: 'CONFIRMED' }).eq('id', payment.booking_id).eq('status', 'PAYMENT_PENDING');
    } else if (event.event === 'payment.failed') {
      await supabaseAdmin.from('payments').update({ payment_status: 'FAILED', razorpay_payment_id: paymentId, razorpay_status: 'failed', gateway_error: paymentEntity?.error_description ?? 'Razorpay payment failed' }).eq('id', payment.id);
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Razorpay webhook error:', e);
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
});

router.get('/my-payments', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('payments').select('*, booking:bookings(booking_code)').eq('farmer_id', req.user!.id).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { payments: (data ?? []).map(paymentToFrontend) });
  } catch (e) { next(e); }
});

router.get('/owner', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('payments').select('*, booking:bookings(booking_code)').eq('owner_id', req.user!.id).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { payments: (data ?? []).map(paymentToFrontend) });
  } catch (e) { next(e); }
});

router.get('/admin', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('payments').select('*, booking:bookings(booking_code)').order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { payments: (data ?? []).map(paymentToFrontend) });
  } catch (e) { next(e); }
});

router.get('/:bookingId', requireAuth, async (req: AuthRequest, res) => {
  const { data: payment, error } = await supabaseAdmin.from('payments').select('*, booking:bookings(booking_code,farmer_id,equipment:equipment(name))').eq('booking_id', req.params.bookingId).single();
  if (error || !payment) return fail(res, 'Payment not found.', 404);
  const allowed = req.user!.role === 'ADMIN' || payment.farmer_id === req.user!.id || payment.owner_id === req.user!.id;
  if (!allowed) return fail(res, 'Forbidden.', 403);
  return ok(res, { payment: paymentToFrontend(payment) });
});

async function ensureRentalCompletedMarker(booking: any, payment: any) {
  if (payment.rental_completed_at) return payment;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (String(booking.end_date) < today) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({ rental_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('booking_id', booking.id)
      .is('rental_completed_at', null)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data ?? payment;
  }
  return payment;
}

router.post('/:bookingId/remaining-payment/create-order', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { data: booking, error: bookingError } = await loadBookingForPayment(bookingId);
    if (bookingError || !booking) return fail(res, 'Booking not found.', 404);
    if (booking.farmer_id !== req.user!.id) return fail(res, 'Forbidden.', 403);

    const { data: payment, error: paymentError } = await supabaseAdmin.from('payments').select('*').eq('booking_id', bookingId).single();
    if (paymentError || !payment) return fail(res, 'Payment record not found.', 404);

    const markedPayment = await ensureRentalCompletedMarker(booking, payment);
    const remaining = Number(markedPayment.remaining_rental_amount ?? 0);
    if (remaining <= 0) return fail(res, 'No remaining rental amount is due.', 400);
    if (markedPayment.remaining_payment_status === 'PAID') return fail(res, 'Remaining rental payment is already paid.', 409);
    if (!markedPayment.rental_completed_at) return fail(res, 'Rental is not completed yet.', 409);

    const order = await createRazorpayOrder(remaining, `KM-REM-${booking.booking_code}`, {
      bookingId: booking.id,
      paymentType: 'REMAINING_RENTAL',
      farmerId: booking.farmer_id,
      ownerId: booking.equipment.owner_id
    });

    return ok(res, {
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: remaining,
      currency: 'INR',
      bookingId: booking.id,
      bookingCode: booking.booking_code
    });
  } catch (e) { next(e); }
});

router.post('/:bookingId/remaining-payment/verify', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const bookingId = String(req.params.bookingId);
    const input = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string()
    }).parse(req.body);

    const { data: booking, error: bookingError } = await loadBookingForPayment(bookingId);
    if (bookingError || !booking) return fail(res, 'Booking not found.', 404);
    if (booking.farmer_id !== req.user!.id) return fail(res, 'Forbidden.', 403);

    const { data: payment, error: paymentError } = await supabaseAdmin.from('payments').select('*').eq('booking_id', bookingId).single();
    if (paymentError || !payment) return fail(res, 'Payment record not found.', 404);
    const markedPayment = await ensureRentalCompletedMarker(booking, payment);
    const remaining = Number(markedPayment.remaining_rental_amount ?? 0);
    if (remaining <= 0) return fail(res, 'No remaining rental amount is due.', 400);
    if (markedPayment.remaining_payment_status === 'PAID') return ok(res, { success: true, alreadyPaid: true, payment: paymentToFrontend(markedPayment) });
    if (!markedPayment.rental_completed_at) return fail(res, 'Rental is not completed yet.', 409);

    if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      return fail(res, 'Invalid payment signature.', 400);
    }

    const gatewayPayment = await getRazorpayPayment(input.razorpay_payment_id);
    if (gatewayPayment.order_id !== input.razorpay_order_id || gatewayPayment.amount !== Math.round(remaining * 100) || gatewayPayment.status !== 'captured') {
      return fail(res, 'Online payment could not be verified as captured.', 400);
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        remaining_payment_status: 'PAID',
        remaining_payment_method: 'RAZORPAY',
        remaining_payment_note: 'Remaining rental paid online via Razorpay',
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId)
      .select('*')
      .single();
    if (updateError) return fail(res, updateError.message, 500);

    await supabaseAdmin.from('bookings').update({ status: 'COMPLETED' }).eq('id', bookingId).eq('status', 'ACTIVE');
    await supabaseAdmin.from('notifications').insert({
      user_id: booking.equipment.owner_id,
      title: 'Remaining Rental Payment Received',
      message: `Remaining rental payment for ${booking.booking_code} was paid online via Razorpay.`,
      type: 'BOOKING',
      related_booking_id: bookingId,
      is_read: false
    });

    return ok(res, { success: true, payment: paymentToFrontend(updated) });
  } catch (e) { next(e); }
});


router.post('/:bookingId/remaining-payment/request-cash', requireAuth, requireRole('FARMER'), async (req: AuthRequest, res, next) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { data: booking, error: bookingError } = await loadBookingForPayment(bookingId);
    if (bookingError || !booking) return fail(res, 'Booking not found.', 404);
    if (booking.farmer_id !== req.user!.id) return fail(res, 'Forbidden.', 403);

    const { data: payment, error: paymentError } = await supabaseAdmin.from('payments').select('*').eq('booking_id', bookingId).single();
    if (paymentError || !payment) return fail(res, 'Payment record not found.', 404);
    const markedPayment = await ensureRentalCompletedMarker(booking, payment);
    const remaining = Number(markedPayment.remaining_rental_amount ?? 0);
    if (remaining <= 0) return fail(res, 'No remaining rental amount is due.', 400);
    if (!markedPayment.rental_completed_at) return fail(res, 'Rental is not completed yet.', 409);
    if (markedPayment.remaining_payment_status === 'PAID') return fail(res, 'Remaining rental payment is already paid.', 409);

    const { data: updated, error: updateError } = await supabaseAdmin.from('payments').update({
      remaining_payment_method: 'CASH',
      remaining_payment_note: 'Farmer selected cash payment; waiting for owner confirmation.',
      owner_payment_confirmed_at: null,
      updated_at: new Date().toISOString()
    }).eq('booking_id', bookingId).eq('remaining_payment_status', 'PENDING').select('*').single();
    if (updateError) return fail(res, updateError.message, 500);

    await supabaseAdmin.from('notifications').insert({
      user_id: booking.equipment.owner_id,
      title: 'Cash Payment Requested',
      message: `Farmer requested cash payment for the remaining ₹${remaining.toLocaleString('en-IN')} on ${booking.booking_code}. Confirm after receiving the cash.`,
      type: 'PAYMENT', related_booking_id: bookingId, is_read: false
    });
    return ok(res, { payment: paymentToFrontend(updated) });
  } catch (e) { next(e); }
});

router.patch('/:bookingId/remaining-payment', requireAuth, requireRole('OWNER'), async (req: AuthRequest, res, next) => {
  try {
    const { method, note } = z.object({ method: z.enum(['CASH', 'UPI']), note: z.string().optional() }).parse(req.body);
    const { data: payment, error } = await supabaseAdmin.from('payments').select('*').eq('booking_id', req.params.bookingId).single();
    if (error || !payment) return fail(res, 'Payment not found.', 404);
    if (payment.owner_id !== req.user!.id) return fail(res, 'Forbidden.', 403);
    if (Number(payment.remaining_rental_amount) <= 0) return fail(res, 'No remaining rental amount is due.', 400);
    if (payment.remaining_payment_status === 'PAID') return fail(res, 'Remaining rental payment is already confirmed.', 409);
    const { data: booking, error: bookingError } = await supabaseAdmin.from('bookings').select('id,end_date,booking_code,farmer_id,equipment:equipment!bookings_equipment_id_fkey(owner_id,name)').eq('id', payment.booking_id).single();
    if (bookingError || !booking) return fail(res, 'Booking not found.', 404);
    const markedPayment = await ensureRentalCompletedMarker(booking, payment);
    if (!markedPayment.rental_completed_at) return fail(res, 'Rental is not completed yet.', 409);
    if (method === 'CASH' && payment.remaining_payment_method !== 'CASH') return fail(res, 'The farmer has not selected cash payment for this remaining amount.', 409);
    const { data: updated, error: updateError } = await supabaseAdmin.from('payments').update({ remaining_payment_status: 'PAID', remaining_payment_method: method, remaining_payment_note: note ?? (method === 'CASH' ? 'Cash received and confirmed by owner.' : 'Payment received and confirmed by owner.'), owner_payment_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('booking_id', req.params.bookingId).eq('remaining_payment_status', 'PENDING').select('*').single();
    if (updateError) return fail(res, updateError.message, 500);
    await supabaseAdmin.from('notifications').insert({ user_id: payment.farmer_id, title: 'Remaining Payment Confirmed', message: `The owner confirmed receipt of the remaining rental payment via ${method}.`, type: 'BOOKING', related_booking_id: payment.booking_id, is_read: false });
    return ok(res, { payment: paymentToFrontend(updated) });
  } catch (e) { next(e); }
});

export default router;
