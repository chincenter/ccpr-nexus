"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { archiveDailyUpdate } from "../actions";
import type { Tables } from "@/lib/types/database";

type Update = Tables<"mine_daily_updates"> & { responsible?: { full_name: string } | null };

export function DailyUpdateRow({ update, canEdit }: { update: Update; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-3 ${update.archived_at ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">{update.update_date}</p>
          <p className="mt-0.5 text-sm text-slate-700">{update.summary}</p>
          {update.next_step && <p className="mt-1 text-xs text-slate-500">Next step: {update.next_step}</p>}
          {update.notes && <p className="mt-1 text-xs text-slate-400">{update.notes}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {update.responsible?.full_name ?? "Unknown"}
            {update.progress != null && <> · {update.progress}% progress</>}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {update.status_snapshot && <StatusBadge status={update.status_snapshot} />}
          {canEdit && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await archiveDailyUpdate(update.id, update.project_id, !update.archived_at); router.refresh(); })}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 disabled:opacity-60"
            >
              {update.archived_at ? "Restore" : "Hide"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
