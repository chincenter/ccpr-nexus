"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import { updateAssistancePlanStatus, archiveAssistancePlan, updateAssistancePlan } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"assistance_plan_status">[] = ["planned", "ongoing", "completed", "cancelled"];
const TYPES = ["food", "nfi", "cash", "shelter", "wash", "protection", "livelihood", "other"];

type Plan = Tables<"assistance_plans"> & {
  project?: { name: string; code: string } | null;
  responsible?: { full_name: string } | null;
  deliveredQuantity: number;
  householdsReached: number;
  beneficiariesReached: number;
};

export function AssistancePlanRow({
  plan,
  canEdit,
  locations,
  staff,
}: {
  plan: Plan;
  canEdit: boolean;
  locations: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(plan.status);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const householdAchievement = safePercent(plan.householdsReached, plan.target_households);
  const beneficiaryAchievement = safePercent(plan.beneficiariesReached, plan.target_beneficiaries);

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="bg-slate-50 px-4 py-3">
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateAssistancePlan(plan.id, plan.project_id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <input name="name" defaultValue={plan.name} required placeholder="Plan name" className="sm:col-span-3 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <select name="assistance_type" defaultValue={plan.assistance_type} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select name="location_id" defaultValue={plan.location_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              <option value="">Unspecified location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <select name="responsible_staff_id" defaultValue={plan.responsible_staff_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <input name="unit" defaultValue={plan.unit ?? ""} placeholder="Unit" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="planned_quantity" type="number" min={0} step="0.01" defaultValue={plan.planned_quantity ?? ""} placeholder="Planned quantity" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="target_households" type="number" min={0} defaultValue={plan.target_households ?? ""} placeholder="Target households" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="target_beneficiaries" type="number" min={0} defaultValue={plan.target_beneficiaries ?? ""} placeholder="Target beneficiaries" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="start_date" type="date" defaultValue={plan.start_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="end_date" type="date" defaultValue={plan.end_date ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <textarea name="target_criteria" rows={2} defaultValue={plan.target_criteria ?? ""} placeholder="Target criteria" className="sm:col-span-3 rounded-md border border-slate-300 px-2 py-1 text-xs" />
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
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{plan.name}</p>
        <p className="text-xs text-slate-500">{plan.responsible?.full_name ?? "Unassigned"}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">{plan.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{plan.assistance_type}</td>
      <td className="px-4 py-3 text-slate-600">
        {plan.deliveredQuantity.toLocaleString()} / {plan.planned_quantity ?? "—"} {plan.unit ?? ""}
        {(plan.target_households != null || plan.target_beneficiaries != null) && (
          <p className="text-xs text-slate-400">
            {plan.target_households != null && (
              <>HH {plan.householdsReached}/{plan.target_households} ({householdAchievement ?? "—"}%) </>
            )}
            {plan.target_beneficiaries != null && (
              <>Ben {plan.beneficiariesReached}/{plan.target_beneficiaries} ({beneficiaryAchievement ?? "—"}%)</>
            )}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"assistance_plan_status">;
              setStatus(next);
              startTransition(async () => {
                await updateAssistancePlanStatus(plan.id, next);
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
          <StatusBadge status={plan.status} />
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveAssistancePlan(plan.id, !plan.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {plan.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
