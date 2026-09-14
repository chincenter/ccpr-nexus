"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  return v == null ? null : Number(v);
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "That reference code is already used in this project.";
  if (error.code === "23514") return "Quantities and targets cannot be negative.";
  if (error.code === "42501") return "You do not have permission to make this change.";
  return error.message;
}

function revalidateHumanitarian(projectId: string) {
  revalidatePath(`/humanitarian/${projectId}`);
  revalidatePath("/humanitarian");
  revalidatePath(`/projects/${projectId}`);
}

/** Refuses an Activity from a different project being attached to this plan. */
async function activityBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  activityId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("activities").select("project_id").eq("id", activityId).maybeSingle();
  return data?.project_id === projectId;
}

/** Refuses an Assistance Plan from a different project being attached to this distribution. */
async function planBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("assistance_plans").select("project_id").eq("id", planId).maybeSingle();
  return data?.project_id === projectId;
}

/** Refuses a Household from a different project's distribution being recorded here. */
async function householdBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("households").select("project_id").eq("id", householdId).maybeSingle();
  return data?.project_id === projectId;
}

// ---------------------------------------------------------------------
// Needs Assessments
// ---------------------------------------------------------------------

export async function createNeedsAssessment(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("needs_assessments").insert({
    project_id: String(formData.get("project_id")),
    location_id: str(formData, "location_id"),
    assessment_date: String(formData.get("assessment_date")),
    assessment_type: String(formData.get("assessment_type")) as Enums<"assessment_type">,
    population_estimate: num(formData, "population_estimate"),
    priority: String(formData.get("priority")) as Enums<"priority_level">,
    needs: str(formData, "needs"),
    findings: str(formData, "findings"),
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function updateNeedsAssessment(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("needs_assessments")
    .update({
      location_id: str(formData, "location_id"),
      assessment_date: String(formData.get("assessment_date")),
      assessment_type: String(formData.get("assessment_type")) as Enums<"assessment_type">,
      population_estimate: num(formData, "population_estimate"),
      priority: String(formData.get("priority")) as Enums<"priority_level">,
      needs: str(formData, "needs"),
      findings: str(formData, "findings"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function updateAssessmentVerification(id: string, status: Enums<"approval_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("needs_assessments").update({ verification_status: status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function archiveNeedsAssessment(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("needs_assessments")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

// ---------------------------------------------------------------------
// Assistance Plans
// ---------------------------------------------------------------------

export async function createAssistancePlan(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id"));
  const activityId = str(formData, "activity_id");
  if (activityId && !(await activityBelongsToProject(supabase, activityId, projectId))) {
    return { error: "That activity does not belong to this project." };
  }
  const { error } = await supabase.from("assistance_plans").insert({
    project_id: projectId,
    activity_id: activityId,
    location_id: str(formData, "location_id"),
    name: String(formData.get("name")),
    assistance_type: String(formData.get("assistance_type")) as Enums<"assistance_type">,
    unit: str(formData, "unit"),
    planned_quantity: num(formData, "planned_quantity"),
    target_households: num(formData, "target_households"),
    target_beneficiaries: num(formData, "target_beneficiaries"),
    responsible_staff_id: str(formData, "responsible_staff_id"),
    target_criteria: str(formData, "target_criteria"),
    start_date: str(formData, "start_date"),
    end_date: str(formData, "end_date"),
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function updateAssistancePlan(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const activityId = str(formData, "activity_id");
  if (activityId && !(await activityBelongsToProject(supabase, activityId, projectId))) {
    return { error: "That activity does not belong to this project." };
  }
  const { error } = await supabase
    .from("assistance_plans")
    .update({
      activity_id: activityId,
      location_id: str(formData, "location_id"),
      name: String(formData.get("name")),
      assistance_type: String(formData.get("assistance_type")) as Enums<"assistance_type">,
      unit: str(formData, "unit"),
      planned_quantity: num(formData, "planned_quantity"),
      target_households: num(formData, "target_households"),
      target_beneficiaries: num(formData, "target_beneficiaries"),
      responsible_staff_id: str(formData, "responsible_staff_id"),
      target_criteria: str(formData, "target_criteria"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function updateAssistancePlanStatus(id: string, status: Enums<"assistance_plan_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("assistance_plans").update({ status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

export async function archiveAssistancePlan(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assistance_plans")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/humanitarian");
  return { error: null };
}

// ---------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------

export async function createHousehold(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("households").insert({
    project_id: projectId,
    location_id: str(formData, "location_id"),
    household_code: String(formData.get("household_code")),
    household_size: num(formData, "household_size"),
    vulnerability_notes: str(formData, "vulnerability_notes"),
  });
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function updateHousehold(projectId: string, id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({
      location_id: str(formData, "location_id"),
      household_code: String(formData.get("household_code")),
      household_size: num(formData, "household_size"),
      vulnerability_notes: str(formData, "vulnerability_notes"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function updateHouseholdStatus(
  projectId: string,
  id: string,
  status: Enums<"household_assistance_status">,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("households").update({ assistance_status: status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function archiveHousehold(projectId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Beneficiaries
// ---------------------------------------------------------------------

export async function createBeneficiary(projectId: string, householdId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("beneficiaries").insert({
    household_id: householdId,
    beneficiary_code: String(formData.get("beneficiary_code")),
    age_group: String(formData.get("age_group")) as Enums<"age_group">,
    gender: str(formData, "gender"),
    vulnerability_category: str(formData, "vulnerability_category"),
  });
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function updateBeneficiary(projectId: string, id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("beneficiaries")
    .update({
      beneficiary_code: String(formData.get("beneficiary_code")),
      age_group: String(formData.get("age_group")) as Enums<"age_group">,
      gender: str(formData, "gender"),
      vulnerability_category: str(formData, "vulnerability_category"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function archiveBeneficiary(projectId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("beneficiaries")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------

export async function createDistribution(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const planId = str(formData, "assistance_plan_id");
  if (planId && !(await planBelongsToProject(supabase, planId, projectId))) {
    return { error: "That assistance plan does not belong to this project." };
  }
  const { error } = await supabase.from("distributions").insert({
    project_id: projectId,
    assistance_plan_id: planId,
    location_id: str(formData, "location_id"),
    distribution_date: String(formData.get("distribution_date")),
    assistance_type: String(formData.get("assistance_type")) as Enums<"assistance_type">,
    unit: str(formData, "unit"),
    notes: str(formData, "notes"),
  });
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function updateDistribution(projectId: string, id: string, formData: FormData) {
  const supabase = await createClient();
  const planId = str(formData, "assistance_plan_id");
  if (planId && !(await planBelongsToProject(supabase, planId, projectId))) {
    return { error: "That assistance plan does not belong to this project." };
  }
  const { error } = await supabase
    .from("distributions")
    .update({
      assistance_plan_id: planId,
      location_id: str(formData, "location_id"),
      distribution_date: String(formData.get("distribution_date")),
      assistance_type: String(formData.get("assistance_type")) as Enums<"assistance_type">,
      unit: str(formData, "unit"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

/** Cancelled must never later become completed/verified without first being re-planned;
 * the RLS policy separately guarantees only management can set 'verified' (self-approval guard). */
export async function updateDistributionStatus(projectId: string, id: string, status: Enums<"distribution_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("distributions").update({ status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function archiveDistribution(projectId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("distributions")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Distribution Items
// ---------------------------------------------------------------------

export async function createDistributionItem(projectId: string, distributionId: string, formData: FormData) {
  const supabase = await createClient();
  const householdId = str(formData, "household_id");
  const beneficiaryId = str(formData, "beneficiary_id");
  if (householdId && !(await householdBelongsToProject(supabase, householdId, projectId))) {
    return { error: "That household does not belong to this project." };
  }
  const { error } = await supabase.from("distribution_items").insert({
    distribution_id: distributionId,
    household_id: householdId,
    beneficiary_id: beneficiaryId,
    quantity: Number(formData.get("quantity")),
  });
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function updateDistributionItem(projectId: string, id: string, quantity: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("distribution_items").update({ quantity }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}

export async function archiveDistributionItem(projectId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("distribution_items")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateHumanitarian(projectId);
  return { error: null };
}
