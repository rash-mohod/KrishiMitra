import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

export const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const supabaseAuth = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
