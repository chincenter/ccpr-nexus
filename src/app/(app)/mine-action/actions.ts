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
  if (error.code === "23505") return "That reference code is already used.";
  if (error.code === "23514") return "One of the values is out of range (e.g. progress must be 0-100).";
  if (error.code === "42501") return "You do not have permission to make this change.";
  return error.message;
}

function revalidateMineAction(projectId?: string) {
  revalidatePath("/mine-action");
  if (projectId) {
    revalidatePath(`/mine-action/${projectId}`);
    revalidatePath(`/projects/${projectId}`);
  }
}

/** ~1.1km generalization — enough to identify the general area without
 * exposing the exact point, used only for the non-sensitive summary column
 * on mine_hazards itself (never the source of truth for field navigation). */
function generalize(value: number): number {
  return Math.round(value * 100) / 100;
}

async function hazardBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hazardId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("mine_hazards").select("project_id").eq("id", hazardId).maybeSingle();
  return data?.project_id === projectId;
}

async function surveyBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  surveyId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("mine_surveys").select("project_id").eq("id", surveyId).maybeSingle();
  return data?.project_id === projectId;
}

async function responseBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  responseId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("mine_responses").select("project_id").eq("id", responseId).maybeSingle();
  return data?.project_id === projectId;
}

async function activityBelongsToProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  activityId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase.from("activities").select("project_id").eq("id", activityId).maybeSingle();
  return data?.project_id === projectId;
}

// ---------------------------------------------------------------------
// Hazards
// ---------------------------------------------------------------------

export async function createHazard(formData: FormData) {
  const supabase = await createClient();
  const projectId = str(formData, "project_id");
  const programmeId = str(formData, "programme_id");
  const lat = num(formData, "lat");
  const lng = num(formData, "lng");

  const { data: hazard, error } = await supabase
    .from("mine_hazards")
    .insert({
      project_id: projectId,
      programme_id: projectId ? null : programmeId,
      location_id: str(formData, "location_id"),
      hazard_code: String(formData.get("hazard_code")),
      hazard_type: String(formData.get("hazard_type")) as Enums<"hazard_type">,
      risk_level: String(formData.get("risk_level")) as Enums<"risk_level">,
      verification_status: String(formData.get("verification_status")) as Enums<"verification_status">,
      date_identified: String(formData.get("date_identified")),
      source: str(formData, "source"),
      description: str(formData, "description"),
      // generalized_lat/lng are generated from coordinates_generalized — never set directly.
      coordinates_generalized: lat != null && lng != null ? `POINT(${generalize(lng)} ${generalize(lat)})` : null,
    })
    .select("id")
    .single();

  if (error) return { error: friendlyError(error) };

  if (lat != null && lng != null) {
    // precise_lat/precise_lng are generated from coordinates — never set directly.
    const { error: coordError } = await supabase
      .from("mine_hazard_coordinates")
      .insert({ hazard_id: hazard.id, coordinates: `POINT(${lng} ${lat})` });
    if (coordError) return { error: `Hazard saved, but coordinates failed: ${friendlyError(coordError)}` };
  }

  revalidateMineAction(projectId ?? undefined);
  return { error: null, id: hazard.id };
}

