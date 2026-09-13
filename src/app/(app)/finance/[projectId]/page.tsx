import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { budgetUtilization, budgetRemaining, utilizationSeverity, formatMoney, safePercent } from "@/lib/calculations";
import { CreateBudgetForm } from "./CreateBudgetForm";
import { BudgetEditForm } from "./BudgetEditForm";
import { BudgetLineCard } from "./BudgetLineCard";
import { NewLineForm } from "./NewLineForm";

const SEVERITY_STYLES: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export default async function ProjectFinancePage({ params }: PageProps<"/finance/[projectId]">) {
  const { projectId } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();

  const { data: project } = await supabase.from("projects").select("id, name, code").eq("id", projectId).maybeSingle();
  if (!project) notFound();

  const [{ data: budget }, { data: activities }] = await Promise.all([
    supabase
      .from("budgets")
      .select("*, budget_lines(*, expenditures(*), commitments(*))")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase.from("activities").select("id, status").eq("project_id", projectId).is("archived_at", null),
  ]);

  const canEdit = !!staff && (staff.system_role === "finance" || staff.system_role === "super_admin" || staff.system_role === "executive");

  const completedActivities = (activities ?? []).filter((a) => a.status === "completed").length;
  const projectProgress = safePercent(completedActivities, (activities ?? []).length);

  const allLines = budget?.budget_lines ?? [];
  const activeLines = allLines.filter((l) => !l.archived_at);
  const archivedLines = allLines.filter((l) => l.archived_at);

  const expenditureTotal = activeLines.reduce(
    (sum, l) => sum + l.expenditures.filter((e) => !e.archived_at).reduce((s, e) => s + e.amount, 0),
    0,
  );
  const committedTotal = activeLines.reduce(
    (sum, l) => sum + l.commitments.filter((c) => !c.archived_at).reduce((s, c) => s + c.amount, 0),
    0,
  );
  const approvedTotal = budget?.approved_budget ?? 0;
  const remaining = budget ? budgetRemaining(approvedTotal, expenditureTotal, committedTotal) : 0;
  const utilization = budget ? budgetUtilization(expenditureTotal, approvedTotal) : null;
  const severity = utilizationSeverity(utilization);
  const currency = budget?.currency ?? "USD";

  const recentExpenditure = allLines
    .flatMap((l) => l.expenditures.filter((e) => !e.archived_at).map((e) => ({ ...e, lineName: l.line_name })))
    .sort((a, b) => b.expense_date.localeCompare(a.expense_date))
    .slice(0, 8);

  const variance = utilization != null && projectProgress != null ? Math.round(utilization - projectProgress) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500">{project.code}</p>
        <h1 className="text-xl font-semibold text-slate-900">{project.name} — Finance</h1>
      </div>

      {!budget ? (
        canEdit ? (
          <CreateBudgetForm projectId={project.id} />
        ) : (
          <p className="text-sm text-slate-500">No budget has been set up for this project yet.</p>
        )
      ) : (
        <>
          <BudgetEditForm budget={budget} projectId={project.id} canEdit={canEdit} />

          {budget.archived_at && (
            <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
              This budget is archived and excluded from active Finance totals.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="Approved Budget" value={formatMoney(approvedTotal, currency)} />
            <SummaryStat label="Expenditure" value={formatMoney(expenditureTotal, currency)} />
            <SummaryStat label="Committed" value={formatMoney(committedTotal, currency)} />
            <SummaryStat label="Available" value={formatMoney(remaining, currency)} />
          </div>
          {budget.revised_budget != null && (
            <p className="text-xs text-slate-500">
              Revised budget: {formatMoney(budget.revised_budget, currency)} (originally {formatMoney(budget.approved_budget, currency)})
            </p>
          )}
          {budget.notes && <p className="text-xs text-slate-500">{budget.notes}</p>}

          <div className={`rounded-lg p-3 text-sm ring-1 ring-inset ${SEVERITY_STYLES[severity]}`}>
            {utilization != null ? `${utilization}% of approved budget utilized.` : "No expenditure recorded yet."}
            {severity === "critical" && " Budget has been fully utilized or exceeded."}
            {severity === "warning" && " Approaching the approved budget limit."}
          </div>

          {projectProgress != null && utilization != null && (
            <p className="text-xs text-slate-500">
              Project progress {projectProgress}% vs. budget utilization {utilization}%
              {variance != null && variance !== 0 && (
                <> — spending is {variance > 0 ? "ahead of" : "behind"} implementation by {Math.abs(variance)} percentage points.</>
              )}
              {" "}This is a simple management indicator, not a financial accounting variance.
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Budget Lines</h2>
              {canEdit && <NewLineForm budgetId={budget.id} projectId={project.id} />}
            </div>
            {activeLines.map((line) => (
              <BudgetLineCard key={line.id} line={line} projectId={project.id} currency={currency} canEdit={canEdit} />
            ))}
            {activeLines.length === 0 && (
              <p className="text-sm text-slate-500">No budget lines yet.</p>
            )}
            {archivedLines.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-xs font-medium text-slate-500">
                  Archived budget lines ({archivedLines.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {archivedLines.map((line) => (
                    <BudgetLineCard key={line.id} line={line} projectId={project.id} currency={currency} canEdit={canEdit} />
                  ))}
                </div>
              </details>
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Expenditure</h2>
            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Budget Line</th>
                    <th className="px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentExpenditure.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 text-slate-600">{e.expense_date}</td>
                      <td className="px-4 py-2 text-slate-600">{e.description ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{e.lineName}</td>
                      <td className="px-4 py-2 text-slate-800">{formatMoney(e.amount, currency)}</td>
                    </tr>
                  ))}
                  {recentExpenditure.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                        No expenditure recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
