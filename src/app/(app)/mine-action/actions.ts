"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createHazard(formData: FormData) {
  const supabase = await createClient();
  const projectId = str(formData, "project_id");
  const programmeId = str(formData, "programme_id");
  const lat = str(formData, "lat");
  const lng = str(formData, "lng");

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
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (lat && lng) {
    const { error: coordError } = await supabase
      .from("mine_hazard_coordinates")
      .insert({ hazard_id: hazard.id, coordinates: `POINT(${lng} ${lat})` });
    // Coordinates are optional at creation time; surface the error but keep the hazard record.
    if (coordError) return { error: `Hazard saved, but coordinates failed: ${coordError.message}` };
  }

  revalidatePath("/mine-action");
  return { error: null };
}

export async function updateHazardStatus(id: string, status: Enums<"mine_action_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_hazards").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}

export async function archiveHazard(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mine_hazards")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}

export async function createMreSession(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("mre_sessions").insert({
    project_id: String(formData.get("project_id")),
    location_id: str(formData, "location_id"),
    session_date: String(formData.get("session_date")),
    session_type: String(formData.get("session_type")),
    audience_description: str(formData, "audience_description"),
    participants_male: str(formData, "participants_male") ? Number(formData.get("participants_male")) : null,
    participants_female: str(formData, "participants_female") ? Number(formData.get("participants_female")) : null,
    participants_total: str(formData, "participants_total") ? Number(formData.get("participants_total")) : null,
    topics: str(formData, "topics"),
  });
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}

export async function createMineSurvey(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_surveys").insert({
    project_id: String(formData.get("project_id")),
    location_id: str(formData, "location_id"),
    survey_date: String(formData.get("survey_date")),
    survey_type: str(formData, "survey_type"),
    area_covered: str(formData, "area_covered"),
    findings: str(formData, "findings"),
  });
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}

export async function updateSurveyStatus(id: string, status: Enums<"mine_action_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("mine_surveys").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}

export async function createVictimAssistance(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("victim_assistance").insert({
    project_id: String(formData.get("project_id")),
    location_id: str(formData, "location_id"),
    incident_date: str(formData, "incident_date"),
    age_group: str(formData, "age_group") as Enums<"age_group"> | null,
    gender: str(formData, "gender"),
    injury_type: str(formData, "injury_type"),
    assistance_provided: str(formData, "assistance_provided"),
    referral_organization: str(formData, "referral_organization"),
    referral_status: String(formData.get("referral_status")) as Enums<"referral_status">,
  });
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}

export async function updateVictimCaseStatus(id: string, status: Enums<"case_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("victim_assistance").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mine-action");
  return { error: null };
}
