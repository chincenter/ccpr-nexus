"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { budgetUtilization, budgetRemaining, utilizationSeverity, formatMoney } from "@/lib/calculations";
import {
  recordExpenditure,
  recordCommitment,
  updateBudgetLine,
  archiveBudgetLine,
  updateExpenditure,
  archiveExpenditure,
  updateCommitment,
  archiveCommitment,
} from "../actions";
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

export function BudgetLineCard({
  line,
  projectId,
  currency,
  canEdit,
}: {
  line: Line;
  projectId: string;
  currency: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeExpenditures = line.expenditures.filter((e) => !e.archived_at);
  const activeCommitments = line.commitments.filter((c) => !c.archived_at);
  const expenditureTotal = activeExpenditures.reduce((s, e) => s + e.amount, 0);
  const committedTotal = activeCommitments.reduce((s, c) => s + c.amount, 0);
  const remaining = budgetRemaining(line.amount, expenditureTotal, committedTotal);
  const utilization = budgetUtilization(expenditureTotal, line.amount);
  const severity = utilizationSeverity(utilization);

  return (
    <div className={`rounded-lg border bg-white p-4 ${line.archived_at ? "border-slate-100 opacity-60" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left font-medium text-slate-900 hover:underline">
            {line.line_name}
          </button>
          <p className="text-xs text-slate-500">
            {line.category ?? "Uncategorized"}
            {line.archived_at && " · Archived"}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-600">
            {formatMoney(expenditureTotal, currency)} / {formatMoney(line.amount, currency)}
          </p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLES[severity]}`}>
            {utilization != null ? `${utilization}%` : "0%"} utilized
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {editing ? (
            <form
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  const result = await updateBudgetLine(line.id, projectId, formData);
                  if (result.error) setError(result.error);
                  else {
                    setEditing(false);
                    router.refresh();
                  }
                });
              }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              <input name="line_name" defaultValue={line.line_name} required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              <input name="category" defaultValue={line.category ?? ""} placeholder="Category" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              <input name="amount" type="number" min={0} step="any" defaultValue={line.amount} required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
              <div className="col-span-full flex gap-2">
                <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                  Save
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-white">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Committed</p>
                  <p className="font-medium text-slate-800">{formatMoney(committedTotal, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="font-medium text-slate-800">{formatMoney(remaining, currency)}</p>
                </div>
              </div>

              {activeExpenditures.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Expenditures</p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-600">
                    {activeExpenditures.map((e) => (
                      <TransactionRow
                        key={e.id}
                        id={e.id}
                        description={e.description}
                        date={e.expense_date}
                        amount={e.amount}
                        currency={currency}
                        projectId={projectId}
                        canEdit={canEdit}
                        kind="expenditure"
                      />
                    ))}
                  </ul>
                </div>
              )}

              {activeCommitments.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Commitments</p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-600">
                    {activeCommitments.map((c) => (
                      <TransactionRow
                        key={c.id}
                        id={c.id}
                        description={c.description}
                        date={c.commitment_date}
                        amount={c.amount}
                        currency={currency}
                        projectId={projectId}
                        canEdit={canEdit}
                        kind="commitment"
                      />
                    ))}
                  </ul>
                </div>
              )}

              {canEdit && (line.expenditures.some((e) => e.archived_at) || line.commitments.some((c) => c.archived_at)) && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">Archived transactions</summary>
                  <ul className="mt-1 space-y-1 text-slate-500">
                    {line.expenditures
                      .filter((e) => e.archived_at)
                      .map((e) => (
                        <TransactionRow
                          key={e.id}
                          id={e.id}
                          description={e.description}
                          date={e.expense_date}
                          amount={e.amount}
                          currency={currency}
                          projectId={projectId}
                          canEdit={canEdit}
                          kind="expenditure"
                          isArchived
                        />
                      ))}
                    {line.commitments
                      .filter((c) => c.archived_at)
                      .map((c) => (
                        <TransactionRow
                          key={c.id}
                          id={c.id}
                          description={c.description}
                          date={c.commitment_date}
                          amount={c.amount}
                          currency={currency}
                          projectId={projectId}
                          canEdit={canEdit}
                          kind="commitment"
                          isArchived
                        />
                      ))}
                  </ul>
                </details>
              )}

              {canEdit && !line.archived_at && (
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

              {canEdit && (
                <div className="flex gap-3 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await archiveBudgetLine(line.id, projectId, !line.archived_at);
                        router.refresh();
                      })
                    }
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
                  >
                    {line.archived_at ? "Restore" : "Archive"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionRow({
  id,
  description,
  date,
  amount,
  currency,
  projectId,
  canEdit,
  kind,
  isArchived,
}: {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  currency: string;
  projectId: string;
  canEdit: boolean;
  kind: "expenditure" | "commitment";
  isArchived?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dateField = kind === "expenditure" ? "expense_date" : "commitment_date";
  const update = kind === "expenditure" ? updateExpenditure : updateCommitment;
  const archive = kind === "expenditure" ? archiveExpenditure : archiveCommitment;

  if (editing) {
    return (
      <li>
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await update(id, projectId, formData);
              if (result.error) setError(result.error);
              else {
                setEditing(false);
                router.refresh();
              }
            });
          }}
          className="flex flex-wrap items-center gap-1 rounded-md bg-slate-50 p-2"
        >
          <input name="amount" type="number" min={0} step="any" defaultValue={amount} required className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <input name={dateField} type="date" defaultValue={date} required className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <input name="description" defaultValue={description ?? ""} placeholder="Description" className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs" />
          <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
            Cancel
          </button>
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2">
      <span className="truncate">
        {description ?? "—"} ({date})
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {formatMoney(amount, currency)}
        {canEdit && !isArchived && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
              Edit
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await archive(id, projectId, true);
                  router.refresh();
                })
              }
              className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
            >
              Archive
            </button>
          </>
        )}
        {canEdit && isArchived && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archive(id, projectId, false);
                router.refresh();
              })
            }
            className="text-xs font-medium text-teal-700 hover:underline disabled:opacity-60"
          >
            Restore
          </button>
        )}
      </span>
    </li>
  );
}
