"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createProject(formData: FormData) {
  const programmeId = str(formData, "programme_id");
  if (!programmeId) return { error: "Select a programme for this project." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      programme_id: programmeId,
      code: String(formData.get("code")),
      name: String(formData.get("name")),
      donor: str(formData, "donor"),
      project_officer_id: str(formData, "project_officer_id"),
      description: str(formData, "description"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      status: String(formData.get("status")) as Enums<"lifecycle_status">,
      budget: str(formData, "budget") ? Number(formData.get("budget")) : null,
      target_beneficiaries: str(formData, "target_beneficiaries") ? Number(formData.get("target_beneficiaries")) : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/programmes/${programmeId}`);
  revalidatePath("/projects");
  return { error: null, id: data.id };
}
