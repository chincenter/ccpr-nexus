"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStakeholder } from "./actions";

const TYPES = ["individual", "organization", "government", "cso", "community"];

export function StakeholderForm({
  projects,
  programmes,
  locations,
}: {
  projects: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"project" | "programme">("project");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Add stakeholder
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createStakeholder(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input name="name" placeholder="Stakeholder name" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-2" />
      <select name="stakeholder_type" defaultValue="organization" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <div>
        <label className="block text-xs font-medium text-slate-600">Scope</label>
        <select value={scope} onChange={(e) => setScope(e.target.value as "project" | "programme")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="project">Project</option>
          <option value="programme">Programme</option>
        </select>
      </div>
      {scope === "project" ? (
        <select name="project_id" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : (
        <select name="programme_id" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      <select name="location_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unspecified location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input name="organization" placeholder="Organization (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="contact_info" placeholder="Contact info (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save stakeholder"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
