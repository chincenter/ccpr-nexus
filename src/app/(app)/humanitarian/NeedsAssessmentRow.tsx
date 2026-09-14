"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { archiveNeedsAssessment, updateAssessmentVerification, updateNeedsAssessment } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

type Document = Tables<"documents"> & { uploader?: { full_name: string } | null };

const PRIORITIES: Enums<"priority_level">[] = ["low", "medium", "high", "critical"];
const ASSESSMENT_TYPES: Enums<"assessment_type">[] = [
  "rapid_needs",
  "household_assessment",
  "sector_assessment",
  "post_distribution_monitoring",
  "other",
];
const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  rapid_needs: "Rapid Needs Assessment",
  household_assessment: "Household Assessment",
  sector_assessment: "Sector Assessment",
  post_distribution_monitoring: "Post-Distribution Monitoring",
  other: "Other",
};

type Assessment = Tables<"needs_assessments"> & { project?: { name: string; code: string } | null };

export function NeedsAssessmentRow({
  assessment,
  canEdit,
  canCheck,
  canApprove,
  locations,
  documents = [],
}: {
  assessment: Assessment;
  canEdit: boolean;
  canCheck: boolean;
  canApprove: boolean;
  locations: { id: string; name: string }[];
  documents?: Document[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setVerification(status: Enums<"approval_status">) {
    startTransition(async () => {
      const result = await updateAssessmentVerification(assessment.id, status);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={7} className="bg-slate-50 px-4 py-3">
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateNeedsAssessment(assessment.id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <select name="assessment_type" defaultValue={assessment.assessment_type} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t} value={t}>{ASSESSMENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select name="location_id" defaultValue={assessment.location_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              <option value="">Unspecified location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <input name="assessment_date" type="date" required defaultValue={assessment.assessment_date} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="population_estimate" type="number" min={0} defaultValue={assessment.population_estimate ?? ""} placeholder="Population estimate" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <select name="priority" defaultValue={assessment.priority} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div />
            <textarea name="needs" rows={2} defaultValue={assessment.needs ?? ""} placeholder="Needs identified" className="sm:col-span-3 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <textarea name="findings" rows={2} defaultValue={assessment.findings ?? ""} placeholder="Findings" className="sm:col-span-3 rounded-md border border-slate-300 px-2 py-1 text-xs" />
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
    <>
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-600">{assessment.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">
        {assessment.assessment_date}
        <p className="text-xs text-slate-400">{ASSESSMENT_TYPE_LABELS[assessment.assessment_type]}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">{assessment.population_estimate?.toLocaleString() ?? "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={assessment.priority} />
      </td>
      <td className="px-4 py-3 max-w-xs text-slate-600">{assessment.needs ?? "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={assessment.verification_status} />
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
          {canCheck && assessment.verification_status === "submitted" && (
            <button type="button" disabled={isPending} onClick={() => setVerification("under_review")} className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-60">
              Check
            </button>
          )}
          {canApprove && (assessment.verification_status === "under_review" || assessment.verification_status === "submitted") && (
            <button type="button" disabled={isPending} onClick={() => setVerification("approved")} className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-60">
              Approve
            </button>
          )}
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button type="button" onClick={() => setShowEvidence((v) => !v)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
            Evidence{documents.length > 0 ? ` (${documents.length})` : ""}
          </button>
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
    {showEvidence && (
      <tr>
        <td colSpan={7} className="bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Evidence — assessment report(s)</p>
          <div className="mt-2 space-y-2">
            {canEdit && <DocumentUploader entityType="needs_assessment" entityId={assessment.id} />}
            <DocumentList documents={documents} canEdit={canEdit} />
          </div>
        </td>
      </tr>
    )}
    </>
  );
}
