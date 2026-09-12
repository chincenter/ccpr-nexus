"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHazard } from "./actions";

const TYPES = ["landmine", "uxo", "other_explosive", "unknown"];
const RISK_LEVELS = ["low", "medium", "high"];
const VERIFICATION = ["reported", "under_verification", "verified", "false_alarm", "cleared"];

export function HazardForm({
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
        + Report hazard
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createHazard(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input name="hazard_code" placeholder="Hazard code" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

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
      <select name="hazard_type" defaultValue="unknown" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select name="risk_level" defaultValue="medium" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {RISK_LEVELS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select name="verification_status" defaultValue="reported" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {VERIFICATION.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <input name="date_identified" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="source" placeholder="Source (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

      <div className="lg:col-span-3 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-2">
        <p className="col-span-full text-xs font-medium text-slate-500">
          Precise coordinates (optional). Only field staff with project access and admins can see the exact point later —
          everyone else sees a location generalized to roughly 1km.
        </p>
        <input name="lat" type="number" step="any" placeholder="Latitude" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="lng" type="number" step="any" placeholder="Longitude" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Description</label>
        <textarea name="description" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save hazard"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
