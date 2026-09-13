"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { safePercent, indicatorStatus } from "@/lib/calculations";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { archiveIndicator, recordMeasurement, updateVerificationStatus } from "./actions";
import { IndicatorForm } from "./IndicatorForm";
import type { Tables } from "@/lib/types/database";

type ResultOption = { id: string; label: string; project_id: string };
type Measurement = Tables<"indicator_measurements"> & { entered?: { full_name: string } | null };
type AuditEntry = { id: string; action: string; created_at: string; staff: { full_name: string } | null };
type Document = Tables<"documents"> & { uploader?: { full_name: string } | null };

type Indicator = Tables<"indicators"> & {
  project?: { id: string; name: string } | null;
  programme?: { id: string; name: string } | null;
  responsible?: { full_name: string } | null;
  resultLabel?: string | null;
};

const VERIFICATION_LABELS: Record<string, string> = {
  draft: "Not submitted",
  submitted: "Submitted",
  under_review: "Checked",
  approved: "Verified / Approved",
  published: "Published",
};

export function IndicatorCard({
  indicator,
  canEdit,
  canCheck,
  canApprove,
  measurements,
  documents,
  history,
  projects,
  programmes,
  staff,
  objectives,
  outcomes,
  outputs,
}: {
  indicator: Indicator;
  canEdit: boolean;
  canCheck: boolean;
  canApprove: boolean;
  measurements: Measurement[];
  documents: Document[];
  history: AuditEntry[];
  projects: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
  objectives: ResultOption[];
  outcomes: ResultOption[];
  outputs: ResultOption[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const pct = safePercent(indicator.actual, indicator.target);
  const status = indicatorStatus(indicator.actual, indicator.target);
  const projectId = indicator.project_id;

  function setStatus(next: "submitted" | "under_review" | "approved" | "draft") {
    startTransition(async () => {
      const result = await updateVerificationStatus(indicator.id, projectId, next, comment || undefined);
      if (result.error) setError(result.error);
      else {
        setComment("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left font-medium text-slate-900 hover:text-teal-800 hover:underline">
            {indicator.name}
          </button>
          <p className="text-xs text-slate-500">
            {indicator.code ? `${indicator.code} · ` : ""}
            {indicator.project?.name ?? indicator.programme?.name}
            {indicator.resultLabel ? ` · ${indicator.resultLabel}` : ""}
            {indicator.reporting_period ? ` · ${indicator.reporting_period}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <StatusBadge status={indicator.verification_status} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Baseline → Target</p>
          <p className="text-slate-800">
            {indicator.baseline ?? "—"} → {indicator.target ?? "—"} {indicator.unit ?? ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Actual</p>
          <p className="text-slate-800">{indicator.actual ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Achievement</p>
          <p className="text-slate-800">{pct != null ? `${pct}%` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Responsible</p>
          <p className="text-slate-800">{indicator.responsible?.full_name ?? "Unassigned"}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {editing ? (
            <IndicatorForm
              indicator={indicator}
              projects={projects}
              programmes={programmes}
              staff={staff}
              objectives={objectives}
              outcomes={outcomes}
              outputs={outputs}
              fixedProjectId={indicator.project_id ?? undefined}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              {(indicator.definition || indicator.notes) && (
                <div className="space-y-1 text-sm text-slate-600">
                  {indicator.definition && <p>{indicator.definition}</p>}
                  {indicator.notes && <p className="whitespace-pre-line text-xs text-slate-500">{indicator.notes}</p>}
                </div>
              )}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reporting history</p>
                <div className="mt-1 overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="pr-3 py-1">Period</th>
                        <th className="pr-3 py-1">Actual</th>
                        <th className="pr-3 py-1">Source</th>
                        <th className="pr-3 py-1">Entered by</th>
                        <th className="pr-3 py-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id} className="border-t border-slate-100">
                          <td className="pr-3 py-1 text-slate-800">{m.reporting_period}</td>
                          <td className="pr-3 py-1 text-slate-800">{m.actual}</td>
                          <td className="pr-3 py-1 text-slate-600">{m.source ?? "—"}</td>
                          <td className="pr-3 py-1 text-slate-600">{m.entered?.full_name ?? "—"}</td>
                          <td className="pr-3 py-1 text-slate-600">{new Date(m.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {measurements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-1 text-slate-400">
                            No reporting periods recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {canEdit && (
                  <form
                    action={(formData) => {
                      setError(null);
                      startTransition(async () => {
                        const result = await recordMeasurement(indicator.id, projectId, formData);
                        if (result.error) setError(result.error);
                        else router.refresh();
                      });
                    }}
                    className="mt-2 flex flex-wrap items-end gap-2"
                  >
                    <div>
                      <label className="block text-xs text-slate-500">Period</label>
                      <input name="reporting_period" required placeholder="Q1 2026" className="mt-0.5 w-28 rounded-md border border-slate-300 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Actual</label>
                      <input name="actual" type="number" min={0} step="any" required className="mt-0.5 w-24 rounded-md border border-slate-300 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Source</label>
                      <input name="source" className="mt-0.5 w-32 rounded-md border border-slate-300 px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Notes</label>
                      <input name="notes" className="mt-0.5 w-32 rounded-md border border-slate-300 px-2 py-1 text-xs" />
                    </div>
                    <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                      Record actual
                    </button>
                  </form>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Verification</p>
                <p className="mt-1 text-sm text-slate-700">{VERIFICATION_LABELS[indicator.verification_status]}</p>
                {(canEdit || canCheck || canApprove) && (
                  <div className="mt-2 space-y-2">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Comment (optional)"
                      className="w-full max-w-sm rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      {canEdit && indicator.verification_status === "draft" && (
                        <button type="button" disabled={isPending} onClick={() => setStatus("submitted")} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-60">
                          Submit
                        </button>
                      )}
                      {canCheck && indicator.verification_status === "submitted" && (
                        <button type="button" disabled={isPending} onClick={() => setStatus("under_review")} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-60">
                          Mark checked
                        </button>
                      )}
                      {canApprove && (indicator.verification_status === "under_review" || indicator.verification_status === "submitted") && (
                        <button type="button" disabled={isPending} onClick={() => setStatus("approved")} className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60">
                          Approve
                        </button>
                      )}
                      {(canCheck || canApprove) && indicator.verification_status !== "draft" && (
                        <button type="button" disabled={isPending} onClick={() => setStatus("draft")} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-60">
                          Revert to draft
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {history.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-400">
                    {history.map((h) => (
                      <li key={h.id}>
                        {new Date(h.created_at).toLocaleString()} · {h.staff?.full_name ?? "System"} · {h.action}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Evidence</p>
                <div className="mt-1 space-y-2">
                  {canEdit && <DocumentUploader entityType="indicator" entityId={indicator.id} />}
                  <DocumentList documents={documents} canEdit={canEdit} />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                {canEdit && (
                  <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
                    Edit
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await archiveIndicator(indicator.id, !indicator.archived_at, projectId);
                        router.refresh();
                      })
                    }
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
                  >
                    {indicator.archived_at ? "Restore" : "Archive"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
