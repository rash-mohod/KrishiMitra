import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ok, fail } from '../utils/http.js';

const router = Router();

const mapDispute = (d: any) => ({
  id: d.id,
  bookingId: d.booking_id,
  bookingCode: d.booking_code,
  raisedById: d.raised_by,
  raisedByName: d.raised_by_name,
  raisedByRole: d.raised_by_role,
  againstId: d.against_id,
  againstName: d.against_name,
  reason: d.reason,
  description: d.description,
  status: d.status,
  adminResponse: d.admin_response,
  createdAt: d.created_at,
  resolvedAt: d.resolved_at
});

/**
 * GET /api/disputes
 * Admin can view all disputes. Regular users can only view disputes they raised or are against.
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const isAdmin = req.user!.role === 'ADMIN';
  let q = supabaseAdmin.from('disputes').select('*').order('created_at', { ascending: false });
  if (!isAdmin) {
    q = q.or(`raised_by.eq.${req.user!.id},against_id.eq.${req.user!.id}`);
  }
  const { data, error } = await q;
  if (error) return fail(res, error.message, 500);
  return ok(res, { disputes: (data ?? []).map(mapDispute) });
});

/**
 * POST /api/disputes
 * Enforces ownership: only booking participants (farmer or equipment owner) can raise a dispute.
 */
router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      bookingId: z.string().min(1),
      reason: z.string().min(2),
      description: z.string().min(2)
    }).parse(req.body);

    const { data: b, error } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_code, farmer_id, equipment:equipment!bookings_equipment_id_fkey(owner_id, name)')
      .eq('id', input.bookingId)
      .single();

    if (error || !b) return fail(res, 'Booking not found.', 404);

    const equipment = Array.isArray(b.equipment) ? b.equipment[0] : b.equipment;
    if (!equipment) return fail(res, 'Booking equipment not found.', 404);

    const isFarmer = req.user!.id === b.farmer_id;
    const isOwner = req.user!.id === equipment.owner_id;

    // Prevent IDOR: reject anyone who is not farmer or owner of this booking
    if (!isFarmer && !isOwner && req.user!.role !== 'ADMIN') {
      return fail(res, 'You are not authorized to raise a dispute for this booking.', 403);
    }

    const againstId = isFarmer ? equipment.owner_id : b.farmer_id;
    const { data: against } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', againstId)
      .single();

    const { data, error: insertError } = await supabaseAdmin
      .from('disputes')
      .insert({
        booking_id: b.id,
        booking_code: b.booking_code,
        raised_by: req.user!.id,
        raised_by_name: req.user!.profile.full_name,
        raised_by_role: req.user!.role,
        against_id: againstId,
        against_name: against?.full_name ?? '',
        reason: input.reason,
        description: input.description,
        status: 'OPEN'
      })
      .select()
      .single();

    if (insertError) return fail(res, insertError.message, 400);
    return ok(res, { dispute: mapDispute(data) }, 201);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/disputes/:id/resolve
 * Admin only resolution.
 */
router.patch('/:id/resolve', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const response = z.object({
      resolutionNotes: z.string().min(1),
      status: z.enum(['RESOLVED', 'DISMISSED']).default('RESOLVED')
    }).parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status: response.status,
        admin_response: response.resolutionNotes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return fail(res, error.message, 400);
    return ok(res, { dispute: mapDispute(data) });
  } catch (e) {
    next(e);
  }
});

export default router;
