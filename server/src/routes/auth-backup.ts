import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin, supabaseAuth } from '../config/supabase.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { ok, fail } from '../utils/http.js';
import { profileToUser } from '../utils/mappers.js';
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { ENV } from '../config/env.js';

const router = Router();

// Zod schemas with strict validation
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email address').transform(v => v.toLowerCase()),
  phone: z.string().trim().min(7, 'Phone number must be at least 7 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['FARMER', 'OWNER'], {
    message: 'Public registration is only allowed for FARMER or OWNER roles.'
  }),
  state: z.string().trim().min(2, 'State is required'),
  district: z.string().trim().min(2, 'District is required'),
  village: z.string().trim().optional(),
  bio: z.string().trim().optional()
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').transform(v => v.toLowerCase()),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').transform(v => v.toLowerCase())
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'New password must be at least 8 characters')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * POST /api/auth/register
 * Public registration exclusively for FARMER or OWNER roles.
 * Never allows ADMIN registration.
 * Normalizes email to lowercase, enforces password >= 8 characters.
 * Triggers Supabase email confirmation without starting an unconfirmed session.
 */
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    // Explicitly reject if request body attempts to pass ADMIN
    if ((req.body as any)?.role === 'ADMIN') {
      return fail(res, 'Admin accounts cannot be created from the public registration form.', 403);
    }

    const input = registerSchema.parse(req.body);

    // Call Supabase Auth signup with email confirmation redirect
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${ENV.FRONTEND_URL}/auth/callback`,
        data: {
          full_name: input.name,
          role: input.role
        }
      }
    });

    if (authError) {
      return fail(res, authError.message, 400);
    }

    if (!authData.user) {
      return fail(res, 'Registration failed. Please try again.', 400);
    }

    // Upsert trusted profile record linked to auth.users.id
    // Security guarantee: role is strictly input.role (FARMER or OWNER), is_verified is false, is_active is true.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        state: input.state,
        district: input.district,
        village: input.village ?? '',
        bio: input.bio ?? '',
        is_verified: false,
        is_active: true
      })
      .select()
      .single();

    if (profileError || !profile) {
      return fail(res, profileError?.message || 'Failed to initialize user profile.', 500);
    }

    // Determine if email confirmation is required (session is null or email_confirmed_at is null)
    const isConfirmed = !!authData.user.email_confirmed_at;
    const sessionData = isConfirmed && authData.session ? {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    } : null;

    return ok(res, {
      user: profileToUser(profile),
      requiresEmailConfirmation: !isConfirmed,
      session: sessionData,
      message: isConfirmed
        ? 'Account registered successfully.'
        : 'Registration successful! A verification link has been sent to your email. Please confirm your email before logging in.'
    }, 201);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/resend-confirmation
 * Resends the confirmation email with cooldown / rate limiting.
 * Returns a generic success response to avoid email enumeration.
 */
router.post('/resend-confirmation', passwordResetLimiter, async (req, res, next) => {
  try {
    const input = forgotPasswordSchema.parse(req.body);

    // Call Supabase resend for signup confirmation
    await supabaseAuth.auth.resend({
      type: 'signup',
      email: input.email,
      options: {
        emailRedirectTo: `${ENV.FRONTEND_URL}/auth/callback`
      }
    });

    return ok(res, {
      message: 'If an unconfirmed account exists with this email address, a verification link has been sent.'
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/login
 * Email + password authentication only.
 * Rejects suspended accounts and unconfirmed emails.
 * Uses generic security-conscious error messages.
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (error || !data.user || !data.session) {
      const errMessage = error?.message?.toLowerCase() ?? '';
      // Explicitly notify user if email is unconfirmed
      if (errMessage.includes('email not confirmed') || errMessage.includes('unconfirmed')) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_CONFIRMED',
          message: 'Your email address has not been confirmed yet. Please verify your email before logging in.'
        });
      }

      // Generic error to prevent enumeration of registered emails vs invalid passwords
      return fail(res, 'Invalid email or password.', 401);
    }

    // Authorize strictly against the database profile record
    const { data: profile, error: pe } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pe || !profile) {
      return fail(res, 'User profile not found.', 401);
    }

    if (!profile.is_active) {
      return fail(res, 'Your account has been suspended. Please contact platform support.', 403);
    }

    return ok(res, {
      user: profileToUser(profile),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/refresh
 * Refreshes an expired access token using a valid Supabase refresh token.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const { data, error } = await supabaseAuth.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session || !data.user) {
      return fail(res, 'Invalid or expired session. Please log in again.', 401);
    }

    const { data: profile, error: pe } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pe || !profile) {
      return fail(res, 'User profile not found.', 401);
    }

    if (!profile.is_active) {
      return fail(res, 'Your account has been suspended.', 403);
    }

    return ok(res, {
      user: profileToUser(profile),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/forgot-password
 * Dispatches a password recovery email via Supabase.
 * Returns a generic success response regardless of email existence.
 */
router.post('/forgot-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const input = forgotPasswordSchema.parse(req.body);

    await supabaseAuth.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${ENV.FRONTEND_URL}/reset-password`
    });

    return ok(res, {
      message: 'If an account exists with this email address, password reset instructions have been sent.'
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/reset-password
 * Resets user password after token verification.
 * Requires either a valid Bearer recovery token in headers or verified session.
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
      return fail(res, 'Password reset token or recovery session required.', 401);
    }

    const { password } = resetPasswordSchema.parse(req.body);

    // Verify token identity
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return fail(res, 'Invalid or expired password reset link.', 401);
    }

    // Update the user's password securely
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
      password
    });

    if (updateError) {
      return fail(res, updateError.message, 400);
    }

    return ok(res, {
      message: 'Your password has been successfully updated. You may now sign in with your new password.'
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/auth/me
 * Returns authenticated user profile derived from verified access token.
 */
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  return ok(res, { user: profileToUser(req.user!.profile) });
});

/**
 * POST /api/auth/logout
 * Terminates the authenticated user session.
 */
router.post('/logout', async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (token) {
      await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
    }
  } catch {}
  return ok(res, { message: 'Logged out successfully.' });
});

/**
 * PATCH /api/auth/profile
 * Allows updating non-privileged user profile fields only.
 * Client can never alter role, email, is_active, or is_verified.
 */
router.patch('/profile', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const allowed = z.object({
      name: z.string().trim().min(2).optional(),
      phone: z.string().trim().min(7).optional(),
      state: z.string().trim().optional(),
      district: z.string().trim().optional(),
      village: z.string().trim().optional(),
      bio: z.string().trim().optional(),
      avatarUrl: z.string().trim().optional()
    }).parse(req.body);

    const row: Record<string, any> = {};
    if (allowed.name !== undefined) row.full_name = allowed.name;
    if (allowed.phone !== undefined) row.phone = allowed.phone;
    if (allowed.state !== undefined) row.state = allowed.state;
    if (allowed.district !== undefined) row.district = allowed.district;
    if (allowed.village !== undefined) row.village = allowed.village;
    if (allowed.bio !== undefined) row.bio = allowed.bio;
    if (allowed.avatarUrl !== undefined) row.profile_image = allowed.avatarUrl;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(row)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) return fail(res, error.message, 400);
    return ok(res, { user: profileToUser(data) });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/auth/users
 * Administrative endpoint to list user profiles.
 */
router.get('/users', requireAuth, requireRole('ADMIN'), async (_req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return fail(res, error.message, 500);
    return ok(res, { users: (data ?? []).map(profileToUser) });
  } catch (e) {
    next(e);
  }
});

export default router;
