import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { budgetUtilization, utilizationSeverity } from "@/lib/calculations";

const SEVERITY_STYLES: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export default async function FinancePage() {
  const supabase = await createClient();

  const { data: budgets } = await supabase
    .from("budgets")
    .select(
      "*, project:projects(id, name, code), budget_lines(amount, expenditures(amount), commitments(amount))",
    )
    .is("archived_at", null);

  const rows = (budgets ?? []).map((b) => {
    const lines = (b.budget_lines ?? []) as { amount: number; expenditures: { amount: number }[]; commitments: { amount: number }[] }[];
    const expenditure = lines.reduce((sum, l) => sum + l.expenditures.reduce((s, e) => s + e.amount, 0), 0);
    const committed = lines.reduce((sum, l) => sum + l.commitments.reduce((s, c) => s + c.amount, 0), 0);
    const utilization = budgetUtilization(expenditure, b.approved_budget);
    return { ...b, expenditure, committed, utilization, severity: utilizationSeverity(utilization) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500">
          Programme/project budget monitoring — not a full accounting system. Visible to Finance,
          management, and each project&apos;s own operational team.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Approved Budget</th>
              <th className="px-4 py-2">Expenditure</th>
              <th className="px-4 py-2">Committed</th>
              <th className="px-4 py-2">Remaining</th>
              <th className="px-4 py-2">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const project = row.project as { id: string; name: string; code: string } | null;
              const remaining = row.approved_budget - row.expenditure - row.committed;
              return (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    {project && (
                      <Link href={`/finance/${project.id}`} className="font-medium text-teal-800 hover:underline">
                        {project.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">${row.approved_budget.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">${row.expenditure.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">${row.committed.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">${remaining.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLES[row.severity]}`}>
                      {row.utilization != null ? `${row.utilization}%` : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-slate-500">No budgets recorded yet.</p>}
      </div>
    </div>
  );
}
