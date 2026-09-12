"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { riskRating } from "@/lib/calculations";
import { updateRiskStatus, archiveRisk } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"risk_status">[] = ["open", "mitigating", "monitoring", "closed"];

const RATING_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 ring-red-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  low: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

type Risk = Tables<"risks"> & {
  project?: { name: string } | null;
  programme?: { name: string } | null;
  responsible?: { full_name: string } | null;
};

export function RiskRow({ risk, canEdit }: { risk: Risk; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(risk.status);
  const rating = riskRating(risk.likelihood, risk.impact);

  return (
    <tr className="hover:bg-slate-50 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{risk.title}</p>
        <p className="text-xs text-slate-500">
          {risk.project?.name ?? risk.programme?.name} · {risk.category}
        </p>
        {risk.mitigation && <p className="mt-1 text-xs text-slate-500">Mitigation: {risk.mitigation}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${RATING_STYLES[rating.label]}`}>
          {rating.label} ({risk.likelihood}/{risk.impact})
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">{risk.responsible?.full_name ?? "Unassigned"}</td>
      <td className="px-4 py-3 text-slate-600">{risk.review_date ?? "—"}</td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"risk_status">;
              setStatus(next);
              startTransition(async () => {
                await updateRiskStatus(risk.id, next);
                router.refresh();
              });
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge status={risk.status} />
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveRisk(risk.id, !risk.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {risk.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
