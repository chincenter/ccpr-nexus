"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database";

export async function updateActivityProgress(
  activityId: string,
  projectId: string,
  data: { status: Enums<"activity_status">; actual: number | null },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({ status: data.status, actual: data.actual })
    .eq("id", activityId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { error: null };
}

export async function archiveActivity(activityId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", activityId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { error: null };
}

export async function restoreActivity(activityId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({ archived_at: null })
    .eq("id", activityId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { error: null };
}

export async function updateTaskProgress(
  taskId: string,
  projectId: string,
  data: { status: Enums<"task_status">; progress: number },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: data.status, progress: data.progress })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
