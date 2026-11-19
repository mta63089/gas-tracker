import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

// The publishable key is intentionally browser-visible. Access is enforced by
// Supabase Auth + database RLS. Never put a secret/service-role key here.
export const supabase = createClient(url, publishableKey);
