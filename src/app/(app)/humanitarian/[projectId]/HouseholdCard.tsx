"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { createBeneficiary, updateHouseholdStatus, archiveHousehold } from "../actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"household_assistance_status">[] = ["not_assessed", "planned", "assisted", "ineligible"];
const AGE_GROUPS: Enums<"age_group">[] = ["child", "youth", "adult", "elderly"];

type Household = Tables<"households"> & { beneficiaries: Tables<"beneficiaries">[]; location?: { name: string } | null };

export function HouseholdCard({ projectId, household, canEdit }: { projectId: string; household: Household; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(household.assistance_status);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{household.household_code}</p>
          <p className="text-xs text-slate-500">
            {household.location?.name ?? "No location"} · {household.household_size ?? "?"} members · {household.beneficiaries.length} beneficiaries registered
          </p>
        </div>
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const next = e.target.value as Enums<"household_assistance_status">;
              setStatus(next);
              startTransition(async () => {
                await updateHouseholdStatus(projectId, household.id, next);
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
          <StatusBadge status={household.assistance_status} />
        )}
      </summary>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {household.vulnerability_notes && <p className="text-xs text-slate-500">{household.vulnerability_notes}</p>}

        <table className="min-w-full text-xs">
          <thead className="text-left uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-1 pr-3">Code</th>
              <th className="py-1 pr-3">Age group</th>
              <th className="py-1 pr-3">Gender</th>
              <th className="py-1 pr-3">Vulnerability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {household.beneficiaries.map((b) => (
              <tr key={b.id}>
                <td className="py-1 pr-3">{b.beneficiary_code}</td>
                <td className="py-1 pr-3">{b.age_group}</td>
                <td className="py-1 pr-3">{b.gender ?? "—"}</td>
                <td className="py-1 pr-3">{b.vulnerability_category ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {household.beneficiaries.length === 0 && <p className="text-xs text-slate-500">No beneficiaries registered yet.</p>}

        {canEdit && (
          <div>
            {!addOpen ? (
              <button type="button" onClick={() => setAddOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
                + Add beneficiary
              </button>
            ) : (
              <form
                action={(formData) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await createBeneficiary(projectId, household.id, formData);
                    if (result.error) setError(result.error);
                    else {
                      setAddOpen(false);
                      router.refresh();
                    }
                  });
                }}
                className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-4"
              >
                <input name="beneficiary_code" placeholder="Code" required className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
                <select name="age_group" defaultValue="adult" className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                  {AGE_GROUPS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <input name="gender" placeholder="Gender (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
                <input name="vulnerability_category" placeholder="Vulnerability (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
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

        {canEdit && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveHousehold(projectId, household.id, !household.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {household.archived_at ? "Restore household" : "Archive household"}
          </button>
        )}
      </div>
    </details>
  );
}
