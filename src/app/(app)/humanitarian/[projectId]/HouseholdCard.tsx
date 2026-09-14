"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import {
  createBeneficiary,
  updateBeneficiary,
  archiveBeneficiary,
  updateHousehold,
  updateHouseholdStatus,
  archiveHousehold,
} from "../actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"household_assistance_status">[] = ["not_assessed", "planned", "assisted", "ineligible"];
const AGE_GROUPS: Enums<"age_group">[] = ["child", "youth", "adult", "elderly"];

type Household = Tables<"households"> & { beneficiaries: Tables<"beneficiaries">[]; location?: { name: string } | null };

function BeneficiaryRow({ projectId, beneficiary, canEdit }: { projectId: string; beneficiary: Tables<"beneficiaries">; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="py-2">
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateBeneficiary(projectId, beneficiary.id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-4"
          >
            <input name="beneficiary_code" defaultValue={beneficiary.beneficiary_code} required className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <select name="age_group" defaultValue={beneficiary.age_group} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {AGE_GROUPS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <input name="gender" defaultValue={beneficiary.gender ?? ""} placeholder="Gender (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="vulnerability_category" defaultValue={beneficiary.vulnerability_category ?? ""} placeholder="Vulnerability (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
            <div className="col-span-full flex gap-2">
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
    <tr className={beneficiary.archived_at ? "opacity-50" : undefined}>
      <td className="py-1 pr-3">{beneficiary.beneficiary_code}</td>
      <td className="py-1 pr-3">{beneficiary.age_group}</td>
      <td className="py-1 pr-3">{beneficiary.gender ?? "—"}</td>
      <td className="py-1 pr-3">{beneficiary.vulnerability_category ?? "—"}</td>
      {canEdit && (
        <td className="py-1 pr-3 space-x-2 whitespace-nowrap text-right">
          <button type="button" onClick={() => setEditing(true)} className="text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveBeneficiary(projectId, beneficiary.id, !beneficiary.archived_at);
                router.refresh();
              })
            }
            className="text-slate-400 hover:text-red-600 disabled:opacity-60"
          >
            {beneficiary.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}

export function HouseholdCard({ projectId, household, canEdit }: { projectId: string; household: Household; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(household.assistance_status);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBeneficiaries = household.beneficiaries.filter((b) => !b.archived_at);

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{household.household_code}</p>
          <p className="text-xs text-slate-500">
            {household.location?.name ?? "No location"} · {household.household_size ?? "?"} members · {activeBeneficiaries.length} beneficiaries registered
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
        {editing ? (
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateHousehold(projectId, household.id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-4"
          >
            <input name="household_code" defaultValue={household.household_code} required className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="household_size" type="number" min={0} defaultValue={household.household_size ?? ""} placeholder="Household size" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="vulnerability_notes" defaultValue={household.vulnerability_notes ?? ""} placeholder="Vulnerability notes" className="sm:col-span-2 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
            <div className="col-span-full flex gap-2">
              <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          household.vulnerability_notes && <p className="text-xs text-slate-500">{household.vulnerability_notes}</p>
        )}

        <table className="min-w-full text-xs">
          <thead className="text-left uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-1 pr-3">Code</th>
              <th className="py-1 pr-3">Age group</th>
              <th className="py-1 pr-3">Gender</th>
              <th className="py-1 pr-3">Vulnerability</th>
              {canEdit && <th className="py-1 pr-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {household.beneficiaries.map((b) => (
              <BeneficiaryRow key={b.id} projectId={projectId} beneficiary={b} canEdit={canEdit} />
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
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
              Edit household
            </button>
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
          </div>
        )}
      </div>
    </details>
  );
}
