"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateVictimCaseStatus } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"case_status">[] = ["open", "in_progress", "resolved", "closed"];

type Case = Tables<"victim_assistance"> & { project?: { name: string } | null };

export function VictimAssistanceRow({ item, canEdit }: { item: Case; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(item.status);

  return (
    <tr className="align-top hover:bg-slate-50">
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
    </tr>
  );
}
