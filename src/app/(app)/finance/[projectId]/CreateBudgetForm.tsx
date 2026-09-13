"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBudget } from "../actions";

const CURRENCIES = ["USD", "EUR", "GBP", "MMK", "INR"];

export function CreateBudgetForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">No budget set up yet for this project.</p>
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await createBudget(projectId, formData);
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
        className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600">Approved budget</label>
          <input
            name="approved_budget"
            type="number"
            min={0}
            step="any"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Currency</label>
          <select name="currency" defaultValue="USD" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Notes (optional)</label>
          <input name="notes" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <div className="col-span-full">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Create budget"}
          </button>
        </div>
      </form>
    </div>
  );
}
