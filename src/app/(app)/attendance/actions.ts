"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import type { Enums } from "@/lib/types/database";

export async function checkIn(workLocation: string) {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  if (!staff) return { error: "No staff profile linked." };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("attendance").upsert(
    {
      staff_id: staff.id,
      date: today,
      status: "present",
      check_in: new Date().toISOString(),
      work_location: workLocation || null,
    },
    { onConflict: "staff_id,date" },
  );

  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { error: null };
}

export async function checkOut() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  if (!staff) return { error: "No staff profile linked." };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("attendance")
    .update({ check_out: new Date().toISOString() })
    .eq("staff_id", staff.id)
    .eq("date", today);

  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { error: null };
}

export async function setTodayStatus(status: Enums<"attendance_status">, workLocation: string, remarks: string) {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  if (!staff) return { error: "No staff profile linked." };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("attendance").upsert(
    {
      staff_id: staff.id,
      date: today,
      status,
      work_location: workLocation || null,
      remarks: remarks || null,
    },
    { onConflict: "staff_id,date" },
  );

  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { error: null };
}