export async function updateHazard(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_hazards")
    .update({
      location_id: str(formData, "location_id"),
      hazard_type: String(formData.get("hazard_type")) as Enums<"hazard_type">,
      risk_level: String(formData.get("risk_level")) as Enums<"risk_level">,
      date_identified: String(formData.get("date_identified")),
      source: str(formData, "source"),
      description: str(formData, "description"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function updateHazardStatus(id: string, status: Enums<"mine_action_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_hazards").update({ status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function updateHazardVerification(id: string, status: Enums<"verification_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_hazards").update({ verification_status: status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function archiveHazard(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_hazards")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function setHazardCoordinates(hazardId: string, projectId: string | undefined, lat: number, lng: number) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("mine_hazard_coordinates").select("id").eq("hazard_id", hazardId).maybeSingle();
  const { error } = existing
    ? await supabase.from("mine_hazard_coordinates").update({ coordinates: `POINT(${lng} ${lat})` }).eq("hazard_id", hazardId)
    : await supabase.from("mine_hazard_coordinates").insert({ hazard_id: hazardId, coordinates: `POINT(${lng} ${lat})` });
  if (error) return { error: friendlyError(error) };
  await supabase.from("mine_hazards").update({ coordinates_generalized: `POINT(${generalize(lng)} ${generalize(lat)})` }).eq("id", hazardId);
  revalidateMineAction(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Surveys / Assessments
// ---------------------------------------------------------------------

export async function createMineSurvey(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id"));
  const hazardId = str(formData, "hazard_id");
  if (hazardId && !(await hazardBelongsToProject(supabase, hazardId, projectId))) {
    return { error: "That hazard does not belong to this project." };
  }
  const { error } = await supabase.from("mine_surveys").insert({
    project_id: projectId,
    hazard_id: hazardId,
    location_id: str(formData, "location_id"),
    survey_date: String(formData.get("survey_date")),
    survey_type: str(formData, "survey_type"),
    area_covered: str(formData, "area_covered"),
    findings: str(formData, "findings"),
  });
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateMineSurvey(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const hazardId = str(formData, "hazard_id");
  if (hazardId && !(await hazardBelongsToProject(supabase, hazardId, projectId))) {
    return { error: "That hazard does not belong to this project." };
  }
  const { error } = await supabase
    .from("mine_surveys")
    .update({
      hazard_id: hazardId,
      location_id: str(formData, "location_id"),
      survey_date: String(formData.get("survey_date")),
      survey_type: str(formData, "survey_type"),
      area_covered: str(formData, "area_covered"),
      findings: str(formData, "findings"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateSurveyStatus(id: string, status: Enums<"mine_action_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_surveys").update({ status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function updateSurveyVerification(id: string, status: Enums<"approval_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_surveys").update({ verification_status: status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function archiveMineSurvey(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_surveys")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Daily Updates — create + archive only. No content edit: the history is
// append-only by design (spec: "Do not overwrite historical daily updates").
// ---------------------------------------------------------------------

export async function createDailyUpdate(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id"));
  const hazardId = String(formData.get("hazard_id"));
  const surveyId = str(formData, "survey_id");
  const responseId = str(formData, "response_id");
  if (!(await hazardBelongsToProject(supabase, hazardId, projectId))) {
    return { error: "That hazard does not belong to this project." };
  }
  if (surveyId && !(await surveyBelongsToProject(supabase, surveyId, projectId))) {
    return { error: "That survey does not belong to this project." };
  }
  if (responseId && !(await responseBelongsToProject(supabase, responseId, projectId))) {
    return { error: "That response does not belong to this project." };
  }

  const statusSnapshot = str(formData, "status_snapshot") as Enums<"mine_action_status"> | null;
  const { error } = await supabase.from("mine_daily_updates").insert({
    project_id: projectId,
    hazard_id: hazardId,
    survey_id: surveyId,
    response_id: responseId,
    location_id: str(formData, "location_id"),
    update_date: String(formData.get("update_date")),
    status_snapshot: statusSnapshot,
    progress: num(formData, "progress"),
    summary: String(formData.get("summary")),
    next_step: str(formData, "next_step"),
    notes: str(formData, "notes"),
  });
  if (error) return { error: friendlyError(error) };

  // A daily update that records a new status is the update's whole point —
  // apply it to the hazard itself so the record stays in sync automatically.
  if (statusSnapshot) {
    await supabase.from("mine_hazards").update({ status: statusSnapshot }).eq("id", hazardId);
  }

  revalidateMineAction(projectId);
  return { error: null };
}

export async function archiveDailyUpdate(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_daily_updates")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Response / Clearance
// ---------------------------------------------------------------------

export async function createResponse(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id"));
  const hazardId = String(formData.get("hazard_id"));
  const activityId = str(formData, "activity_id");
  if (!(await hazardBelongsToProject(supabase, hazardId, projectId))) {
    return { error: "That hazard does not belong to this project." };
  }
  if (activityId && !(await activityBelongsToProject(supabase, activityId, projectId))) {
    return { error: "That activity does not belong to this project." };
  }
  const { error } = await supabase.from("mine_responses").insert({
    project_id: projectId,
    hazard_id: hazardId,
    activity_id: activityId,
    location_id: str(formData, "location_id"),
    responsible_staff_id: str(formData, "responsible_staff_id"),
    start_date: str(formData, "start_date"),
    target_completion_date: str(formData, "target_completion_date"),
    notes: str(formData, "notes"),
  });
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateResponse(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_responses")
    .update({
      location_id: str(formData, "location_id"),
      responsible_staff_id: str(formData, "responsible_staff_id"),
      start_date: str(formData, "start_date"),
      target_completion_date: str(formData, "target_completion_date"),
      result: str(formData, "result"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateResponseProgress(
  id: string,
  projectId: string,
  status: Enums<"response_status">,
  progress: number,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_responses").update({ status, progress }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function archiveResponse(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_responses")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Mine Risk Education (MRE)
// ---------------------------------------------------------------------

export async function createMreSession(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id"));
  const activityId = str(formData, "activity_id");
  if (activityId && !(await activityBelongsToProject(supabase, activityId, projectId))) {
    return { error: "That activity does not belong to this project." };
  }
  const { error } = await supabase.from("mre_sessions").insert({
    project_id: projectId,
    activity_id: activityId,
    location_id: str(formData, "location_id"),
    session_date: String(formData.get("session_date")),
    session_type: String(formData.get("session_type")),
    audience_description: str(formData, "audience_description"),
    participants_male: num(formData, "participants_male"),
    participants_female: num(formData, "participants_female"),
    topics: str(formData, "topics"),
  });
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateMreSession(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const activityId = str(formData, "activity_id");
  if (activityId && !(await activityBelongsToProject(supabase, activityId, projectId))) {
    return { error: "That activity does not belong to this project." };
  }
  const { error } = await supabase
    .from("mre_sessions")
    .update({
      activity_id: activityId,
      location_id: str(formData, "location_id"),
      session_date: String(formData.get("session_date")),
      session_type: String(formData.get("session_type")),
      audience_description: str(formData, "audience_description"),
      participants_male: num(formData, "participants_male"),
      participants_female: num(formData, "participants_female"),
      topics: str(formData, "topics"),
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function archiveMreSession(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mre_sessions")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

// ---------------------------------------------------------------------
// Victim Assistance / Referral
// ---------------------------------------------------------------------

export async function createVictimAssistance(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase.from("victim_assistance").insert({
    project_id: projectId,
    location_id: str(formData, "location_id"),
    incident_date: str(formData, "incident_date"),
    age_group: str(formData, "age_group") as Enums<"age_group"> | null,
    gender: str(formData, "gender"),
    injury_type: str(formData, "injury_type"),
    assistance_provided: str(formData, "assistance_provided"),
    referral_organization: str(formData, "referral_organization"),
    referral_status: String(formData.get("referral_status")) as Enums<"referral_status">,
  });
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateVictimAssistance(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("victim_assistance")
    .update({
      location_id: str(formData, "location_id"),
      incident_date: str(formData, "incident_date"),
      age_group: str(formData, "age_group") as Enums<"age_group"> | null,
      gender: str(formData, "gender"),
      injury_type: str(formData, "injury_type"),
      assistance_provided: str(formData, "assistance_provided"),
      referral_organization: str(formData, "referral_organization"),
      referral_status: String(formData.get("referral_status")) as Enums<"referral_status">,
    })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}

export async function updateVictimCaseStatus(id: string, status: Enums<"case_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("victim_assistance").update({ status }).eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction();
  return { error: null };
}

export async function archiveVictimAssistance(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("victim_assistance")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };
  revalidateMineAction(projectId);
  return { error: null };
}
