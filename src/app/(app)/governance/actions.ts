"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

function scopeFields(formData: FormData) {
  const projectId = str(formData, "project_id");
  const programmeId = str(formData, "programme_id");
  return { project_id: projectId, programme_id: projectId ? null : programmeId };
}

export async function createStakeholder(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("stakeholders").insert({
    ...scopeFields(formData),
    name: String(formData.get("name")),
    stakeholder_type: String(formData.get("stakeholder_type")),
    organization: str(formData, "organization"),
    location_id: str(formData, "location_id"),
    contact_info: str(formData, "contact_info"),
  });
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function archiveStakeholder(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stakeholders")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function createConsultation(formData: FormData) {
  const supabase = await createClient();
  const stakeholderIds = formData.getAll("stakeholder_ids") as string[];

  const { data: consultation, error } = await supabase
    .from("consultations")
    .insert({
      ...scopeFields(formData),
      location_id: str(formData, "location_id"),
      consultation_date: String(formData.get("consultation_date")),
      topic: String(formData.get("topic")),
      summary: str(formData, "summary"),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (stakeholderIds.length > 0) {
    const { error: linkError } = await supabase
      .from("consultation_stakeholders")
      .insert(stakeholderIds.map((stakeholder_id) => ({ consultation_id: consultation.id, stakeholder_id })));
    if (linkError) return { error: linkError.message };
  }

  revalidatePath("/governance");
  return { error: null };
}

export async function createRecommendation(consultationId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("recommendations").insert({
    consultation_id: consultationId,
    description: String(formData.get("description")),
    responsible_staff_id: str(formData, "responsible_staff_id"),
  });
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function updateRecommendationStatus(id: string, status: Enums<"case_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("recommendations").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function createDecision(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").insert({
    ...scopeFields(formData),
    recommendation_id: str(formData, "recommendation_id"),
    decision_text: String(formData.get("decision_text")),
    decision_date: String(formData.get("decision_date")),
    responsible_body: str(formData, "responsible_body"),
  });
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function updateDecisionStatus(id: string, status: Enums<"case_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function createGovernanceAction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("governance_actions").insert({
    ...scopeFields(formData),
    decision_id: str(formData, "decision_id"),
    action_description: String(formData.get("action_description")),
    responsible_staff_id: str(formData, "responsible_staff_id"),
    due_date: str(formData, "due_date"),
  });
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function updateGovernanceActionStatus(id: string, status: Enums<"task_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("governance_actions").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function addFollowUpNote(id: string, note: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("governance_actions").update({ follow_up_notes: note }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}

export async function archiveGovernanceAction(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("governance_actions")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/governance");
  return { error: null };
}
