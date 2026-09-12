"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import {
  updateActivityProgress,
  archiveActivity,
  restoreActivity,
  updateTaskProgress,
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

type Activity = Tables<"activities"> & {
  responsible?: { full_name: string } | null;
  location?: { name: string } | null;
};
type Task = Tables<"tasks"> & { responsible?: { full_name: string } | null };

export function ActivityCard({
  activity,
  tasks,
  projectId,
  canEdit,
  isArchived,
}: {
  activity: Activity;
  tasks: Task[];
  projectId: string;
  canEdit: boolean;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(activity.status);
  const [actual, setActual] = useState(activity.actual ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const progress = safePercent(activity.actual, activity.target);

  function saveActivity() {
    setError(null);
    startTransition(async () => {
      const result = await updateActivityProgress(activity.id, projectId, { status, actual });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

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
          {canEdit && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Enums<"activity_status">)}
                  className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                >
                  {ACTIVITY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Actual {activity.target != null ? `(target ${activity.target})` : ""}
                </label>
                <input
                  type="number"
                  min={0}
                  value={actual}
                  onChange={(e) => setActual(Number(e.target.value))}
                  className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={saveActivity}
                disabled={isPending}
                className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
              >
                Save
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
          {error && <p className="text-sm text-red-600">{error}</p>}

          {activity.description && <p className="text-sm text-slate-600">{activity.description}</p>}

          {tasks.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tasks</p>
              <ul className="mt-2 space-y-2">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} projectId={projectId} canEdit={canEdit} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, projectId, canEdit }: { task: Task; projectId: string; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(task.progress);

  function save() {
    startTransition(async () => {
      await updateTaskProgress(task.id, projectId, { status, progress });
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
      <div>
        <p className="font-medium text-slate-800">{task.name}</p>
        <p className="text-xs text-slate-500">{task.responsible?.full_name ?? "Unassigned"}</p>
      </div>
      {canEdit ? (
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Enums<"task_status">)}
            className="rounded-md border border-slate-300 px-1.5 py-1 text-xs"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-16 rounded-md border border-slate-300 px-1.5 py-1 text-xs"
          />
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-white disabled:opacity-60"
          >
            Save
          </button>
        </div>
      ) : (
        <StatusBadge status={task.status} />
      )}
    </li>
  );
}
