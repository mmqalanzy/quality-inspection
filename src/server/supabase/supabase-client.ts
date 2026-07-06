import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/server/env";

let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (clientInstance) return clientInstance;

  const env = getServerEnv();
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
  clientInstance = createClient(env.SUPABASE_URL ?? "", key, {
    auth: { persistSession: false }
  });

  return clientInstance;
}
