"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateSurveyStatus, updateSurveyVerification, archiveMineSurvey, updateMineSurvey } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"mine_action_status">[] = ["open", "in_progress", "cleared", "monitoring", "closed"];

type Survey = Tables<"mine_surveys"> & {
  project?: { name: string } | null;
  location?: { name: string } | null;
  hazard?: { hazard_code: string } | null;
};

export function MineSurveyRow({ survey, canEdit, canApprove }: { survey: Survey; canEdit: boolean; canApprove: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(survey.status);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="bg-slate-50 px-4 py-3">
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateMineSurvey(survey.id, survey.project_id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <input name="survey_type" defaultValue={survey.survey_type ?? ""} placeholder="Survey type" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="area_covered" defaultValue={survey.area_covered ?? ""} placeholder="Area covered" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="survey_date" type="date" required defaultValue={survey.survey_date} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <textarea name="findings" rows={2} defaultValue={survey.findings ?? ""} placeholder="Findings" className="sm:col-span-3 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            {error && <p className="sm:col-span-3 text-xs text-red-600">{error}</p>}
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-600">
        {survey.project?.name ?? "—"}
        {survey.hazard && <p className="text-xs text-slate-400">{survey.hazard.hazard_code}</p>}
      </td>
      <td className="px-4 py-3 text-slate-600">{survey.survey_date}</td>
      <td className="px-4 py-3 text-slate-600">{survey.survey_type ?? "—"}</td>
      <td className="px-4 py-3 max-w-xs text-slate-600">{survey.findings ?? "—"}</td>
      <td className="px-4 py-3 space-y-1">
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
        <div>
          <StatusBadge status={survey.verification_status} />
        </div>
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
          {survey.verification_status === "submitted" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await updateSurveyVerification(survey.id, "under_review"); router.refresh(); })}
              className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-60"
            >
              Check
            </button>
          )}
          {canApprove && (survey.verification_status === "under_review" || survey.verification_status === "submitted") && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await updateSurveyVerification(survey.id, "approved"); router.refresh(); })}
              className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-60"
            >
              Approve
            </button>
          )}
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await archiveMineSurvey(survey.id, survey.project_id, !survey.archived_at); router.refresh(); })}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {survey.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
