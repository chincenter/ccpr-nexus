"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDistribution } from "../actions";

const TYPES = ["food", "nfi", "cash", "shelter", "wash", "protection", "livelihood", "other"];

export function NewDistributionForm({
  projectId,
  locations,
  plans,
}: {
  projectId: string;
  locations: { id: string; name: string }[];
  plans: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Add distribution
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createDistribution(projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <select name="assistance_plan_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">No linked plan</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select name="location_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unspecified location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input name="distribution_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="assistance_type" defaultValue="food" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input name="unit" placeholder="Unit (e.g. bag, kit)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="notes" placeholder="Notes (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save distribution"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
