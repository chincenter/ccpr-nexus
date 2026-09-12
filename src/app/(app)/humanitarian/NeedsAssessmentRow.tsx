"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { archiveNeedsAssessment } from "./actions";
import type { Tables } from "@/lib/types/database";

type Assessment = Tables<"needs_assessments"> & { project?: { name: string; code: string } | null };

export function NeedsAssessmentRow({ assessment, canEdit }: { assessment: Assessment; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-600">{assessment.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{assessment.assessment_date}</td>
      <td className="px-4 py-3 text-slate-600">{assessment.population_estimate?.toLocaleString() ?? "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={assessment.priority} />
      </td>
      <td className="px-4 py-3 max-w-xs text-slate-600">{assessment.needs ?? "—"}</td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveNeedsAssessment(assessment.id, !assessment.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {assessment.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
