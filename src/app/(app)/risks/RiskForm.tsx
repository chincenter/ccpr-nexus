"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRisk } from "./actions";

const CATEGORIES = ["operational", "financial", "security", "reputational", "programmatic", "compliance", "other"];
const LEVELS = ["low", "medium", "high"];

export function RiskForm({
  projects,
  programmes,
  staff,
}: {
  projects: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"project" | "programme">("project");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
      >
        + Add risk
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createRisk(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Risk title</label>
        <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Scope</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as "project" | "programme")}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="project">Project</option>
          <option value="programme">Programme</option>
        </select>
      </div>

      {scope === "project" ? (
        <div>
          <label className="block text-xs font-medium text-slate-600">Project</label>
          <select name="project_id" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-slate-600">Programme</label>
          <select name="programme_id" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600">Category</label>
        <select name="category" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Likelihood</label>
        <select name="likelihood" defaultValue="medium" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Impact</label>
        <select name="impact" defaultValue="medium" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Responsible</label>
        <select name="responsible_staff_id" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Review date</label>
        <input name="review_date" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Mitigation</label>
        <textarea name="mitigation" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save risk"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
