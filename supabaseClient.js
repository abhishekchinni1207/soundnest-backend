import { createClient } from "@supabase/supabase-js";

/* ===============================
   🔐 ENV VALIDATION (SAFE)
================================ */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("❌ Missing Supabase environment variables");
}

/* ===============================
   🚀 SUPABASE CLIENT (SERVER)
================================ */
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
