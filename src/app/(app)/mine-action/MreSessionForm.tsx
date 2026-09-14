"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMreSession } from "./actions";

export function MreSessionForm({
  projects,
  locations,
  activities,
}: {
  projects: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  activities: { id: string; name: string; project_id: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Log MRE / awareness session
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createMreSession(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <select
        name="project_id"
        required
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select name="activity_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Not linked to a specific activity</option>
        {activities.filter((a) => a.project_id === projectId).map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select name="location_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unspecified location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input name="session_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="session_type" defaultValue="mre" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="mre">Mine Risk Education</option>
        <option value="community_awareness">Community Awareness</option>
      </select>
      <input name="audience_description" placeholder="Audience" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-2" />
      <input name="participants_male" type="number" min={0} placeholder="Male participants" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="participants_female" type="number" min={0} placeholder="Female participants" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="topics" placeholder="Topics covered" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-3" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save session"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
