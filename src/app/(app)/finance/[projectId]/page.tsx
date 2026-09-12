import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { budgetUtilization, budgetRemaining, utilizationSeverity } from "@/lib/calculations";
import { CreateBudgetForm } from "./CreateBudgetForm";
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

  const { data: budget } = await supabase
    .from("budgets")
    .select("*, budget_lines(*, expenditures(*), commitments(*))")
    .eq("project_id", projectId)
    .maybeSingle();

  const canEdit = !!staff && (staff.system_role === "finance" || staff.system_role === "super_admin" || staff.system_role === "executive");

  const lines = (budget?.budget_lines ?? []) as Array<{ amount: number; expenditures: { amount: number }[]; commitments: { amount: number }[] }>;
  const expenditureTotal = lines.reduce((sum, l) => sum + l.expenditures.reduce((s, e) => s + e.amount, 0), 0);
  const committedTotal = lines.reduce((sum, l) => sum + l.commitments.reduce((s, c) => s + c.amount, 0), 0);
  const remaining = budget ? budgetRemaining(budget.approved_budget, expenditureTotal, committedTotal) : 0;
  const utilization = budget ? budgetUtilization(expenditureTotal, budget.approved_budget) : null;
  const severity = utilizationSeverity(utilization);

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="Approved Budget" value={`$${budget.approved_budget.toLocaleString()}`} />
            <SummaryStat label="Expenditure" value={`$${expenditureTotal.toLocaleString()}`} />
            <SummaryStat label="Committed" value={`$${committedTotal.toLocaleString()}`} />
            <SummaryStat label="Remaining" value={`$${remaining.toLocaleString()}`} />
          </div>

          <div className={`rounded-lg p-3 text-sm ring-1 ring-inset ${SEVERITY_STYLES[severity]}`}>
            {utilization != null ? `${utilization}% of approved budget utilized.` : "No expenditure recorded yet."}
            {severity === "critical" && " Budget has been fully utilized or exceeded."}
            {severity === "warning" && " Approaching the approved budget limit."}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Budget Lines</h2>
              {canEdit && <NewLineForm budgetId={budget.id} projectId={project.id} />}
            </div>
            {(budget.budget_lines ?? []).map((line) => (
              <BudgetLineCard key={line.id} line={line} projectId={project.id} canEdit={canEdit} />
            ))}
            {(budget.budget_lines ?? []).length === 0 && (
              <p className="text-sm text-slate-500">No budget lines yet.</p>
            )}
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
