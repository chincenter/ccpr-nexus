"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBudget, archiveBudget } from "../actions";
import type { Tables } from "@/lib/types/database";

const CURRENCIES = ["USD", "EUR", "GBP", "MMK", "INR"];

export function BudgetEditForm({ budget, projectId, canEdit }: { budget: Tables<"budgets">; projectId: string; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) return null;

  if (!editing) {
    return (
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
          Edit budget
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await archiveBudget(budget.id, projectId, !budget.archived_at);
              router.refresh();
            })
          }
          className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
        >
          {budget.archived_at ? "Restore budget" : "Archive budget"}
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateBudget(budget.id, projectId, formData);
          if (result.error) setError(result.error);
          else {
            setEditing(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600">Approved budget</label>
        <input name="approved_budget" type="number" min={0} step="any" defaultValue={budget.approved_budget} required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Revised budget (optional)</label>
        <input name="revised_budget" type="number" min={0} step="any" defaultValue={budget.revised_budget ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Currency</label>
        <select name="currency" defaultValue={budget.currency} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Notes</label>
        <input name="notes" defaultValue={budget.notes ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
