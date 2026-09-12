"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { archiveStakeholder } from "./actions";
import type { Tables } from "@/lib/types/database";

type Stakeholder = Tables<"stakeholders"> & { project?: { name: string } | null; programme?: { name: string } | null };

export function StakeholderRow({ stakeholder, canEdit }: { stakeholder: Stakeholder; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{stakeholder.name}</p>
        <p className="text-xs text-slate-500">
          {stakeholder.stakeholder_type} · {stakeholder.project?.name ?? stakeholder.programme?.name}
        </p>
      </td>
      <td className="px-4 py-3 text-slate-600">{stakeholder.organization ?? "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={stakeholder.engagement_status} />
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveStakeholder(stakeholder.id, !stakeholder.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {stakeholder.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
