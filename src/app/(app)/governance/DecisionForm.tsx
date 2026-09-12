"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDecision } from "./actions";

export function DecisionForm({
  projects,
  programmes,
  recommendations,
}: {
  projects: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  recommendations: { id: string; description: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"project" | "programme">("project");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Record decision
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createDecision(formData);
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
        <label className="block text-xs font-medium text-slate-600">Decision</label>
        <textarea name="decision_text" required rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
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
      <input name="decision_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="recommendation_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">No linked recommendation</option>
        {recommendations.map((r) => (
          <option key={r.id} value={r.id}>{r.description}</option>
        ))}
      </select>
      <input name="responsible_body" placeholder="Responsible body" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save decision"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
