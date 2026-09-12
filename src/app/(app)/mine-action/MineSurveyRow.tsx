"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateSurveyStatus } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"mine_action_status">[] = ["open", "in_progress", "cleared", "monitoring", "closed"];

type Survey = Tables<"mine_surveys"> & { project?: { name: string } | null; location?: { name: string } | null };

export function MineSurveyRow({ survey, canEdit }: { survey: Survey; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(survey.status);

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-600">{survey.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{survey.survey_date}</td>
      <td className="px-4 py-3 text-slate-600">{survey.survey_type ?? "—"}</td>
      <td className="px-4 py-3 max-w-xs text-slate-600">{survey.findings ?? "—"}</td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"mine_action_status">;
              setStatus(next);
              startTransition(async () => {
                await updateSurveyStatus(survey.id, next);
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
          <StatusBadge status={survey.status} />
        )}
      </td>
    </tr>
  );
}
