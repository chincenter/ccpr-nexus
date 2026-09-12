"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateAssistancePlanStatus, archiveAssistancePlan } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"assistance_plan_status">[] = ["planned", "ongoing", "completed", "cancelled"];

type Plan = Tables<"assistance_plans"> & { project?: { name: string; code: string } | null };

export function AssistancePlanRow({ plan, canEdit }: { plan: Plan; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(plan.status);

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{plan.name}</p>
        {plan.target_criteria && <p className="text-xs text-slate-500">{plan.target_criteria}</p>}
      </td>
      <td className="px-4 py-3 text-slate-600">{plan.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{plan.assistance_type}</td>
      <td className="px-4 py-3 text-slate-600">
        {plan.planned_quantity ?? "—"} {plan.unit ?? ""}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"assistance_plan_status">;
              setStatus(next);
              startTransition(async () => {
                await updateAssistancePlanStatus(plan.id, next);
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
          <StatusBadge status={plan.status} />
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveAssistancePlan(plan.id, !plan.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {plan.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
