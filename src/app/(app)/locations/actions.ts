"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

export async function createLocation(formData: FormData) {
  const supabase = await createClient();
  const lat = formData.get("latitude");
  const lng = formData.get("longitude");

  const { error } = await supabase.from("locations").insert({
    name: String(formData.get("name")),
    location_type: String(formData.get("location_type")) as Enums<"location_type">,
    state_region: (formData.get("state_region") as string) || null,
    district: (formData.get("district") as string) || null,
    township: (formData.get("township") as string) || null,
    village: (formData.get("village") as string) || null,
    coordinates: lat && lng ? `POINT(${lng} ${lat})` : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/locations");
  return { error: null };
}

export async function archiveLocation(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/locations");
  return { error: null };
}
