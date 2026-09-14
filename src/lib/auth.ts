import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type CurrentStaff = Tables<"staff">;

// React's cache() memoizes per request (per render pass of the RSC tree) and is
// scoped to the current server request only — it never persists across requests
// or users, so this does not introduce cross-user leakage or stale global state.
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
});

export const MANAGEMENT_ROLES = ["super_admin", "executive"] as const;
export const OPERATIONAL_ROLES = [
  "super_admin",
  "executive",
  "programme_manager",
  "project_officer",
] as const;

export function isManagement(role: string | undefined): boolean {
  return !!role && (MANAGEMENT_ROLES as readonly string[]).includes(role);
}
