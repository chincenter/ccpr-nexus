"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { budgetUtilization, budgetRemaining, utilizationSeverity } from "@/lib/calculations";
import { recordExpenditure, recordCommitment } from "../actions";
import type { Tables } from "@/lib/types/database";

const SEVERITY_STYLES: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
};

type Line = Tables<"budget_lines"> & {
  expenditures: Tables<"expenditures">[];
  commitments: Tables<"commitments">[];
};

export function BudgetLineCard({ line, projectId, canEdit }: { line: Line; projectId: string; canEdit: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const expenditureTotal = line.expenditures.reduce((s, e) => s + e.amount, 0);
  const committedTotal = line.commitments.reduce((s, c) => s + c.amount, 0);
  const remaining = budgetRemaining(line.amount, expenditureTotal, committedTotal);
  const utilization = budgetUtilization(expenditureTotal, line.amount);
  const severity = utilizationSeverity(utilization);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left font-medium text-slate-900 hover:underline">
            {line.line_name}
          </button>
          <p className="text-xs text-slate-500">{line.category ?? "Uncategorized"}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-600">
            ${expenditureTotal.toLocaleString()} / ${line.amount.toLocaleString()}
          </p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLES[severity]}`}>
            {utilization != null ? `${utilization}%` : "0%"} utilized
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Committed</p>
              <p className="font-medium text-slate-800">${committedTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Remaining</p>
              <p className="font-medium text-slate-800">${remaining.toLocaleString()}</p>
            </div>
          </div>

          {line.expenditures.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Expenditures</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {line.expenditures.map((e) => (
                  <li key={e.id} className="flex justify-between">
                    <span>{e.description ?? "—"} ({e.expense_date})</span>
                    <span>${e.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {line.commitments.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Commitments</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {line.commitments.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.description ?? "—"} ({c.commitment_date})</span>
                    <span>${c.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canEdit && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <form
                action={(formData) => {
                  formData.set("budget_line_id", line.id);
                  formData.set("project_id", projectId);
                  setError(null);
                  startTransition(async () => {
                    const result = await recordExpenditure(formData);
                    if (result.error) setError(result.error);
                    else router.refresh();
                  });
                }}
                className="space-y-2 rounded-md bg-slate-50 p-3"
              >
                <p className="text-xs font-medium text-slate-600">Record expenditure</p>
                <input name="amount" type="number" min={0} step="any" required placeholder="Amount" className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <input name="expense_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <input name="description" placeholder="Description" className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                  Add
                </button>
              </form>

              <form
                action={(formData) => {
                  formData.set("budget_line_id", line.id);
                  formData.set("project_id", projectId);
                  setError(null);
                  startTransition(async () => {
                    const result = await recordCommitment(formData);
                    if (result.error) setError(result.error);
                    else router.refresh();
                  });
                }}
                className="space-y-2 rounded-md bg-slate-50 p-3"
              >
                <p className="text-xs font-medium text-slate-600">Record commitment</p>
                <input name="amount" type="number" min={0} step="any" required placeholder="Amount" className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <input name="commitment_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <input name="description" placeholder="Description" className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                  Add
                </button>
              </form>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
