"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateDecisionStatus } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"case_status">[] = ["open", "in_progress", "resolved", "closed"];

type Decision = Tables<"decisions"> & { project?: { name: string } | null; programme?: { name: string } | null };

export function DecisionRow({ decision, canEdit }: { decision: Decision; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(decision.status);

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="text-slate-900">{decision.decision_text}</p>
        <p className="text-xs text-slate-500">{decision.project?.name ?? decision.programme?.name}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">{decision.decision_date}</td>
      <td className="px-4 py-3 text-slate-600">{decision.responsible_body ?? "—"}</td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"case_status">;
              setStatus(next);
              startTransition(async () => {
                await updateDecisionStatus(decision.id, next);
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
          <StatusBadge status={decision.status} />
        )}
      </td>
    </tr>
  );
}
