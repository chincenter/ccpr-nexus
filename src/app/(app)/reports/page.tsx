import { createClient } from "@/lib/supabase/server";
import { safePercent, achievementLabel, budgetUtilization } from "@/lib/calculations";
import { CsvDownloadButton } from "@/components/reports/CsvDownloadButton";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [
    { data: programmes },
    { data: projects },
    { data: activities },
    { data: indicators },
    { data: budgets },
    { data: beneficiaries },
    { data: distributions },
    { data: hazards },
    { data: outreach },
    { data: governanceActions },
  ] = await Promise.all([
    supabase.from("programmes").select("*").is("archived_at", null),
    supabase.from("projects").select("*, programme:programmes(name), officer:staff!projects_project_officer_id_fkey(full_name)").is("archived_at", null),
    supabase.from("activities").select("id, project_id, status").is("archived_at", null),
    supabase.from("indicators").select("*, project:projects(name), programme:programmes(name)").is("archived_at", null),
    supabase.from("budgets").select("*, project:projects(name), budget_lines(amount, expenditures(amount), commitments(amount))").is("archived_at", null),
    supabase.from("beneficiaries").select("*, household:households(household_code, project:projects(name))").is("archived_at", null),
    supabase
      .from("distributions")
      .select("*, project:projects(name), distribution_items(quantity)")
      .order("distribution_date", { ascending: false }),
    supabase
      .from("mine_hazards")
      .select("*, project:projects(name), programme:programmes(name)")
      .is("archived_at", null),
    supabase
      .from("health_outreach")
      .select("*, project:projects(name), facility:health_facilities(name)")
      .is("archived_at", null),
    supabase
      .from("governance_actions")
      .select("*, project:projects(name), programme:programmes(name), responsible:staff!governance_actions_responsible_staff_id_fkey(full_name)")
      .is("archived_at", null),
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
      p.donor ?? "",
      (p.officer as { full_name: string } | null)?.full_name ?? "",
      p.status,
      progress != null ? `${progress}%` : "",
      p.budget ?? "",
      p.target_beneficiaries ?? "",
    ];
  });

  const beneficiaryRows = (beneficiaries ?? []).map((b) => {
    const household = b.household as { household_code: string; project: { name: string } | null } | null;
    return [
      b.beneficiary_code,
      household?.household_code ?? "",
      household?.project?.name ?? "",
      b.age_group,
      b.gender ?? "",
      b.vulnerability_category ?? "",
    ];
  });

  const humanitarianRows = (distributions ?? []).map((d) => {
    const items = (d.distribution_items ?? []) as { quantity: number }[];
    const totalQuantity = items.reduce((sum, i) => sum + Number(i.quantity), 0);
    return [
      (d.project as { name: string } | null)?.name ?? "",
      d.distribution_date,
      d.assistance_type,
      d.unit ?? "",
      totalQuantity,
      items.length,
    ];
  });

  const mineActionRows = (hazards ?? []).map((h) => [
    h.hazard_code,
    (h.project as { name: string } | null)?.name ?? (h.programme as { name: string } | null)?.name ?? "",
    h.hazard_type,
    h.risk_level,
    h.status,
    h.verification_status,
    h.date_identified,
  ]);

  const healthRows = (outreach ?? []).map((o) => [
    (o.project as { name: string } | null)?.name ?? "",
    (o.facility as { name: string } | null)?.name ?? "",
    o.outreach_date,
    o.activity_description ?? "",
    o.people_served ?? "",
    o.male_served ?? "",
    o.female_served ?? "",
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const governanceRows = (governanceActions ?? []).map((a) => [
    (a.project as { name: string } | null)?.name ?? (a.programme as { name: string } | null)?.name ?? "",
    a.action_description,
    a.responsible?.full_name ?? "",
    a.due_date ?? "",
    a.status,
    a.due_date && a.due_date < today && !["completed", "cancelled"].includes(a.status) ? "Yes" : "No",
  ]);

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

  const expenditureByProject = new Map<string, number>();
  for (const b of budgets ?? []) {
    const lines = (b.budget_lines ?? []) as { expenditures: { amount: number }[] }[];
    expenditureByProject.set(b.project_id, lines.reduce((sum, l) => sum + l.expenditures.reduce((s, e) => s + e.amount, 0), 0));
  }

  const managementRows = (programmes ?? []).map((programme) => {
    const progProjects = (projects ?? []).filter((p) => p.programme_id === programme.id);
    const progActs = progProjects.flatMap((p) => activitiesByProject.get(p.id) ?? []);
    const progCompleted = progActs.filter((a) => a.status === "completed").length;
    const progProgress = safePercent(progCompleted, progActs.length);
    const progBudget = progProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
    const progExpenditure = progProjects.reduce((sum, p) => sum + (expenditureByProject.get(p.id) ?? 0), 0);
    const progUtilization = budgetUtilization(progExpenditure, progBudget);
    return [
      programme.name,
      programme.category,
      programme.status,
      progProjects.length,
      progBudget,
      progExpenditure,
      progUtilization != null ? `${progUtilization}%` : "",
      progProgress != null ? `${progProgress}%` : "",
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
        headers={["Code", "Project", "Programme", "Donor", "Officer", "Status", "Progress", "Budget", "Target Beneficiaries"]}
        rows={projectRows}
        filename="project-summary.csv"
      />

      <ReportSection
        title="Management Report"
        headers={["Programme", "Category", "Status", "Projects", "Budget", "Expenditure", "Utilization", "Progress"]}
        rows={managementRows}
        filename="management-report.csv"
      />

      <ReportSection
        title="Beneficiary Report"
        headers={["Beneficiary", "Household", "Project", "Age Group", "Gender", "Vulnerability"]}
        rows={beneficiaryRows}
        filename="beneficiary-report.csv"
      />

      <ReportSection
        title="Humanitarian Report"
        headers={["Project", "Distribution Date", "Assistance Type", "Unit", "Total Quantity", "Recipients"]}
        rows={humanitarianRows}
        filename="humanitarian-report.csv"
      />

      <ReportSection
        title="Mine Action Report"
        headers={["Hazard", "Project/Programme", "Type", "Risk Level", "Status", "Verification", "Date Identified"]}
        rows={mineActionRows}
        filename="mine-action-report.csv"
      />

      <ReportSection
        title="Health Report"
        headers={["Project", "Facility", "Date", "Activity", "People Served", "Male", "Female"]}
        rows={healthRows}
        filename="health-report.csv"
      />

      <ReportSection
        title="Governance Report"
        headers={["Project/Programme", "Action", "Responsible", "Due Date", "Status", "Overdue"]}
        rows={governanceRows}
        filename="governance-report.csv"
      />

      <ReportSection
        title="M&E Summary"
        headers={["Indicator", "Programme/Project", "Baseline", "Target", "Actual", "Achievement", "Status", "Verification"]}
        rows={indicatorRows}
        filename="me-summary.csv"
      />

      <ReportSection
        title="Financial Monitoring Report"
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
