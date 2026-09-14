"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveMreSession, updateMreSession } from "./actions";
import type { Tables } from "@/lib/types/database";

type Session = Tables<"mre_sessions"> & { project?: { name: string } | null; location?: { name: string } | null };

export function MreSessionRow({ session, canEdit }: { session: Session; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="bg-slate-50 px-4 py-3">
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateMreSession(session.id, session.project_id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <input name="session_date" type="date" required defaultValue={session.session_date} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <select name="session_type" defaultValue={session.session_type} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              <option value="mre">Mine Risk Education</option>
              <option value="community_awareness">Community Awareness</option>
            </select>
            <input name="audience_description" defaultValue={session.audience_description ?? ""} placeholder="Audience" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="participants_male" type="number" min={0} defaultValue={session.participants_male ?? ""} placeholder="Male" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="participants_female" type="number" min={0} defaultValue={session.participants_female ?? ""} placeholder="Female" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="topics" defaultValue={session.topics ?? ""} placeholder="Topics" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            {error && <p className="sm:col-span-3 text-xs text-red-600">{error}</p>}
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-slate-50 ${session.archived_at ? "opacity-50" : ""}`}>
      <td className="px-4 py-3 text-slate-600">{session.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{session.session_date}</td>
      <td className="px-4 py-3 text-slate-600">{session.session_type}</td>
      <td className="px-4 py-3 text-slate-600">{session.audience_description ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">
        {session.participants_total ?? 0}
        <span className="text-xs text-slate-400"> ({session.participants_male ?? 0}M / {session.participants_female ?? 0}F)</span>
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await archiveMreSession(session.id, session.project_id, !session.archived_at); router.refresh(); })}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {session.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
