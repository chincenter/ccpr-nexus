"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { archiveProgramme } from "./actions";
import type { Tables } from "@/lib/types/database";

const CATEGORY_LABELS: Record<string, string> = {
  humanitarian: "Humanitarian",
  mine_action: "Landmine / Mine Action",
  health: "Health",
  governance: "Governance",
  peacebuilding: "Peacebuilding",
  research_policy: "Research / Policy",
  other: "Other",
};

type Programme = Tables<"programmes"> & { lead?: { full_name: string } | null };

export function ProgrammeRow({
  programme,
  projectCount,
  canEdit,
}: {
  programme: Programme;
  projectCount: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2 font-mono text-xs text-slate-500">{programme.code}</td>
      <td className="px-4 py-2">
        <Link href={`/programmes/${programme.id}`} className="font-medium text-teal-800 hover:underline">
          {programme.name}
        </Link>
        {programme.is_demo && <span className="ml-2"><DemoBadge /></span>}
      </td>
      <td className="px-4 py-2 text-slate-600">{CATEGORY_LABELS[programme.category]}</td>
      <td className="px-4 py-2 text-slate-600">{programme.lead?.full_name ?? "Unassigned"}</td>
      <td className="px-4 py-2 text-slate-600">{projectCount}</td>
      <td className="px-4 py-2">
        <StatusBadge status={programme.status} />
      </td>
      {canEdit && (
        <td className="px-4 py-2 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveProgramme(programme.id, !programme.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {programme.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
