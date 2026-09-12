"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { StatusBadge } from "@/components/StatusBadge";
import { updateGovernanceActionStatus, addFollowUpNote, archiveGovernanceAction } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"task_status">[] = ["not_started", "in_progress", "completed", "blocked", "cancelled"];

type Action = Tables<"governance_actions"> & {
  project?: { name: string } | null;
  programme?: { name: string } | null;
  responsible?: { full_name: string } | null;
};

export function GovernanceActionRow({ action, canEdit }: { action: Action; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(action.status);
  const [note, setNote] = useState(action.follow_up_notes ?? "");

  const isOverdue = !!action.due_date && action.due_date < new Date().toISOString().slice(0, 10) && !["completed", "cancelled"].includes(status);

  return (
    <tr className={clsx("align-top hover:bg-slate-50", isOverdue && "bg-red-50/60")}>
      <td className="px-4 py-3">
        <p className="text-slate-900">{action.action_description}</p>
        <p className="text-xs text-slate-500">{action.project?.name ?? action.programme?.name}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">{action.responsible?.full_name ?? "Unassigned"}</td>
      <td className="px-4 py-3">
        <span className={isOverdue ? "font-medium text-red-700" : "text-slate-600"}>{action.due_date ?? "—"}</span>
        {isOverdue && <span className="ml-1 text-xs text-red-700">Overdue</span>}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"task_status">;
              setStatus(next);
              startTransition(async () => {
                await updateGovernanceActionStatus(action.id, next);
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
          <StatusBadge status={action.status} />
        )}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (action.follow_up_notes ?? "")) {
                startTransition(async () => {
                  await addFollowUpNote(action.id, note);
                  router.refresh();
                });
              }
            }}
            placeholder="Follow-up note"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        ) : (
          <span className="text-xs text-slate-600">{action.follow_up_notes ?? "—"}</span>
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveGovernanceAction(action.id, !action.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {action.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
