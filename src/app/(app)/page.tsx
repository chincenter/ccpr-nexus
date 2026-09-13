import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { safePercent, budgetUtilization } from "@/lib/calculations";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { getManagementAlerts } from "@/lib/alerts";

const CATEGORY_LABELS: Record<string, string> = {
  humanitarian: "Humanitarian",
  mine_action: "Landmine / Mine Action",
  health: "Health",
  governance: "Governance",
  peacebuilding: "Peacebuilding",
  research_policy: "Research / Policy",
  other: "Other",
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: programmes },
    { data: projects },
    { data: activities },
    { data: beneficiaries },
    { data: coveredLocations },
    { data: budgets },
    alerts,
  ] = await Promise.all([
    supabase.from("programmes").select("*").is("archived_at", null),
    supabase.from("projects").select("*").is("archived_at", null),
    supabase.from("activities").select("id, project_id, status").is("archived_at", null),
    supabase.from("beneficiaries").select("id").is("archived_at", null),
    supabase.from("project_locations").select("location_id"),
    supabase
      .from("budgets")
      .select("id, project_id, approved_budget, budget_lines(expenditures(amount))")
      .is("archived_at", null),
    getManagementAlerts(supabase),
  ]);

  const programmeList = programmes ?? [];
  const projectList = projects ?? [];
  const activityList = activities ?? [];

  const activeProgrammes = programmeList.filter((p) => p.status === "active").length;
  const activeProjects = projectList.filter((p) => p.status === "active").length;
  const totalBeneficiaries = projectList.reduce((sum, p) => sum + (p.target_beneficiaries ?? 0), 0);
  const beneficiariesReached = (beneficiaries ?? []).length;
  const locationsCovered = new Set((coveredLocations ?? []).map((l) => l.location_id)).size;
  const approvedBudget = projectList.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const completedActivities = activityList.filter((a) => a.status === "completed").length;
  const ongoingActivities = activityList.filter((a) => a.status === "ongoing").length;
  const delayedActivities = activityList.filter((a) => a.status === "delayed").length;
  const overallProgress = safePercent(completedActivities, activityList.length);

  const budgetByProject = new Map<string, { approved: number; expenditure: number }>();
  for (const b of budgets ?? []) {
    const lines = (b.budget_lines ?? []) as { expenditures: { amount: number }[] }[];
    const expenditure = lines.reduce((sum, l) => sum + l.expenditures.reduce((s, e) => s + e.amount, 0), 0);
    budgetByProject.set(b.project_id, { approved: b.approved_budget, expenditure });
  }
  const totalExpenditure = [...budgetByProject.values()].reduce((sum, b) => sum + b.expenditure, 0);

  const projectsByProgramme = new Map<string, typeof projectList>();
  for (const project of projectList) {
    const list = projectsByProgramme.get(project.programme_id) ?? [];
    list.push(project);
    projectsByProgramme.set(project.programme_id, list);
  }

  const activitiesByProject = new Map<string, typeof activityList>();
  for (const activity of activityList) {
    const list = activitiesByProject.get(activity.project_id) ?? [];
    list.push(activity);
    activitiesByProject.set(activity.project_id, list);
  }

  const staffIds = programmeList.map((p) => p.lead_staff_id).filter((v): v is string => !!v);
  const { data: leads } = staffIds.length
    ? await supabase.from("staff").select("id, full_name").in("id", staffIds)
    : { data: [] };
  const leadNameById = new Map((leads ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Live figures from connected programme data.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Active Programmes" value={String(activeProgrammes)} />
        <Kpi label="Active Projects" value={String(activeProjects)} />
        <Kpi label="Target Beneficiaries" value={totalBeneficiaries.toLocaleString()} />
        <Kpi label="Beneficiaries Reached" value={beneficiariesReached.toLocaleString()} />
        <Kpi label="Locations Covered" value={String(locationsCovered)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kpi label="Approved Budget" value={`$${approvedBudget.toLocaleString()}`} />
        <Kpi label="Total Expenditure" value={`$${totalExpenditure.toLocaleString()}`} />
        <Kpi label="Overall Progress" value={overallProgress != null ? `${overallProgress}%` : "—"} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Activities Completed" value={String(completedActivities)} />
        <Kpi label="Activities Ongoing" value={String(ongoingActivities)} />
        <Kpi label="Activities Delayed" value={String(delayedActivities)} />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Management alerts</p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-800">
            {alerts.map((alert, i) => (
              <li key={i} className={alert.severity === "critical" ? "text-red-800" : undefined}>
                <Link href={alert.href} className="underline">
                  {alert.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-900">Programmes</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {programmeList.map((programme) => {
            const progProjects = projectsByProgramme.get(programme.id) ?? [];
            const progActivities = progProjects.flatMap((p) => activitiesByProject.get(p.id) ?? []);
            const progCompleted = progActivities.filter((a) => a.status === "completed").length;
            const progProgress = safePercent(progCompleted, progActivities.length);
            const progBudget = progProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
            const progBeneficiaries = progProjects.reduce((sum, p) => sum + (p.target_beneficiaries ?? 0), 0);
            const progExpenditure = progProjects.reduce((sum, p) => sum + (budgetByProject.get(p.id)?.expenditure ?? 0), 0);
            const progApprovedBudget = progProjects.reduce((sum, p) => sum + (budgetByProject.get(p.id)?.approved ?? 0), 0);
            const progUtilization = budgetUtilization(progExpenditure, progApprovedBudget);

            return (
              <Link
                key={programme.id}
                href={`/programmes/${programme.id}`}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{programme.code}</p>
                    <h3 className="font-semibold text-slate-900">{programme.name}</h3>
                    <p className="text-xs text-slate-500">{CATEGORY_LABELS[programme.category]}</p>
                  </div>
                  <StatusBadge status={programme.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Lead: {leadNameById.get(programme.lead_staff_id ?? "") ?? "Unassigned"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span>{progProjects.length} projects</span>
                  <span>{progBeneficiaries.toLocaleString()} target reached</span>
                  <span>${progBudget.toLocaleString()} budget</span>
                  <span>{progProgress != null ? `${progProgress}% progress` : "No activities yet"}</span>
                  <span>{progUtilization != null ? `${progUtilization}% budget utilized` : "No expenditure yet"}</span>
                </div>
                {programme.is_demo && <div className="mt-3"><DemoBadge /></div>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
