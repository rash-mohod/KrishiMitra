import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { fail } from '../utils/http.js';

export type Role = 'FARMER' | 'OWNER' | 'ADMIN';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  state?: string;
  district?: string;
  village?: string;
  bio?: string;
  profile_image?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: Role;
    profile: UserProfile;
  };
}

/**
 * Validates the Supabase access token from Authorization: Bearer <token>.
 * The user's role and account status are strictly loaded from the trusted PostgreSQL `profiles` table.
 * Suspended users (`is_active = false`) are rejected with 403.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
      return fail(res, 'Authentication required.', 401);
    }

    // Verify cryptographic access token via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return fail(res, 'Invalid or expired access token.', 401);
    }

    // Always fetch authoritative profile from database to ensure fresh role and active state
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return fail(res, 'User profile not found.', 401);
    }

    if (!profile.is_active) {
      return fail(res, 'Your account has been suspended.', 403);
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role as Role,
      profile: profile as UserProfile
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Enforces role-based authorization.
 * Relies exclusively on req.user.role verified in requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return fail(res, 'Authentication required.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, 'You do not have permission for this action.', 403);
    }
    next();
  };
}
