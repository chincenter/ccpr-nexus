"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBudget } from "../actions";

export function CreateBudgetForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">No budget set up yet for this project.</p>
      <div className="mt-3 flex items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600">Approved budget (USD)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={isPending || !amount}
          onClick={() =>
            startTransition(async () => {
              const result = await createBudget(projectId, Number(amount));
              if (result.error) setError(result.error);
              else router.refresh();
            })
          }
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          Create budget
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
