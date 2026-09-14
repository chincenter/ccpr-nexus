"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDailyUpdate } from "../actions";
import type { Enums } from "@/lib/types/database";

const STATUSES: Enums<"mine_action_status">[] = ["open", "in_progress", "cleared", "monitoring", "closed"];

export function DailyUpdateForm({
  projectId,
  hazardId,
  surveys,
  responses,
}: {
  projectId: string;
  hazardId: string;
  surveys: { id: string; survey_type: string | null; survey_date: string }[];
  responses: { id: string; status: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Add daily update
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createDailyUpdate(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="hazard_id" value={hazardId} />
      <div>
        <label className="block text-xs font-medium text-slate-600">Date</label>
        <input name="update_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Set hazard status (optional)</label>
        <select name="status_snapshot" defaultValue="" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">No status change</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      {surveys.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Related survey (optional)</label>
          <select name="survey_id" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">None</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.survey_type ?? "Survey"} — {s.survey_date}</option>
            ))}
          </select>
        </div>
      )}
      {responses.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Related response (optional)</label>
          <select name="response_id" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">None</option>
            {responses.map((r) => (
              <option key={r.id} value={r.id}>Response — {r.status}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600">Progress % (optional)</label>
        <input name="progress" type="number" min={0} max={100} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">What happened today?</label>
        <textarea name="summary" required rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Next step</label>
        <input name="next_step" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Notes</label>
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save update"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
