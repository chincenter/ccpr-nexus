"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

export async function createIndicator(formData: FormData) {
  const supabase = await createClient();
  const projectId = formData.get("project_id") as string;
  const programmeId = formData.get("programme_id") as string;

  const { error } = await supabase.from("indicators").insert({
    project_id: projectId || null,
    programme_id: projectId ? null : programmeId || null,
    name: String(formData.get("name")),
    unit: (formData.get("unit") as string) || null,
    baseline: formData.get("baseline") ? Number(formData.get("baseline")) : null,
    target: formData.get("target") ? Number(formData.get("target")) : null,
    actual: formData.get("actual") ? Number(formData.get("actual")) : null,
    reporting_period: (formData.get("reporting_period") as string) || null,
    data_source: (formData.get("data_source") as string) || null,
    responsible_staff_id: (formData.get("responsible_staff_id") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/me-meal");
  return { error: null };
}

export async function updateIndicatorActual(id: string, actual: number, status: Enums<"approval_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("indicators").update({ actual, verification_status: status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/me-meal");
  return { error: null };
}

export async function archiveIndicator(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("indicators")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/me-meal");
  return { error: null };
}
