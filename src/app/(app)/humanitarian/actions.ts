"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createNeedsAssessment(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("needs_assessments").insert({
    project_id: String(formData.get("project_id")),
    location_id: str(formData, "location_id"),
    assessment_date: String(formData.get("assessment_date")),
    population_estimate: str(formData, "population_estimate") ? Number(formData.get("population_estimate")) : null,
    priority: String(formData.get("priority")) as Enums<"priority_level">,
    needs: str(formData, "needs"),
    findings: str(formData, "findings"),
  });
  if (error) return { error: error.message };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function archiveNeedsAssessment(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("needs_assessments")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function createAssistancePlan(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("assistance_plans").insert({
    project_id: String(formData.get("project_id")),
    name: String(formData.get("name")),
    assistance_type: String(formData.get("assistance_type")) as Enums<"assistance_type">,
    unit: str(formData, "unit"),
    planned_quantity: str(formData, "planned_quantity") ? Number(formData.get("planned_quantity")) : null,
    target_criteria: str(formData, "target_criteria"),
    start_date: str(formData, "start_date"),
    end_date: str(formData, "end_date"),
  });
  if (error) return { error: error.message };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function updateAssistancePlanStatus(id: string, status: Enums<"assistance_plan_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("assistance_plans").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function archiveAssistancePlan(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assistance_plans")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function createHousehold(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("households").insert({
    project_id: projectId,
    location_id: str(formData, "location_id"),
    household_code: String(formData.get("household_code")),
    household_size: str(formData, "household_size") ? Number(formData.get("household_size")) : null,
    vulnerability_notes: str(formData, "vulnerability_notes"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}

export async function updateHouseholdStatus(
  projectId: string,
  id: string,
  status: Enums<"household_assistance_status">,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("households").update({ assistance_status: status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}

export async function archiveHousehold(projectId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}

export async function createBeneficiary(projectId: string, householdId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("beneficiaries").insert({
    household_id: householdId,
    beneficiary_code: String(formData.get("beneficiary_code")),
    age_group: String(formData.get("age_group")) as Enums<"age_group">,
    gender: str(formData, "gender"),
    vulnerability_category: str(formData, "vulnerability_category"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}

export async function createDistribution(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("distributions").insert({
    project_id: projectId,
    assistance_plan_id: str(formData, "assistance_plan_id"),
    location_id: str(formData, "location_id"),
    distribution_date: String(formData.get("distribution_date")),
    assistance_type: String(formData.get("assistance_type")) as Enums<"assistance_type">,
    unit: str(formData, "unit"),
    notes: str(formData, "notes"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}

export async function createDistributionItem(projectId: string, distributionId: string, formData: FormData) {
  const supabase = await createClient();
  const householdId = str(formData, "household_id");
  const beneficiaryId = str(formData, "beneficiary_id");
  const { error } = await supabase.from("distribution_items").insert({
    distribution_id: distributionId,
    household_id: householdId,
    beneficiary_id: beneficiaryId,
    quantity: Number(formData.get("quantity")),
  });
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}

export async function deleteDistributionItem(projectId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("distribution_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/humanitarian/${projectId}`);
  return { error: null };
}
