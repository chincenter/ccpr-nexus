"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { safePercent, achievementLabel } from "@/lib/calculations";
import { updateIndicatorActual, archiveIndicator } from "./actions";
import type { Tables } from "@/lib/types/database";

const ACHIEVEMENT_STYLES: Record<string, string> = {
  on_track: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  at_risk: "bg-amber-50 text-amber-700 ring-amber-600/20",
  off_track: "bg-red-50 text-red-700 ring-red-600/20",
  unknown: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

type Indicator = Tables<"indicators"> & {
  project?: { name: string } | null;
  programme?: { name: string } | null;
  responsible?: { full_name: string } | null;
};

export function IndicatorRow({ indicator, canEdit }: { indicator: Indicator; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actual, setActual] = useState(indicator.actual ?? 0);
  const pct = safePercent(indicator.actual, indicator.target);
  const label = achievementLabel(pct);

  function save() {
    startTransition(async () => {
      await updateIndicatorActual(indicator.id, actual, indicator.verification_status);
      router.refresh();
    });
  }

  return (
    <tr className="hover:bg-slate-50 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{indicator.name}</p>
        <p className="text-xs text-slate-500">
          {indicator.project?.name ?? indicator.programme?.name}
          {indicator.reporting_period ? ` · ${indicator.reporting_period}` : ""}
        </p>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {indicator.baseline ?? "—"} → {indicator.target ?? "—"} {indicator.unit ?? ""}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              value={actual}
              disabled={isPending}
              onChange={(e) => setActual(Number(e.target.value))}
              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={save}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        ) : (
          <span className="text-slate-600">{indicator.actual ?? "—"}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ACHIEVEMENT_STYLES[label]}`}>
          {pct != null ? `${pct}%` : "—"} · {label.replaceAll("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">{indicator.responsible?.full_name ?? "Unassigned"}</td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveIndicator(indicator.id, !indicator.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {indicator.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
