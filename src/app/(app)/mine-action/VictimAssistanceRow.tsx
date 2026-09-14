"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateVictimCaseStatus, updateVictimAssistance, archiveVictimAssistance } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"case_status">[] = ["open", "in_progress", "resolved", "closed"];
const REFERRAL: Enums<"referral_status">[] = ["not_referred", "referred", "in_progress", "completed"];

type Case = Tables<"victim_assistance"> & { project?: { name: string } | null };

export function VictimAssistanceRow({ item, canEdit }: { item: Case; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(item.status);
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
                const result = await updateVictimAssistance(item.id, item.project_id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <input name="incident_date" type="date" defaultValue={item.incident_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="injury_type" defaultValue={item.injury_type ?? ""} placeholder="Injury type" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="assistance_provided" defaultValue={item.assistance_provided ?? ""} placeholder="Assistance provided" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="referral_organization" defaultValue={item.referral_organization ?? ""} placeholder="Referral organization" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <select name="referral_status" defaultValue={item.referral_status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {REFERRAL.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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
    <tr className={`align-top hover:bg-slate-50 ${item.archived_at ? "opacity-50" : ""}`}>
      <td className="px-4 py-3 text-slate-600">{item.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{item.incident_date ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{item.injury_type ?? "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={item.referral_status} />
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"case_status">;
              setStatus(next);
              startTransition(async () => {
                await updateVictimCaseStatus(item.id, next);
                router.refresh();
              });
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <StatusBadge status={item.status} />
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await archiveVictimAssistance(item.id, item.project_id, !item.archived_at); router.refresh(); })}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {item.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
