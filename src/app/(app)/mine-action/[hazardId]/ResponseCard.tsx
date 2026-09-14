"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { createResponse, updateResponse, updateResponseProgress, archiveResponse } from "../actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"response_status">[] = ["planned", "in_progress", "completed", "verified", "closed", "cancelled"];

type Response = Tables<"mine_responses"> & { responsible?: { full_name: string } | null };

export function NewResponseForm({ projectId, hazardId, staff }: { projectId: string; hazardId: string; staff: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-teal-700 hover:underline">
        + Plan a response
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createResponse(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="hazard_id" value={hazardId} />
      <select name="responsible_staff_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </select>
      <input name="start_date" type="date" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="target_completion_date" type="date" placeholder="Target completion" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="notes" placeholder="Notes (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ResponseCard({ response, projectId, canEdit, canVerify }: { response: Response; projectId: string; canEdit: boolean; canVerify: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(response.status);
  const [progress, setProgress] = useState(response.progress);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(nextStatus: Enums<"response_status">, nextProgress: number) {
    startTransition(async () => {
      const result = await updateResponseProgress(response.id, projectId, nextStatus, nextProgress);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-3 ${response.archived_at ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={response.status} />
          <span className="text-sm text-slate-600">{response.progress}% progress</span>
        </div>
        <p className="text-xs text-slate-500">{response.responsible?.full_name ?? "Unassigned"}</p>
      </div>

      {canEdit && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"response_status">;
              setStatus(next);
              save(next, next === "completed" && progress === 0 ? 100 : progress);
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {STATUSES.filter((s) => s !== "verified" || canVerify || response.status === "verified").map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={100}
            value={progress}
            disabled={isPending}
            onChange={(e) => setProgress(Number(e.target.value))}
            onBlur={() => save(status, progress)}
            className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <span className="text-xs text-slate-400">% progress</span>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {response.target_completion_date && (
        <p className="mt-1 text-xs text-slate-500">Target completion: {response.target_completion_date}</p>
      )}
      {response.result && <p className="mt-1 text-xs text-slate-600">{response.result}</p>}
      {response.notes && <p className="mt-1 text-xs text-slate-400">{response.notes}</p>}

      {canEdit && (
        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-medium text-teal-700 hover:underline">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await archiveResponse(response.id, projectId, !response.archived_at); router.refresh(); })}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {response.archived_at ? "Restore" : "Archive"}
          </button>
        </div>
      )}

      {editing && (
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await updateResponse(response.id, projectId, formData);
              if (result.error) setError(result.error);
              else {
                setEditing(false);
                router.refresh();
              }
            });
          }}
          className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-2"
        >
          <input name="start_date" type="date" defaultValue={response.start_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <input name="target_completion_date" type="date" defaultValue={response.target_completion_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <input name="result" defaultValue={response.result ?? ""} placeholder="Result" className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" />
          <input name="notes" defaultValue={response.notes ?? ""} placeholder="Notes" className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" />
          <div className="sm:col-span-2">
            <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
              Save details
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
