import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateKrishiMitraResponse } from '../services/gemini.js';
import { calculateBookingPayment } from '../paymentCalculator.js';
import { equipmentToFrontend, bookingToFrontend } from '../utils/mappers.js';
import { ok, fail } from '../utils/http.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  conversation: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(1200) })).max(8).optional()
});

const blockingStatuses = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'];

function safePayment(p: any) {
  return {
    paymentStatus: p.payment_status,
    totalRentalAmount: Number(p.total_rental_amount ?? 0),
    bookingAmount: Number(p.booking_amount ?? 0),
    platformFee: Number(p.platform_fee ?? 0),
    onlinePaymentAmount: Number(p.online_payment_amount ?? 0),
    remainingRentalAmount: Number(p.remaining_rental_amount ?? 0),
    remainingPaymentStatus: p.remaining_payment_status,
    remainingPaymentMethod: p.remaining_payment_method
  };
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Number.isFinite(diff) ? diff : 0;
}

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, match => `\\${match}`);
}

function mapEquipmentRow(e: any) {
  const item = equipmentToFrontend(e) as any;
  return {
    id: item.id,
    name: item.name,
    category: item.categoryName,
    brand: item.brand,
    model: item.model,
    pricePerDay: item.pricePerDay,
    securityDeposit: item.securityDeposit,
    operatorAvailable: item.operatorAvailable,
    operatorCostPerDay: item.operatorCostPerDay,
    location: item.location,
    district: item.district,
    state: item.state,
    condition: item.condition,
    rating: item.rating
  };
}

