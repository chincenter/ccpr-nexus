"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

export async function createStaff(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff").insert({
    full_name: String(formData.get("full_name")),
    email: String(formData.get("email")).toLowerCase(),
    job_title: (formData.get("job_title") as string) || null,
    system_role: String(formData.get("system_role")) as Enums<"system_role">,
  });

  if (error) return { error: error.message };
  revalidatePath("/users");
  return { error: null };
}

export async function updateStaffRole(staffId: string, role: Enums<"system_role">) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update({ system_role: role }).eq("id", staffId);
  if (error) return { error: error.message };
  revalidatePath("/users");
  return { error: null };
}

export async function toggleStaffActive(staffId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update({ is_active: isActive }).eq("id", staffId);
  if (error) return { error: error.message };
  revalidatePath("/users");
  return { error: null };
}
