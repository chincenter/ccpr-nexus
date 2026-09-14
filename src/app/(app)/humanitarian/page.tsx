import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement, OPERATIONAL_ROLES } from "@/lib/auth";
import { DemoBadge, StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import { NeedsAssessmentForm } from "./NeedsAssessmentForm";
import { AssistancePlanForm } from "./AssistancePlanForm";
import { NeedsAssessmentRow } from "./NeedsAssessmentRow";
import { AssistancePlanRow } from "./AssistancePlanRow";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function HumanitarianPage({ searchParams }: PageProps<"/humanitarian">) {
  const params = await searchParams;
  const programmeFilter = typeof params.programme === "string" ? params.programme : "";
  const projectFilter = typeof params.project === "string" ? params.project : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const fromFilter = typeof params.from === "string" ? params.from : "";
  const toFilter = typeof params.to === "string" ? params.to : "";
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const role = staff?.system_role;
  const canEditPlanning = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(role!);
  const canCheck = !!staff && (role === "me_meal" || isManagement(role));
  const canApprove = isManagement(role);

  const [{ data: projects }, { data: locations }, { data: programmes }, { data: staffList }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, code, status, target_beneficiaries, programme:programmes!inner(id, name, category), officer:staff!projects_project_officer_id_fkey(full_name), locations:project_locations(location:locations(name))",
      )
      .eq("programme.category", "humanitarian")
      .is("archived_at", null)
      .order("code"),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
    supabase.from("programmes").select("id, name").eq("category", "humanitarian").is("archived_at", null).order("name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const projectList = projects ?? [];
  const projectIds = projectList.map((p) => p.id);

  const [{ data: assessments }, { data: plans }, { data: households }, { data: distributions }] = await Promise.all([
    projectIds.length
      ? supabase.from("needs_assessments").select("*, project:projects(name, code)").in("project_id", projectIds).order("assessment_date", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    projectIds.length
      ? supabase
          .from("assistance_plans")
          .select("*, project:projects(name, code), responsible:staff!assistance_plans_responsible_staff_id_fkey(full_name)")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    projectIds.length
      ? supabase.from("households").select("id, project_id").in("project_id", projectIds).is("archived_at", null)
      : Promise.resolve({ data: [] as never[] }),
    // Only the columns this page actually renders/aggregates — dropping unused
    // audit-trail columns reduces payload size across every distribution
    // org-wide, without touching the unique-household/beneficiary counting
    // logic below (which still needs every distribution_items row to stay correct).
    projectIds.length
      ? supabase
          .from("distributions")
          .select(
            "id, project_id, status, assistance_plan_id, assistance_type, distribution_date, notes, project:projects(id, name, code), location:locations(name), distribution_items(household_id, beneficiary_id, quantity, archived_at)",
          )
          .in("project_id", projectIds)
          .is("archived_at", null)
          // Filter archived distribution items in the query itself instead of
          // downloading every historical (archived) item and filtering in JS.
          .is("distribution_items.archived_at", null)
          .order("distribution_date", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const assessmentList = assessments ?? [];
  const planList = plans ?? [];
  const householdList = households ?? [];
  const distributionList = distributions ?? [];

  // "Reached" figures come from real distribution_items, never from a hard-coded
  // total. Cancelled distributions are excluded from every reached/delivered figure.
  const nonCancelled = distributionList.filter((d) => d.status !== "cancelled");
  const activeItemsOf = (d: (typeof distributionList)[number]) => d.distribution_items.filter((i) => !i.archived_at);

  const householdsByProject = new Map<string, number>();
  for (const h of householdList) householdsByProject.set(h.project_id, (householdsByProject.get(h.project_id) ?? 0) + 1);

  // Beneficiaries registered under any household that has been reached also count
  // as reached, even when a distribution was recorded at the household level only
  // (the only granularity the current data-entry form offers).
  const reachedHouseholdIdsAll = new Set(nonCancelled.flatMap((d) => activeItemsOf(d).map((i) => i.household_id).filter((v): v is string => !!v)));
  const { data: beneficiariesOfReached } = reachedHouseholdIdsAll.size
    ? await supabase.from("beneficiaries").select("id, household_id").in("household_id", Array.from(reachedHouseholdIdsAll)).is("archived_at", null)
    : { data: [] as { id: string; household_id: string }[] };

  function reachedFor(projectIds: string[], planId?: string) {
    const scoped = nonCancelled.filter((d) => projectIds.includes(d.project_id) && (planId == null || d.assistance_plan_id === planId));
    const items = scoped.flatMap(activeItemsOf);
    const householdsReached = new Set(items.map((i) => i.household_id).filter((v): v is string => !!v));
    const directBeneficiaries = new Set(items.map((i) => i.beneficiary_id).filter((v): v is string => !!v));
    const householdBeneficiaries = (beneficiariesOfReached ?? []).filter((b) => householdsReached.has(b.household_id)).map((b) => b.id);
    const beneficiariesReached = new Set([...directBeneficiaries, ...householdBeneficiaries]);
    const delivered = items.reduce((sum, i) => sum + Number(i.quantity), 0);
    return { householdsReached: householdsReached.size, beneficiariesReached: beneficiariesReached.size, delivered };
  }

  const allReach = reachedFor(projectList.map((p) => p.id));
  const targetBeneficiaries = projectList.reduce((sum, p) => sum + (p.target_beneficiaries ?? 0), 0);
  const targetHouseholds = planList.reduce((sum, p) => sum + (p.target_households ?? 0), 0);

  const activeAssessments = assessmentList.filter((a) => !a.archived_at);
  const activePlans = planList.filter((p) => !p.archived_at);
  const plannedDistributions = distributionList.filter((d) => d.status !== "cancelled");
  const completedDistributions = distributionList.filter((d) => d.status === "completed" || d.status === "verified");
  const distributionCompletion = safePercent(completedDistributions.length, plannedDistributions.length);
  const pendingVerification =
    assessmentList.filter((a) => !a.archived_at && (a.verification_status === "submitted" || a.verification_status === "under_review")).length +
    distributionList.filter((d) => d.status === "completed").length;

  // Assistance-type summary: planned (from plans) vs delivered (from real items), per type.
  const types = Array.from(new Set([...planList.map((p) => p.assistance_type), ...distributionList.map((d) => d.assistance_type)]));
  const typeSummary = types.map((type) => {
    const planned = planList.filter((p) => p.assistance_type === type).reduce((sum, p) => sum + (p.planned_quantity ?? 0), 0);
    const items = nonCancelled.filter((d) => d.assistance_type === type).flatMap(activeItemsOf);
    const delivered = items.reduce((sum, i) => sum + Number(i.quantity), 0);
    return { type, planned, delivered, achievement: safePercent(delivered, planned) };
  });

  // Filters + search apply to the Recent Distributions list only.
  const projectById = new Map(projectList.map((p) => [p.id, p]));
  const filteredDistributions = distributionList.filter((d) => {
    if (programmeFilter && projectById.get(d.project_id)?.programme.id !== programmeFilter) return false;
    if (projectFilter && d.project_id !== projectFilter) return false;
    if (typeFilter && d.assistance_type !== typeFilter) return false;
    if (fromFilter && d.distribution_date < fromFilter) return false;
    if (toFilter && d.distribution_date > toFilter) return false;
    if (q) {
      const haystack = [d.assistance_type, d.notes, d.project?.name, d.location?.name].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const recentDistributions = filteredDistributions.slice(0, 15);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Humanitarian</h1>
        <p className="text-sm text-slate-500">
          Needs assessments, household &amp; beneficiary registration, assistance plans and distributions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Active Projects" value={String(projectList.filter((p) => p.status === "active").length)} />
        <Kpi label="Households Reached" value={`${allReach.householdsReached}${targetHouseholds ? ` / ${targetHouseholds}` : ""}`} />
        <Kpi label="Beneficiaries Reached" value={`${allReach.beneficiariesReached}${targetBeneficiaries ? ` / ${targetBeneficiaries}` : ""}`} />
        <Kpi label="Assistance Delivered" value={allReach.delivered.toLocaleString()} />
        <Kpi label="Active Assessments" value={String(activeAssessments.length)} />
        <Kpi label="Pending Verification" value={String(pendingVerification)} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Projects</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Programme</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Reached</th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectList.map((p) => {
                const reach = reachedFor([p.id]);
                const progress = safePercent(reach.beneficiariesReached, p.target_beneficiaries);
                const projectLocations = (p.locations ?? []).map((l) => (l.location as { name: string } | null)?.name).filter(Boolean);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/humanitarian/${p.id}`} className="font-medium text-teal-800 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-400">{householdsByProject.get(p.id) ?? 0} households registered</p>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.programme.name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {projectLocations.length === 0 ? "—" : projectLocations.length === 1 ? projectLocations[0] : `${projectLocations[0]} +${projectLocations.length - 1} more`}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.target_beneficiaries?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{reach.beneficiariesReached.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-600">{progress != null ? `${progress}%` : "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.officer?.full_name ?? "Unassigned"}</td>
                  </tr>
                );
              })}
              {projectList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-slate-500">No humanitarian projects yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Assistance summary</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Assistance type</th>
                <th className="px-4 py-2">Planned</th>
                <th className="px-4 py-2">Delivered</th>
                <th className="px-4 py-2">Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {typeSummary.map((t) => (
                <tr key={t.type} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-800">{t.type}</td>
                  <td className="px-4 py-2 text-slate-600">{t.planned.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">{t.delivered.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">{t.achievement != null ? `${t.achievement}%` : "—"}</td>
                </tr>
              ))}
              {typeSummary.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-slate-500">No assistance recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Distribution completion: {distributionCompletion != null ? `${distributionCompletion}%` : "—"} ({completedDistributions.length} of {plannedDistributions.length} non-cancelled distributions)
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent distributions</h2>
        </div>
        <form className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <input name="q" defaultValue={q} placeholder="Search project, notes, location…" className="rounded-md border border-slate-300 px-2 py-1.5" />
          <select name="programme" defaultValue={programmeFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All programmes</option>
            {(programmes ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="project" defaultValue={projectFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All projects</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="type" defaultValue={typeFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All assistance types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={fromFilter} className="rounded-md border border-slate-300 px-2 py-1.5" />
          <input name="to" type="date" defaultValue={toFilter} className="rounded-md border border-slate-300 px-2 py-1.5" />
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Filter</button>
        </form>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Assistance</th>
                <th className="px-4 py-2">Households</th>
                <th className="px-4 py-2">Beneficiaries</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDistributions.map((d) => {
                const items = activeItemsOf(d);
                const hh = new Set(items.map((i) => i.household_id).filter(Boolean)).size;
                const ben = new Set(items.map((i) => i.beneficiary_id).filter(Boolean)).size;
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/humanitarian/${d.project_id}`} className="font-medium text-teal-800 hover:underline">
                        {d.project?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{d.location?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{d.distribution_date}</td>
                    <td className="px-4 py-2 text-slate-600">{d.assistance_type}</td>
                    <td className="px-4 py-2 text-slate-600">{hh}</td>
                    <td className="px-4 py-2 text-slate-600">{ben}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                );
              })}
              {recentDistributions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-slate-500">No distributions match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Needs assessments</h2>
        <div className="mt-3 space-y-3">
          {canEditPlanning && <NeedsAssessmentForm projects={projectList.map((p) => ({ id: p.id, name: p.name }))} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date / type</th>
                  <th className="px-4 py-2">Population</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Needs</th>
                  <th className="px-4 py-2">Verification</th>
                  {canEditPlanning && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAssessments.map((a) => (
                  <NeedsAssessmentRow key={a.id} assessment={a} canEdit={canEditPlanning} canCheck={canCheck} canApprove={canApprove} locations={locations ?? []} />
                ))}
              </tbody>
            </table>
            {activeAssessments.length === 0 && <p className="p-4 text-sm text-slate-500">No needs assessments recorded yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Assistance plans</h2>
        <div className="mt-3 space-y-3">
          {canEditPlanning && (
            <AssistancePlanForm projects={projectList.map((p) => ({ id: p.id, name: p.name }))} locations={locations ?? []} staff={staffList ?? []} />
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Delivered / Planned</th>
                  <th className="px-4 py-2">Status</th>
                  {canEditPlanning && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePlans.map((p) => {
                  const reach = reachedFor([p.project_id], p.id);
                  return (
                    <AssistancePlanRow
                      key={p.id}
                      plan={{ ...p, deliveredQuantity: reach.delivered, householdsReached: reach.householdsReached, beneficiariesReached: reach.beneficiariesReached }}
                      canEdit={canEditPlanning}
                      locations={locations ?? []}
                      staff={staffList ?? []}
                    />
                  );
                })}
              </tbody>
            </table>
            {activePlans.length === 0 && <p className="p-4 text-sm text-slate-500">No assistance plans recorded yet.</p>}
          </div>
        </div>
      </div>

      {(assessmentList.some((a) => a.is_demo) || projectList.some((p) => (p as { is_demo?: boolean }).is_demo)) && <DemoBadge />}
    </div>
  );
}
