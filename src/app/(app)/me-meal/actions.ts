"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
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
  if (error.code === "23505") return "An indicator with this code already exists in this scope.";
  if (error.code === "23514") return "Baseline, target, and actual values cannot be negative.";
  if (error.code === "42501") return error.message;
  return error.message;
}

async function resultBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resultType: string | null,
  resultId: string | null,
  projectId: string | null,
): Promise<boolean> {
  if (!resultType || !resultId) return true;
  if (!projectId) return false;

  if (resultType === "objective") {
    const { data } = await supabase.from("objectives").select("project_id").eq("id", resultId).maybeSingle();
    return data?.project_id === projectId;
  }
  if (resultType === "outcome") {
    const { data } = await supabase
      .from("outcomes")
      .select("objective:objectives(project_id)")
      .eq("id", resultId)
      .maybeSingle();
    return (data?.objective as { project_id: string } | null)?.project_id === projectId;
  }
  if (resultType === "output") {
    const { data } = await supabase
      .from("outputs")
      .select("outcome:outcomes(objective:objectives(project_id))")
      .eq("id", resultId)
      .maybeSingle();
    const outcome = data?.outcome as { objective: { project_id: string } | null } | null;
    return outcome?.objective?.project_id === projectId;
  }
  return false;
}

export async function createIndicator(formData: FormData) {
  const supabase = await createClient();
  const projectId = str(formData, "project_id");
  const programmeId = projectId ? null : str(formData, "programme_id");
  const resultType = str(formData, "result_type") as Enums<"indicator_result_type"> | null;
  const resultId = str(formData, "result_id");
  const name = str(formData, "name");

  if (!name) return { error: "Indicator name is required." };
  if (!projectId && !programmeId) return { error: "Select a project or programme for this indicator." };

  if (!(await resultBelongsToProject(supabase, resultType, resultId, projectId))) {
    return { error: "That objective/outcome/output does not belong to the selected project." };
  }

  const { error } = await supabase.from("indicators").insert({
    project_id: projectId,
    programme_id: programmeId,
    result_type: resultType,
    result_id: resultId,
    name,
    code: str(formData, "code"),
    definition: str(formData, "definition"),
    unit: str(formData, "unit"),
    baseline: num(formData, "baseline"),
    target: num(formData, "target"),
    actual: num(formData, "actual"),
    reporting_period: str(formData, "reporting_period"),
    data_source: str(formData, "data_source"),
    responsible_staff_id: str(formData, "responsible_staff_id"),
    notes: str(formData, "notes"),
  });

  if (error) return { error: friendlyError(error) };
  revalidatePath("/me-meal");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateIndicator(id: string, formData: FormData) {
  const supabase = await createClient();
  const projectId = str(formData, "project_id");
  const programmeId = projectId ? null : str(formData, "programme_id");
  const resultType = str(formData, "result_type") as Enums<"indicator_result_type"> | null;
  const resultId = str(formData, "result_id");
  const name = str(formData, "name");

  if (!name) return { error: "Indicator name is required." };
  if (!projectId && !programmeId) return { error: "Select a project or programme for this indicator." };

  if (!(await resultBelongsToProject(supabase, resultType, resultId, projectId))) {
    return { error: "That objective/outcome/output does not belong to the selected project." };
  }

  const { error } = await supabase
    .from("indicators")
    .update({
      project_id: projectId,
      programme_id: programmeId,
      result_type: resultType,
      result_id: resultId,
      name,
      code: str(formData, "code"),
      definition: str(formData, "definition"),
      unit: str(formData, "unit"),
      baseline: num(formData, "baseline"),
      target: num(formData, "target"),
      reporting_period: str(formData, "reporting_period"),
      data_source: str(formData, "data_source"),
      responsible_staff_id: str(formData, "responsible_staff_id"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);

  if (error) return { error: friendlyError(error) };
  revalidatePath("/me-meal");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function archiveIndicator(id: string, archived: boolean, projectId?: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("indicators")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/me-meal");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function recordMeasurement(indicatorId: string, projectId: string | null, formData: FormData) {
  const reportingPeriod = str(formData, "reporting_period");
  const actual = num(formData, "actual");

  if (!reportingPeriod) return { error: "Reporting period is required." };
  if (actual == null) return { error: "Actual value is required." };
  if (actual < 0) return { error: "Actual value cannot be negative." };

  const staff = await getCurrentStaff();
  const supabase = await createClient();

  const { error: measurementError } = await supabase.from("indicator_measurements").insert({
    indicator_id: indicatorId,
    reporting_period: reportingPeriod,
    actual,
    source: str(formData, "source"),
    notes: str(formData, "notes"),
    entered_by: staff?.id ?? null,
  });
  if (measurementError) return { error: friendlyError(measurementError) };

  const { error: snapshotError } = await supabase
    .from("indicators")
    .update({ actual, reporting_period: reportingPeriod })
    .eq("id", indicatorId);
  if (snapshotError) return { error: friendlyError(snapshotError) };

  revalidatePath("/me-meal");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateVerificationStatus(
  indicatorId: string,
  projectId: string | null,
  status: Enums<"approval_status">,
  comment?: string,
) {
  const supabase = await createClient();
  const update: { verification_status: Enums<"approval_status">; notes?: string } = { verification_status: status };

  if (comment) {
    const { data: current } = await supabase.from("indicators").select("notes").eq("id", indicatorId).maybeSingle();
    const stamp = `[${status}] ${comment}`;
    update.notes = current?.notes ? `${current.notes}\n${stamp}` : stamp;
  }

  const { error } = await supabase.from("indicators").update(update).eq("id", indicatorId);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/me-meal");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
