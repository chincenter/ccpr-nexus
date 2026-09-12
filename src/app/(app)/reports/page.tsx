import { createClient } from "@/lib/supabase/server";
import { safePercent, achievementLabel, budgetUtilization } from "@/lib/calculations";
import { CsvDownloadButton } from "@/components/reports/CsvDownloadButton";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: activities }, { data: indicators }, { data: budgets }] = await Promise.all([
    supabase.from("projects").select("*, programme:programmes(name), officer:staff!projects_project_officer_id_fkey(full_name)").is("archived_at", null),
    supabase.from("activities").select("id, project_id, status").is("archived_at", null),
    supabase.from("indicators").select("*, project:projects(name), programme:programmes(name)").is("archived_at", null),
    supabase.from("budgets").select("*, project:projects(name), budget_lines(amount, expenditures(amount), commitments(amount))").is("archived_at", null),
  ]);

  const activitiesByProject = new Map<string, { status: string }[]>();
  for (const a of activities ?? []) {
    const list = activitiesByProject.get(a.project_id) ?? [];
    list.push(a);
    activitiesByProject.set(a.project_id, list);
  }

  const projectRows = (projects ?? []).map((p) => {
    const acts = activitiesByProject.get(p.id) ?? [];
    const completed = acts.filter((a) => a.status === "completed").length;
    const progress = safePercent(completed, acts.length);
    return [
      p.code,
      p.name,
      (p.programme as { name: string } | null)?.name ?? "",
      (p.officer as { full_name: string } | null)?.full_name ?? "",
      p.status,
      progress != null ? `${progress}%` : "",
      p.budget ?? "",
      p.target_beneficiaries ?? "",
    ];
  });

  const indicatorRows = (indicators ?? []).map((i) => {
    const pct = safePercent(i.actual, i.target);
    return [
      i.name,
      (i.project as { name: string } | null)?.name ?? (i.programme as { name: string } | null)?.name ?? "",
      i.baseline ?? "",
      i.target ?? "",
      i.actual ?? "",
      pct != null ? `${pct}%` : "",
      achievementLabel(pct),
      i.verification_status,
    ];
  });

  const financeRows = (budgets ?? []).map((b) => {
    const lines = (b.budget_lines ?? []) as { amount: number; expenditures: { amount: number }[]; commitments: { amount: number }[] }[];
    const expenditure = lines.reduce((sum, l) => sum + l.expenditures.reduce((s, e) => s + e.amount, 0), 0);
    const committed = lines.reduce((sum, l) => sum + l.commitments.reduce((s, c) => s + c.amount, 0), 0);
    const utilization = budgetUtilization(expenditure, b.approved_budget);
    return [
      (b.project as { name: string } | null)?.name ?? "",
      b.approved_budget,
      expenditure,
      committed,
      b.approved_budget - expenditure - committed,
      utilization != null ? `${utilization}%` : "",
    ];
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">
          Pulled live from the same connected data as the rest of the system — nothing here is
          typed in separately. Each table can be downloaded as CSV.
        </p>
      </div>

      <ReportSection
        title="Project Summary"
        headers={["Code", "Project", "Programme", "Officer", "Status", "Progress", "Budget", "Target Beneficiaries"]}
        rows={projectRows}
        filename="project-summary.csv"
      />

      <ReportSection
        title="M&E Summary"
        headers={["Indicator", "Programme/Project", "Baseline", "Target", "Actual", "Achievement", "Status", "Verification"]}
        rows={indicatorRows}
        filename="me-summary.csv"
      />

      <ReportSection
        title="Financial Summary"
        headers={["Project", "Approved Budget", "Expenditure", "Committed", "Remaining", "Utilization"]}
        rows={financeRows}
        filename="financial-summary.csv"
      />
    </div>
  );
}

function ReportSection({
  title,
  headers,
  rows,
  filename,
}: {
  title: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  filename: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <CsvDownloadButton filename={filename} headers={headers} rows={rows} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-4 py-2 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-slate-500">No data yet.</p>}
      </div>
    </div>
  );
}
