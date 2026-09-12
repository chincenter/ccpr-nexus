"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHousehold } from "../actions";

export function NewHouseholdForm({ projectId, locations }: { projectId: string; locations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Add household
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createHousehold(projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input name="household_code" placeholder="Household code" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="location_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unspecified location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input name="household_size" type="number" min={1} placeholder="Household size" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="vulnerability_notes" placeholder="Vulnerability notes (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save household"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
