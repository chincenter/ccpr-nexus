"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { createRecommendation, updateRecommendationStatus } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"case_status">[] = ["open", "in_progress", "resolved", "closed"];

type Recommendation = Tables<"recommendations"> & { responsible?: { full_name: string } | null };
type Consultation = Tables<"consultations"> & {
  project?: { name: string } | null;
  programme?: { name: string } | null;
  location?: { name: string } | null;
  consultation_stakeholders: { stakeholder: { name: string } | null }[];
  recommendations: Recommendation[];
};

export function ConsultationCard({
  consultation,
  staff,
  canEdit,
}: {
  consultation: Consultation;
  staff: { id: string; full_name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer">
        <p className="inline font-medium text-slate-900">{consultation.topic}</p>
        <p className="text-xs text-slate-500">
          {consultation.consultation_date} · {consultation.project?.name ?? consultation.programme?.name} ·{" "}
          {consultation.location?.name ?? "No location"} · {consultation.consultation_stakeholders.length} attendee
          {consultation.consultation_stakeholders.length === 1 ? "" : "s"}
        </p>
      </summary>

      <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
        {consultation.summary && <p className="text-xs text-slate-600">{consultation.summary}</p>}

        {consultation.consultation_stakeholders.length > 0 && (
          <p className="text-xs text-slate-500">
            Attendees: {consultation.consultation_stakeholders.map((cs) => cs.stakeholder?.name).filter(Boolean).join(", ")}
          </p>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Recommendations</p>
          <ul className="mt-1 space-y-1">
            {consultation.recommendations.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-xs text-slate-700">
                <span>
                  {r.description}
                  {r.responsible && ` — ${r.responsible.full_name}`}
                </span>
                {canEdit ? (
                  <select
                    defaultValue={r.status}
                    disabled={isPending}
                    onChange={(e) => {
                      const next = e.target.value as Enums<"case_status">;
                      startTransition(async () => {
                        await updateRecommendationStatus(r.id, next);
                        router.refresh();
                      });
                    }}
                    className="rounded-md border border-slate-300 px-1.5 py-0.5 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </li>
            ))}
          </ul>
          {consultation.recommendations.length === 0 && <p className="text-xs text-slate-500">No recommendations recorded yet.</p>}
        </div>

        {canEdit && (
          <div>
            {!addOpen ? (
              <button type="button" onClick={() => setAddOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
                + Add recommendation
              </button>
            ) : (
              <form
                action={(formData) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await createRecommendation(consultation.id, formData);
                    if (result.error) setError(result.error);
                    else {
                      setAddOpen(false);
                      router.refresh();
                    }
                  });
                }}
                className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-3"
              >
                <input name="description" placeholder="Recommendation" required className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" />
                <select name="responsible_staff_id" className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <div className="col-span-full flex gap-2">
                  <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                    Save
                  </button>
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
                    Cancel
                  </button>
                </div>
                {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