async function searchEquipment(args: Record<string, unknown>) {
  const query = escapeIlike(String(args.query ?? '').trim());
  if (!query) return { items: [] };
  const maxResults = Math.min(5, Math.max(1, Number(args.maxResults ?? 5)));
  let q = supabaseAdmin
    .from('equipment')
    .select('*, owner:profiles!equipment_owner_id_fkey(id,full_name,is_verified), category:categories(id,name)')
    .eq('is_active', true)
    .eq('approval_status', 'APPROVED')
    .eq('availability_status', 'AVAILABLE')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,category_name.ilike.%${query}%,location.ilike.%${query}%,district.ilike.%${query}%`)
    .limit(maxResults);
  if (typeof args.state === 'string' && args.state.trim()) q = q.eq('state', args.state.trim());
  if (typeof args.district === 'string' && args.district.trim()) q = q.eq('district', args.district.trim());
  const { data, error } = await q;
  if (error) throw error;
  return { items: (data ?? []).map(mapEquipmentRow) };
}

async function listAvailableEquipment(args: Record<string, unknown>) {
  const maxResults = Math.min(10, Math.max(1, Number(args.maxResults ?? 8)));
  let q = supabaseAdmin
    .from('equipment')
    .select('*, owner:profiles!equipment_owner_id_fkey(id,full_name,is_verified), category:categories(id,name)')
    .eq('is_active', true)
    .eq('approval_status', 'APPROVED')
    .eq('availability_status', 'AVAILABLE')
    .order('created_at', { ascending: false })
    .limit(maxResults);
  if (typeof args.state === 'string' && args.state.trim()) q = q.eq('state', args.state.trim());
  if (typeof args.district === 'string' && args.district.trim()) q = q.eq('district', args.district.trim());
  const { data, error } = await q;
  if (error) throw error;
  return { items: (data ?? []).map(mapEquipmentRow) };
}

async function listAvailableLocations(args: Record<string, unknown>) {
  let q = supabaseAdmin
    .from('equipment')
    .select('state,district,location')
    .eq('is_active', true)
    .eq('approval_status', 'APPROVED')
    .eq('availability_status', 'AVAILABLE')
    .limit(500);
  if (typeof args.state === 'string' && args.state.trim()) q = q.eq('state', args.state.trim());
  const { data, error } = await q;
  if (error) throw error;

  const unique = new Set<string>();
  for (const row of data ?? []) {
    const parts = [row.location, row.district, row.state].filter(Boolean).map((v: any) => String(v).trim());
    if (parts.length) unique.add(parts.join(', '));
  }
  return { locations: Array.from(unique).slice(0, 50) };
}

async function calculateRental(args: Record<string, unknown>) {
  const equipmentId = String(args.equipmentId ?? '');
  const startDate = String(args.startDate ?? '');
  const endDate = String(args.endDate ?? '');
  if (!equipmentId || !startDate || !endDate) return { error: 'Equipment ID and both dates are required.' };
  const days = inclusiveDays(startDate, endDate);
  if (days <= 0) return { error: 'End date cannot be before start date.' };
  const { data, error } = await supabaseAdmin.from('equipment').select('id,name,daily_rate,booking_amount,security_deposit,operator_available,operator_cost_per_day').eq('id', equipmentId).single();
  if (error || !data) return { error: 'Equipment not found.' };
  const operatorIncluded = Boolean(args.operatorIncluded ?? false);
  const totalRentalAmount = Number(data.daily_rate) * days + (operatorIncluded ? Number(data.operator_cost_per_day ?? 0) * days : 0);
  const calc = calculateBookingPayment({ totalRentalAmount, bookingAmount: Number(data.booking_amount ?? 0) });
  return {
    equipmentId, equipmentName: data.name, durationDays: days, pricePerDay: Number(data.daily_rate),
    operatorIncluded, operatorAmount: operatorIncluded ? Number(data.operator_cost_per_day ?? 0) * days : 0,
    totalRentalAmount: calc.totalRentalAmount, bookingAmount: calc.bookingAmount,
    maximumBookingAmount: Math.floor(calc.totalRentalAmount * 0.2), platformFee: calc.platformFee,
    onlinePaymentAmount: calc.onlinePaymentAmount, remainingRentalAmount: calc.remainingRentalAmount,
    securityDeposit: Number(data.security_deposit ?? 0)
  };
}

async function checkAvailability(args: Record<string, unknown>) {
  const equipmentId = String(args.equipmentId ?? '');
  const startDate = String(args.startDate ?? '');
  const endDate = String(args.endDate ?? '');
  if (!equipmentId || !startDate || !endDate) return { error: 'Equipment ID and both dates are required.' };
  const { data: equipment } = await supabaseAdmin.from('equipment').select('id,name,is_active,approval_status,availability_status').eq('id', equipmentId).single();
  if (!equipment) return { error: 'Equipment not found.' };
  if (!equipment.is_active || equipment.approval_status !== 'APPROVED' || equipment.availability_status !== 'AVAILABLE') return { available: false, equipmentName: equipment.name, reason: 'Equipment is not currently listed as available.' };
  const { data, error } = await supabaseAdmin.from('bookings').select('start_date,end_date').eq('equipment_id', equipmentId).in('status', blockingStatuses);
  if (error) throw error;
  const conflict = (data ?? []).some((b: any) => startDate <= b.end_date && endDate >= b.start_date);
  return { available: !conflict, equipmentName: equipment.name, startDate, endDate };
}

async function getBookingStatus(user: AuthRequest['user'], args: Record<string, unknown>) {
  const bookingRef = String(args.bookingId ?? '').trim();
  if (!bookingRef) return { error: 'Booking ID or booking code is required.' };
  const { data: byId } = await supabaseAdmin.from('bookings').select('id').eq('id', bookingRef).maybeSingle();
  const { data: byCode } = byId ? { data: null } as any : await supabaseAdmin.from('bookings').select('id').eq('booking_code', bookingRef).maybeSingle();
  const id = byId?.id ?? byCode?.id;
  if (!id) return { error: 'Booking not found.' };
  const { data: b, error } = await supabaseAdmin.from('bookings').select('*, equipment:equipment(*, owner:profiles!equipment_owner_id_fkey(id,full_name,phone)), farmer:profiles!bookings_farmer_id_fkey(id,full_name)').eq('id', id).single();
  if (error || !b) return { error: 'Booking not found.' };
  const ownerId = b.equipment?.owner_id;
  if (user!.role !== 'ADMIN' && b.farmer_id !== user!.id && ownerId !== user!.id) return { error: 'You are not authorized to view this booking.' };
  const safe = bookingToFrontend(b) as any;
  return { bookingCode: safe.bookingCode, equipmentName: safe.equipmentName, startDate: safe.startDate, endDate: safe.endDate, durationDays: safe.durationDays, status: safe.status, totalAmount: safe.totalAmount, paymentStatus: safe.paymentStatus };
}

async function getPaymentStatus(user: AuthRequest['user'], args: Record<string, unknown>) {
  const bookingId = String(args.bookingId ?? '').trim();
  if (!bookingId) return { error: 'Booking ID is required.' };
  const { data: payment, error } = await supabaseAdmin.from('payments').select('*, booking:bookings(booking_code)').eq('booking_id', bookingId).single();
  if (error || !payment) return { error: 'Payment not found.' };
  if (user!.role !== 'ADMIN' && payment.farmer_id !== user!.id && payment.owner_id !== user!.id) return { error: 'You are not authorized to view this payment.' };
  const safe = safePayment(payment) as any;
  return { bookingCode: payment.booking?.booking_code, paymentStatus: safe.paymentStatus, totalRentalAmount: safe.totalRentalAmount, bookingAmount: safe.bookingAmount, platformFee: safe.platformFee, onlinePaymentAmount: safe.onlinePaymentAmount, remainingRentalAmount: safe.remainingRentalAmount, remainingPaymentStatus: safe.remainingPaymentStatus, remainingPaymentMethod: safe.remainingPaymentMethod };
}

router.post('/chat', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const input = chatSchema.parse(req.body);
    const message = input.message.trim();

    const reply = await generateKrishiMitraResponse({
      message,
      conversation: input.conversation,
      executeTool: async (name, args) => {
        switch (name) {
          case 'searchEquipment': return searchEquipment(args);
          case 'listAvailableEquipment': return listAvailableEquipment(args);
          case 'listAvailableLocations': return listAvailableLocations(args);
          case 'calculateRental': return calculateRental(args);
          case 'checkAvailability': return checkAvailability(args);
          case 'getBookingStatus': return getBookingStatus(req.user, args);
          case 'getPaymentStatus': return getPaymentStatus(req.user, args);
          default: return { error: 'Unknown tool.' };
        }
      }
    });

    return ok(res, { message: reply });
  } catch (error: any) {
    if (error?.name === 'ZodError') return fail(res, 'Please send a valid chat message.', 400);
    if (error?.message === 'GEMINI_NOT_CONFIGURED') return fail(res, 'KrishiMitra Assistant is not configured yet.', 503);
    if (error?.message === 'GEMINI_RATE_LIMITED') return fail(res, 'The assistant is busy right now because the Gemini free-tier limit was reached. Please wait a moment and try again.', 429);
    if (error?.message === 'GEMINI_TIMEOUT') return fail(res, 'The assistant took too long to respond. Please try again.', 504);
    if (error?.message === 'GEMINI_UNAVAILABLE') return fail(res, 'Gemini is temporarily unavailable. Please try again in a moment.', 503);
    if (error?.message === 'GEMINI_REQUEST_FAILED') return fail(res, 'KrishiMitra Assistant could not process that request. Please try again.', 503);
    next(error);
  }
});

export default router;
