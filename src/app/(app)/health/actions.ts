"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createFacility(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_facilities").insert({
    project_id: String(formData.get("project_id")),
    location_id: str(formData, "location_id"),
    name: String(formData.get("name")),
    facility_type: String(formData.get("facility_type")) as Enums<"facility_type">,
    contact_person: str(formData, "contact_person"),
    contact_phone: str(formData, "contact_phone"),
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  return { error: null };
}

export async function archiveFacility(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("health_facilities")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
  return { error: null };
}

export async function createService(facilityId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_services").insert({
    facility_id: facilityId,
    service_type: String(formData.get("service_type")),
    description: str(formData, "description"),
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  return { error: null };
}

export async function createOutreach(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_outreach").insert({
    project_id: String(formData.get("project_id")),
    facility_id: str(formData, "facility_id"),
    location_id: str(formData, "location_id"),
    outreach_date: String(formData.get("outreach_date")),
    activity_description: str(formData, "activity_description"),
    people_served: str(formData, "people_served") ? Number(formData.get("people_served")) : null,
    male_served: str(formData, "male_served") ? Number(formData.get("male_served")) : null,
    female_served: str(formData, "female_served") ? Number(formData.get("female_served")) : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  return { error: null };
}

export async function createReferral(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_referrals").insert({
    project_id: String(formData.get("project_id")),
    facility_id: str(formData, "facility_id"),
    referral_date: String(formData.get("referral_date")),
    reason: str(formData, "reason"),
    referred_to: str(formData, "referred_to"),
    age_group: str(formData, "age_group") as Enums<"age_group"> | null,
    gender: str(formData, "gender"),
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  return { error: null };
}

export async function updateReferralStatus(id: string, status: Enums<"case_status">) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_referrals").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
  return { error: null };
}
