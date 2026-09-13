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

function datesInOrder(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
}

function validProgress(progress: number | null): boolean {
  return progress == null || (progress >= 0 && progress <= 100);
}

// ---------------------------------------------------------------------
// Objectives
// ---------------------------------------------------------------------

export async function createObjective(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("objectives").insert({
    project_id: projectId,
    code: str(formData, "code"),
    name: String(formData.get("name")),
    description: str(formData, "description"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateObjective(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("objectives")
    .update({
      code: str(formData, "code"),
      name: String(formData.get("name")),
      description: str(formData, "description"),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function archiveObjective(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("objectives")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

// ---------------------------------------------------------------------
// Outcomes
// ---------------------------------------------------------------------

export async function createOutcome(objectiveId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("outcomes").insert({
    objective_id: objectiveId,
    code: str(formData, "code"),
    name: String(formData.get("name")),
    description: str(formData, "description"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateOutcome(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outcomes")
    .update({
      code: str(formData, "code"),
      name: String(formData.get("name")),
      description: str(formData, "description"),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function archiveOutcome(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outcomes")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

// ---------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------

export async function createOutput(outcomeId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("outputs").insert({
    outcome_id: outcomeId,
    code: str(formData, "code"),
    name: String(formData.get("name")),
    description: str(formData, "description"),
    target: num(formData, "target"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateOutput(id: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outputs")
    .update({
      code: str(formData, "code"),
      name: String(formData.get("name")),
      description: str(formData, "description"),
      target: num(formData, "target"),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function archiveOutput(id: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outputs")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

// ---------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------

export async function createActivity(projectId: string, outputId: string, formData: FormData) {
  if (!datesInOrder(str(formData, "start_date"), str(formData, "end_date"))) {
    return { error: "End date cannot be before the start date." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    project_id: projectId,
    output_id: outputId,
    name: String(formData.get("name")),
    description: str(formData, "description"),
    location_id: str(formData, "location_id"),
    responsible_staff_id: str(formData, "responsible_staff_id"),
    start_date: str(formData, "start_date"),
    end_date: str(formData, "end_date"),
    target: num(formData, "target"),
    budget: num(formData, "budget"),
    priority: String(formData.get("priority")) as Enums<"priority_level">,
    status: String(formData.get("status")) as Enums<"activity_status">,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { error: null };
}

export async function updateActivity(
  activityId: string,
  projectId: string,
  formData: FormData,
) {
  if (!datesInOrder(str(formData, "start_date"), str(formData, "end_date"))) {
    return { error: "End date cannot be before the start date." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({
      name: String(formData.get("name")),
      description: str(formData, "description"),
      location_id: str(formData, "location_id"),
      responsible_staff_id: str(formData, "responsible_staff_id"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      target: num(formData, "target"),
      actual: num(formData, "actual"),
      budget: num(formData, "budget"),
      priority: String(formData.get("priority")) as Enums<"priority_level">,
      status: String(formData.get("status")) as Enums<"activity_status">,
    })
    .eq("id", activityId);

  if (error) return { error: error.message };
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

// ---------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------

export async function createTask(activityId: string, projectId: string, formData: FormData) {
  if (!datesInOrder(str(formData, "start_date"), str(formData, "due_date"))) {
    return { error: "Due date cannot be before the start date." };
  }
  if (!validProgress(num(formData, "progress"))) {
    return { error: "Progress must be between 0 and 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    activity_id: activityId,
    name: String(formData.get("name")),
    description: str(formData, "description"),
    responsible_staff_id: str(formData, "responsible_staff_id"),
    start_date: str(formData, "start_date"),
    due_date: str(formData, "due_date"),
    status: String(formData.get("status")) as Enums<"task_status">,
    progress: num(formData, "progress") ?? 0,
    priority: String(formData.get("priority")) as Enums<"priority_level">,
    dependency_task_id: str(formData, "dependency_task_id"),
    notes: str(formData, "notes"),
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateTask(taskId: string, projectId: string, formData: FormData) {
  if (!datesInOrder(str(formData, "start_date"), str(formData, "due_date"))) {
    return { error: "Due date cannot be before the start date." };
  }
  if (!validProgress(num(formData, "progress"))) {
    return { error: "Progress must be between 0 and 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      name: String(formData.get("name")),
      description: str(formData, "description"),
      responsible_staff_id: str(formData, "responsible_staff_id"),
      start_date: str(formData, "start_date"),
      due_date: str(formData, "due_date"),
      status: String(formData.get("status")) as Enums<"task_status">,
      progress: num(formData, "progress") ?? 0,
      priority: String(formData.get("priority")) as Enums<"priority_level">,
      dependency_task_id: str(formData, "dependency_task_id"),
      notes: str(formData, "notes"),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateTaskProgress(
  taskId: string,
  projectId: string,
  data: { status: Enums<"task_status">; progress: number },
) {
  if (!validProgress(data.progress)) {
    return { error: "Progress must be between 0 and 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: data.status, progress: data.progress })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function archiveTask(taskId: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

// ---------------------------------------------------------------------
// Project Team
// ---------------------------------------------------------------------

export async function addTeamMember(projectId: string, formData: FormData) {
  const staffId = str(formData, "staff_id");
  const roleOnProject = str(formData, "role_on_project");
  if (!staffId) return { error: "Select a staff member." };
  if (!roleOnProject) return { error: "Enter this person's role on the project." };

  const supabase = await createClient();
  const { error } = await supabase.from("project_team").insert({
    project_id: projectId,
    staff_id: staffId,
    role_on_project: roleOnProject,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "This staff member is already on the project team." };
    }
    return { error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function removeTeamMember(projectId: string, staffId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_team")
    .delete()
    .eq("project_id", projectId)
    .eq("staff_id", staffId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

// ---------------------------------------------------------------------
// Project Locations
// ---------------------------------------------------------------------

export async function addProjectLocation(projectId: string, formData: FormData) {
  const locationId = str(formData, "location_id");
  if (!locationId) return { error: "Select a location." };

  const supabase = await createClient();
  const { error } = await supabase.from("project_locations").insert({
    project_id: projectId,
    location_id: locationId,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "This location is already linked to the project." };
    }
    return { error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/locations");
  return { error: null };
}

export async function removeProjectLocation(projectId: string, locationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_locations")
    .delete()
    .eq("project_id", projectId)
    .eq("location_id", locationId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/locations");
  return { error: null };
}
