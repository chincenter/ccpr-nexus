import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { budgetUtilization, budgetRemaining, utilizationSeverity, formatMoney } from "@/lib/calculations";

const SEVERITY_STYLES: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  const params = await searchParams;
  const programmeFilter = typeof params.programme === "string" ? params.programme : "";
  const projectFilter = typeof params.project === "string" ? params.project : "";
  const severityFilter = typeof params.severity === "string" ? params.severity : "";

  const supabase = await createClient();

  const [{ data: budgets }, { data: programmes }, { data: projects }] = await Promise.all([
    supabase
      .from("budgets")
      .select(
        "*, project:projects(id, name, code, programme_id), budget_lines(amount, archived_at, expenditures(amount, archived_at), commitments(amount, archived_at))",
      )
      .is("archived_at", null),
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase.from("projects").select("id, name, programme_id").is("archived_at", null).order("name"),
  ]);

  const rows = (budgets ?? []).map((b) => {
    const project = b.project as { id: string; name: string; code: string; programme_id: string } | null;
    const lines = (b.budget_lines ?? []).filter((l) => !l.archived_at);
    const expenditure = lines.reduce(
      (sum, l) => sum + l.expenditures.filter((e) => !e.archived_at).reduce((s, e) => s + e.amount, 0),
      0,
    );
    const committed = lines.reduce(
      (sum, l) => sum + l.commitments.filter((c) => !c.archived_at).reduce((s, c) => s + c.amount, 0),
      0,
    );
    const utilization = budgetUtilization(expenditure, b.approved_budget);
    const remaining = budgetRemaining(b.approved_budget, expenditure, committed);
    return { ...b, project, expenditure, committed, remaining, utilization, severity: utilizationSeverity(utilization) };
  });

  const filtered = rows.filter((row) => {
    if (programmeFilter && row.project?.programme_id !== programmeFilter) return false;
    if (projectFilter && row.project?.id !== projectFilter) return false;
    if (severityFilter && row.severity !== severityFilter) return false;
    return true;
  });

  // Never silently sum different currencies together — group per currency instead.
  const currencies = Array.from(new Set(filtered.map((r) => r.currency)));
  const totalsByCurrency = currencies.map((currency) => {
    const rowsInCurrency = filtered.filter((r) => r.currency === currency);
    const approved = rowsInCurrency.reduce((sum, r) => sum + r.approved_budget, 0);
    const expenditure = rowsInCurrency.reduce((sum, r) => sum + r.expenditure, 0);
    const committed = rowsInCurrency.reduce((sum, r) => sum + r.committed, 0);
    return {
      currency,
      approved,
      expenditure,
      committed,
      available: approved - expenditure - committed,
      utilization: budgetUtilization(expenditure, approved),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500">
          Programme/project budget monitoring — not a full accounting system. Visible to Finance,
          M&amp;E/MEAL, management, and each project&apos;s own operational team.
        </p>
      </div>

      {totalsByCurrency.map((t) => (
        <div key={t.currency}>
          {totalsByCurrency.length > 1 && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{t.currency}</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="Total Budget" value={formatMoney(t.approved, t.currency)} />
            <SummaryStat label="Expenditure" value={formatMoney(t.expenditure, t.currency)} />
            <SummaryStat label="Committed" value={formatMoney(t.committed, t.currency)} />
            <SummaryStat label="Available" value={formatMoney(t.available, t.currency)} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Overall utilization: {t.utilization != null ? `${t.utilization}%` : "—"}
          </p>
        </div>
      ))}
      {totalsByCurrency.length === 0 && <p className="text-sm text-slate-500">No budgets match this filter.</p>}
      {totalsByCurrency.length > 1 && (
        <p className="text-xs text-amber-700">
          Projects use more than one currency — totals are shown separately per currency rather than combined.
        </p>
      )}

      <form className="flex flex-wrap items-center gap-2 text-sm">
        <select name="programme" defaultValue={programmeFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All programmes</option>
          {(programmes ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="project" defaultValue={projectFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All projects</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="severity" defaultValue={severityFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All utilization levels</option>
          <option value="ok">On track</option>
          <option value="warning">Approaching limit</option>
          <option value="critical">At or over budget</option>
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Approved Budget</th>
              <th className="px-4 py-2">Expenditure</th>
              <th className="px-4 py-2">Committed</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  {row.project && (
                    <Link href={`/finance/${row.project.id}`} className="font-medium text-teal-800 hover:underline">
                      {row.project.name}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{formatMoney(row.approved_budget, row.currency)}</td>
                <td className="px-4 py-2 text-slate-600">{formatMoney(row.expenditure, row.currency)}</td>
                <td className="px-4 py-2 text-slate-600">{formatMoney(row.committed, row.currency)}</td>
                <td className="px-4 py-2 text-slate-600">{formatMoney(row.remaining, row.currency)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLES[row.severity]}`}>
                    {row.utilization != null ? `${row.utilization}%` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-sm text-slate-500">No budgets match this filter.</p>}
      </div>
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
