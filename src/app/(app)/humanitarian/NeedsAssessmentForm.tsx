"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNeedsAssessment } from "./actions";

const PRIORITIES = ["low", "medium", "high", "critical"];

export function NeedsAssessmentForm({
  projects,
  locations,
}: {
  projects: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
      >
        + Add needs assessment
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createNeedsAssessment(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600">Project</label>
        <select name="project_id" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Location</label>
        <select name="location_id" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Unspecified</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Assessment date</label>
        <input name="assessment_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Population estimate</label>
        <input name="population_estimate" type="number" min={0} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Priority</label>
        <select name="priority" defaultValue="medium" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Needs identified</label>
        <textarea name="needs" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Findings</label>
        <textarea name="findings" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save assessment"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
