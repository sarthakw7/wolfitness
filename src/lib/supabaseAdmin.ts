import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Note: This client has ADMIN privileges. Use only in secure server-side contexts (API routes, Webhooks).
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
