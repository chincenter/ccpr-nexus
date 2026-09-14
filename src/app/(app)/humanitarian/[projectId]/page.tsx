import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement, OPERATIONAL_ROLES } from "@/lib/auth";
import { safePercent, budgetUtilization, formatMoney } from "@/lib/calculations";
import { NeedsAssessmentForm } from "../NeedsAssessmentForm";
import { NeedsAssessmentRow } from "../NeedsAssessmentRow";
import { AssistancePlanForm } from "../AssistancePlanForm";
import { AssistancePlanRow } from "../AssistancePlanRow";
import { HouseholdCard } from "./HouseholdCard";
import { DistributionCard } from "./DistributionCard";
import { NewHouseholdForm } from "./NewHouseholdForm";
import { NewDistributionForm } from "./NewDistributionForm";

export default async function ProjectHumanitarianPage({ params }: PageProps<"/humanitarian/[projectId]">) {
  const { projectId } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const role = staff?.system_role;
  const canEditPlanning = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(role!);
  const canEditField = canEditPlanning || role === "project_assistant";
  const canCheck = !!staff && (role === "me_meal" || isManagement(role));
  const canApprove = isManagement(role);

  const { data: project } = await supabase.from("projects").select("id, name, code").eq("id", projectId).maybeSingle();
  if (!project) notFound();

  const [
    { data: households },
    { data: distributions },
    { data: locations },
    { data: plans },
    { data: assessments },
    { data: staffList },
    { data: indicators },
    { data: budget },
  ] = await Promise.all([
    supabase
      .from("households")
      .select("*, beneficiaries(*), location:locations(name)")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("household_code"),
    supabase
      .from("distributions")
      .select(
        "*, distribution_items(*, household:households(household_code), beneficiary:beneficiaries(beneficiary_code)), assistance_plan:assistance_plans(name), location:locations(name)",
      )
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("distribution_date", { ascending: false }),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
    supabase
      .from("assistance_plans")
      .select("*, project:projects(name, code), responsible:staff!assistance_plans_responsible_staff_id_fkey(full_name)")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("needs_assessments")
      .select("*, project:projects(name, code)")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("assessment_date", { ascending: false }),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    // M&E linkage — the humanitarian module reuses the existing indicator system,
    // never its own. Read-only here: indicators are edited from the M&E page.
    supabase.from("indicators").select("id, name, target, actual, unit").eq("project_id", projectId).is("archived_at", null).order("name"),
    // Finance linkage — reuses the existing Finance module, never a parallel ledger.
    supabase
      .from("budgets")
      .select("approved_budget, currency, budget_lines(archived_at, expenditures(amount, archived_at))")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .maybeSingle(),
  ]);

  const householdList = households ?? [];
  const householdOptions = householdList.map((h) => ({ id: h.id, household_code: h.household_code }));

  const assessmentList = assessments ?? [];
  const assessmentIds = assessmentList.map((a) => a.id);
  const distributionIdsForDocs = (distributions ?? []).map((d) => d.id);
  const evidenceIds = [...assessmentIds, ...distributionIdsForDocs];
  const { data: evidence } = evidenceIds.length
    ? await supabase
        .from("documents")
        .select("*, uploader:staff!documents_created_by_fkey(full_name)")
        .in("entity_type", ["needs_assessment", "distribution"])
        .in("entity_id", evidenceIds)
        .is("archived_at", null)
    : { data: null };
  const documentsByEntity = new Map<string, NonNullable<typeof evidence>>();
  for (const d of evidence ?? []) {
    const list = documentsByEntity.get(d.entity_id) ?? [];
    list.push(d);
    documentsByEntity.set(d.entity_id, list);
  }

  const budgetExpenditure = budget
    ? (budget.budget_lines ?? [])
        .filter((l) => !l.archived_at)
        .reduce((sum, l) => sum + l.expenditures.filter((e) => !e.archived_at).reduce((s, e) => s + e.amount, 0), 0)
    : 0;
  const budgetUtilizationPct = budget ? budgetUtilization(budgetExpenditure, budget.approved_budget) : null;

  // Reach figures for each plan are derived from actual distribution_items linked
  // through this project's distributions, never a manually entered number.
  const distributionList = distributions ?? [];
  const plansWithReach = (plans ?? []).map((plan) => {
    const items = distributionList
      .filter((d) => d.assistance_plan_id === plan.id)
      .flatMap((d) => d.distribution_items.filter((i) => !i.archived_at));
    return {
      ...plan,
      deliveredQuantity: items.reduce((sum, i) => sum + Number(i.quantity), 0),
      householdsReached: new Set(items.map((i) => i.household_id).filter(Boolean)).size,
      beneficiariesReached: new Set(items.map((i) => i.beneficiary_id).filter(Boolean)).size,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-slate-500">{project.code}</p>
        <h1 className="text-xl font-semibold text-slate-900">{project.name} — Humanitarian</h1>
      </div>

      {((indicators ?? []).length > 0 || budget) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(indicators ?? []).length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Linked M&amp;E indicators</p>
                <Link href="/me-meal" className="text-xs font-medium text-teal-700 hover:underline">Open M&amp;E →</Link>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {(indicators ?? []).map((i) => {
                  const pct = safePercent(i.actual, i.target);
                  return (
                    <li key={i.id} className="flex justify-between text-slate-700">
                      <span>{i.name}</span>
                      <span className="text-slate-500">{i.actual ?? "—"}/{i.target ?? "—"} {i.unit ?? ""} {pct != null && `(${pct}%)`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {budget && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Finance</p>
                <Link href={`/finance/${project.id}`} className="text-xs font-medium text-teal-700 hover:underline">Open Finance →</Link>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Approved {formatMoney(budget.approved_budget, budget.currency)} · Spent {formatMoney(budgetExpenditure, budget.currency)}
                {budgetUtilizationPct != null && ` (${budgetUtilizationPct}% utilized)`}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-900">Needs assessments</h2>
        <div className="mt-3 space-y-3">
          {canEditPlanning && <NeedsAssessmentForm projects={[{ id: project.id, name: project.name }]} locations={locations ?? []} />}
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
                {assessmentList.map((a) => (
                  <NeedsAssessmentRow
                    key={a.id}
                    assessment={a}
                    canEdit={canEditPlanning}
                    canCheck={canCheck}
                    canApprove={canApprove}
                    locations={locations ?? []}
                    documents={documentsByEntity.get(a.id) ?? []}
                  />
                ))}
              </tbody>
            </table>
            {assessmentList.length === 0 && <p className="p-4 text-sm text-slate-500">No needs assessments recorded yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Assistance plans</h2>
        <div className="mt-3 space-y-3">
          {canEditPlanning && (
            <AssistancePlanForm
              projects={[{ id: project.id, name: project.name }]}
              locations={locations ?? []}
              staff={staffList ?? []}
            />
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
                {plansWithReach.map((p) => (
                  <AssistancePlanRow key={p.id} plan={p} canEdit={canEditPlanning} locations={locations ?? []} staff={staffList ?? []} />
                ))}
              </tbody>
            </table>
            {plansWithReach.length === 0 && <p className="p-4 text-sm text-slate-500">No assistance plans recorded yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Households &amp; beneficiaries</h2>
        </div>
        <div className="mt-3 space-y-3">
          {canEditField && <NewHouseholdForm projectId={project.id} locations={locations ?? []} />}
          {householdList.map((h) => (
            <HouseholdCard key={h.id} projectId={project.id} household={h} canEdit={canEditField} />
          ))}
          {householdList.length === 0 && <p className="text-sm text-slate-500">No households registered yet.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Distributions</h2>
        </div>
        <div className="mt-3 space-y-3">
          {canEditField && (
            <NewDistributionForm projectId={project.id} locations={locations ?? []} plans={(plans ?? []).map((p) => ({ id: p.id, name: p.name }))} />
          )}
          {distributionList.map((d) => (
            <DistributionCard
              key={d.id}
              projectId={project.id}
              distribution={d}
              households={householdOptions}
              canEdit={canEditField}
              canVerify={canApprove}
              documents={documentsByEntity.get(d.id) ?? []}
            />
          ))}
          {distributionList.length === 0 && <p className="text-sm text-slate-500">No distributions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
