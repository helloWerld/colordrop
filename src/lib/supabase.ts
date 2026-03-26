import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function createServerSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Add them to .env.local."
    );
  }
  if (supabaseUrl.includes("your-project")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL looks like a placeholder. Set your real Supabase URL in .env.local."
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
