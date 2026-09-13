"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createProgramme(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programmes")
    .insert({
      code: String(formData.get("code")),
      name: String(formData.get("name")),
      category: String(formData.get("category")) as Enums<"programme_category">,
      description: str(formData, "description"),
      lead_staff_id: str(formData, "lead_staff_id"),
      status: String(formData.get("status")) as Enums<"lifecycle_status">,
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/programmes");
  return { error: null, id: data.id };
}

export async function updateProgramme(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("programmes")
    .update({
      code: String(formData.get("code")),
      name: String(formData.get("name")),
      category: String(formData.get("category")) as Enums<"programme_category">,
      description: str(formData, "description"),
      lead_staff_id: str(formData, "lead_staff_id"),
      status: String(formData.get("status")) as Enums<"lifecycle_status">,
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${id}`);
  return { error: null };
}

export async function archiveProgramme(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("programmes")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${id}`);
  return { error: null };
}
