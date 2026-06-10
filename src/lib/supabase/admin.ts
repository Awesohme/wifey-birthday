import { createClient } from "@supabase/supabase-js";

export class MissingServiceRoleError extends Error {
  constructor() {
    super(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to the environment (use the service_role key, not the anon key) and restart."
    );
    this.name = "MissingServiceRoleError";
  }
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new MissingServiceRoleError();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
