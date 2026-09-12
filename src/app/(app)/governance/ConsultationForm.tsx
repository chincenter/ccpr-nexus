"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createConsultation } from "./actions";

export function ConsultationForm({
  projects,
  programmes,
  locations,
  stakeholders,
}: {
  projects: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  stakeholders: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"project" | "programme">("project");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Log consultation
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createConsultation(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input name="topic" placeholder="Topic" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-3" />
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
      <input name="consultation_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="location_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-3">
        <option value="">Unspecified location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Participating stakeholders</label>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-slate-300 p-2 sm:grid-cols-3">
          {stakeholders.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 text-xs text-slate-700">
              <input type="checkbox" name="stakeholder_ids" value={s.id} className="rounded border-slate-300" />
              {s.name}
            </label>
          ))}
          {stakeholders.length === 0 && <p className="text-xs text-slate-500">No stakeholders registered yet.</p>}
        </div>
      </div>

      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Summary</label>
        <textarea name="summary" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save consultation"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
