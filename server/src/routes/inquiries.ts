import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ok, fail } from '../utils/http.js';

const router = Router();
const inquiryStatuses = ['NEW', 'REPLIED', 'RESOLVED'] as const;
const inquiryTopics = [
  'EQUIPMENT_AVAILABILITY',
  'BOOKING_ISSUE',
  'PAYMENT_ISSUE',
  'RENTAL_ISSUE',
  'ACCOUNT_ISSUE',
  'OTHER'
] as const;

const topicSchema = z.enum(inquiryTopics);
const statusSchema = z.enum(inquiryStatuses);

function mapInquiry(row: any) {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    topic: row.topic,
    message: row.message,
    status: row.status,
    adminReply: row.admin_reply ?? undefined,
    repliedBy: row.replied_by ?? undefined,
    repliedAt: row.replied_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.use(requireAuth);

router.post('/', requireRole('FARMER', 'OWNER'), async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      topic: topicSchema,
      message: z.string().trim().min(2).max(5000)
    }).parse(req.body);

    const profile = req.user!.profile;
    const { data, error } = await supabaseAdmin
      .from('support_inquiries')
      .insert({
        user_id: req.user!.id,
        user_name: profile.full_name,
        user_role: req.user!.role,
        topic: input.topic,
        message: input.message,
        status: 'NEW'
      })
      .select('*')
      .single();

    if (error) return fail(res, error.message, 400);

    // Notify administrators without creating a direct chat channel.
    const { data: admins } = await supabaseAdmin.from('profiles').select('id').eq('role', 'ADMIN').eq('is_active', true);
    if (admins?.length) {
      await supabaseAdmin.from('notifications').insert(
        admins.map((admin: any) => ({
          user_id: admin.id,
          title: 'New User Inquiry',
          message: `${profile.full_name} submitted a new support inquiry.`,
          type: 'SYSTEM',
          related_booking_id: null,
          is_read: false
        }))
      );
    }

    return ok(res, { inquiry: mapInquiry(data) }, 201);
  } catch (e) {
    next(e);
  }
});

router.get('/my', requireRole('FARMER', 'OWNER'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_inquiries')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { inquiries: (data ?? []).map(mapInquiry) });
  } catch (e) {
    next(e);
  }
});

router.get('/admin', requireRole('ADMIN'), async (_req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500);
    return ok(res, { inquiries: (data ?? []).map(mapInquiry) });
  } catch (e) {
    next(e);
  }
});

router.patch('/admin/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      reply: z.string().trim().min(1).max(5000).optional(),
      status: statusSchema.optional()
    }).refine(value => value.reply !== undefined || value.status !== undefined, {
      message: 'Reply or status is required.'
    }).parse(req.body);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('support_inquiries')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (existingError || !existing) return fail(res, 'Inquiry not found.', 404);

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (input.reply !== undefined) {
      update.admin_reply = input.reply;
      update.replied_by = req.user!.id;
      update.replied_at = new Date().toISOString();
      update.status = input.status ?? 'REPLIED';
    } else if (input.status) {
      update.status = input.status;
    }

    const { data, error } = await supabaseAdmin
      .from('support_inquiries')
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return fail(res, error.message, 400);

    if (input.reply !== undefined) {
      await supabaseAdmin.from('notifications').insert({
        user_id: existing.user_id,
        title: 'Support Inquiry Reply',
        message: 'An administrator replied to your support inquiry.',
        type: 'SYSTEM',
        related_booking_id: null,
        is_read: false
      });
    }

    return ok(res, { inquiry: mapInquiry(data) });
  } catch (e) {
    next(e);
  }
});

export default router;
