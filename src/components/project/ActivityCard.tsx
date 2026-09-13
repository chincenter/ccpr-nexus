"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import {
  updateActivity,
  archiveActivity,
  restoreActivity,
  createTask,
  updateTask,
  archiveTask,
} from "@/app/(app)/projects/[id]/actions";
import type { Enums, Tables } from "@/lib/types/database";

const ACTIVITY_STATUSES: Enums<"activity_status">[] = [
  "not_started",
  "ongoing",
  "completed",
  "delayed",
  "cancelled",
];

const TASK_STATUSES: Enums<"task_status">[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
];

const PRIORITIES: Enums<"priority_level">[] = ["low", "medium", "high", "critical"];

type Activity = Tables<"activities"> & {
  responsible?: { full_name: string } | null;
  location?: { name: string } | null;
};
type Task = Tables<"tasks"> & { responsible?: { full_name: string } | null };
type TaskDocument = Tables<"documents"> & { uploader?: { full_name: string } | null };

export function ActivityCard({
  activity,
  tasks,
  documentsByTask,
  projectId,
  staff,
  locations,
  canEdit,
  isArchived,
  defaultExpanded = false,
}: {
  activity: Activity;
  tasks: Task[];
  documentsByTask: Map<string, TaskDocument[]>;
  projectId: string;
  staff: { id: string; full_name: string }[];
  locations: { id: string; name: string }[];
  canEdit: boolean;
  isArchived: boolean;
  defaultExpanded?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = safePercent(activity.actual, activity.target);

  function toggleArchive() {
    startTransition(async () => {
      const result = isArchived
        ? await restoreActivity(activity.id, projectId)
        : await archiveActivity(activity.id, projectId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-left font-medium text-slate-900 hover:underline"
          >
            {activity.name}
          </button>
          <p className="text-xs text-slate-500">
            Responsible: {activity.responsible?.full_name ?? "Unassigned"}
            {activity.location?.name ? ` · ${activity.location.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>{progress != null ? `${progress}%` : "—"}</span>
          <StatusBadge status={activity.status} />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {canEdit && !editing && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Activity
              </button>
              <button
                type="button"
                onClick={toggleArchive}
                disabled={isPending}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {isArchived ? "Restore" : "Archive"}
              </button>
            </div>
          )}

          {canEdit && editing ? (
            <form
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  const result = await updateActivity(activity.id, projectId, formData);
                  if (result.error) setError(result.error);
                  else {
                    setEditing(false);
                    router.refresh();
                  }
                });
              }}
              className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3"
            >
              <input name="name" defaultValue={activity.name} required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3" />
              <select name="responsible_staff_id" defaultValue={activity.responsible_staff_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
              <select name="location_id" defaultValue={activity.location_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="">No location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select name="priority" defaultValue={activity.priority} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input name="start_date" type="date" defaultValue={activity.start_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              <input name="end_date" type="date" defaultValue={activity.end_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              <select name="status" defaultValue={activity.status} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                {ACTIVITY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                ))}
              </select>
              <div>
                <label className="block text-xs font-medium text-slate-600">Target</label>
                <input name="target" type="number" min={0} step="any" defaultValue={activity.target ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Actual</label>
                <input name="actual" type="number" min={0} step="any" defaultValue={activity.actual ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Budget</label>
                <input name="budget" type="number" min={0} step="0.01" defaultValue={activity.budget ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <textarea name="description" defaultValue={activity.description ?? ""} rows={2} placeholder="Description" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3" />

              {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

              <div className="col-span-full flex gap-2">
                <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            error && <p className="text-sm text-red-600">{error}</p>
          )}

          {!editing && activity.description && <p className="text-sm text-slate-600">{activity.description}</p>}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tasks</p>
            {tasks.length > 0 && (
              <ul className="mt-2 space-y-2">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    documents={documentsByTask.get(task.id) ?? []}
                    projectId={projectId}
                    staff={staff}
                    canEdit={canEdit}
                  />
                ))}
              </ul>
            )}
            {tasks.length === 0 && <p className="mt-1 text-sm text-slate-400">No tasks recorded for this activity yet.</p>}

            {canEdit && (
              <div className="mt-2">
                {!addingTask ? (
                  <button type="button" onClick={() => setAddingTask(true)} className="text-xs font-medium text-teal-700 hover:underline">
                    + Add Task
                  </button>
                ) : (
                  <NewTaskForm
                    activityId={activity.id}
                    projectId={projectId}
                    staff={staff}
                    tasks={tasks}
                    onDone={() => setAddingTask(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewTaskForm({
  activityId,
  projectId,
  staff,
  tasks,
  onDone,
}: {
  activityId: string;
  projectId: string;
  staff: { id: string; full_name: string }[];
  tasks: Task[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createTask(activityId, projectId, formData);
          if (result.error) setError(result.error);
          else {
            onDone();
            router.refresh();
          }
        });
      }}
      className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-3"
    >
      <input name="name" placeholder="Task name" required className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-3" />
      <select name="responsible_staff_id" className="rounded-md border border-slate-300 px-2 py-1 text-sm">
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </select>
      <input name="start_date" type="date" placeholder="Start date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
      <input name="due_date" type="date" placeholder="Due date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
      <select name="status" defaultValue="not_started" className="rounded-md border border-slate-300 px-2 py-1 text-sm">
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
        ))}
      </select>
      <select name="priority" defaultValue="medium" className="rounded-md border border-slate-300 px-2 py-1 text-sm">
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select name="dependency_task_id" className="rounded-md border border-slate-300 px-2 py-1 text-sm">
        <option value="">No dependency</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <textarea name="description" placeholder="Description (optional)" rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-3" />
      <textarea name="notes" placeholder="Notes (optional)" rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-3" />

      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          Save task
        </button>
        <button type="button" onClick={onDone} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

function TaskRow({
  task,
  documents,
  projectId,
  staff,
  canEdit,
}: {
  task: Task;
  documents: TaskDocument[];
  projectId: string;
  staff: { id: string; full_name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <li className="rounded-md bg-slate-50 px-3 py-2 text-sm">
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await updateTask(task.id, projectId, formData);
              if (result.error) setError(result.error);
              else {
                setEditing(false);
                router.refresh();
              }
            });
          }}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <input name="name" defaultValue={task.name} required className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-3" />
          <select name="responsible_staff_id" defaultValue={task.responsible_staff_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <input name="start_date" type="date" defaultValue={task.start_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <input name="due_date" type="date" defaultValue={task.due_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <select name="status" defaultValue={task.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="priority" defaultValue={task.priority} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div>
            <label className="block text-xs font-medium text-slate-600">Progress %</label>
            <input name="progress" type="number" min={0} max={100} defaultValue={task.progress} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" />
          </div>
          <textarea name="description" defaultValue={task.description ?? ""} placeholder="Description" rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-3" />
          <textarea name="notes" defaultValue={task.notes ?? ""} placeholder="Notes" rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-3" />

          {error && <p className="col-span-full text-xs text-red-600">{error}</p>}

          <div className="col-span-full flex gap-2">
            <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-md bg-slate-50 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800">{task.name}</p>
          <p className="text-xs text-slate-500">
            {task.responsible?.full_name ?? "Unassigned"}
            {task.due_date ? ` · due ${task.due_date}` : ""} · {task.progress}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {canEdit && (
            <>
              <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
                Edit
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await archiveTask(task.id, projectId, !task.archived_at);
                    if (result.error) setError(result.error);
                    else router.refresh();
                  })
                }
                className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
              >
                {task.archived_at ? "Restore" : "Archive"}
              </button>
            </>
          )}
          <button type="button" onClick={() => setShowEvidence((v) => !v)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
            Evidence ({documents.length})
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {showEvidence && (
        <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
          {canEdit && <DocumentUploader entityType="task" entityId={task.id} />}
          <DocumentList documents={documents} canEdit={canEdit} />
        </div>
      )}
    </li>
  );
}
