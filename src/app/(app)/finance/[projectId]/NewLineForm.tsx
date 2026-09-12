"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBudgetLine } from "../actions";

export function NewLineForm({ budgetId, projectId }: { budgetId: string; projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-teal-700 hover:underline">
        + Add budget line
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        formData.set("budget_id", budgetId);
        formData.set("project_id", projectId);
        setError(null);
        startTransition(async () => {
          const result = await createBudgetLine(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4"
    >
      <input name="line_name" required placeholder="Line name" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="category" placeholder="Category (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="amount" type="number" min={0} step="any" required placeholder="Amount" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
