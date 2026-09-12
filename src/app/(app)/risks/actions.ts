"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

export async function createRisk(formData: FormData) {
  const supabase = await createClient();
  const projectId = formData.get("project_id") as string;
  const programmeId = formData.get("programme_id") as string;

  const { error } = await supabase.from("risks").insert({
    project_id: projectId || null,
    programme_id: projectId ? null : programmeId || null,
    title: String(formData.get("title")),
    category: String(formData.get("category")) as Enums<"risk_category">,
    description: (formData.get("description") as string) || null,
    likelihood: String(formData.get("likelihood")) as Enums<"risk_level">,
    impact: String(formData.get("impact")) as Enums<"risk_level">,
    mitigation: (formData.get("mitigation") as string) || null,
    responsible_staff_id: (formData.get("responsible_staff_id") as string) || null,
    due_date: (formData.get("due_date") as string) || null,
    review_date: (formData.get("review_date") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/risks");
  return { error: null };
}

export async function updateRiskStatus(id: string, status: Enums<"risk_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("risks").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/risks");
  return { error: null };
}

export async function archiveRisk(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("risks")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/risks");
  return { error: null };
}
