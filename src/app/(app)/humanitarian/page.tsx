import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { DemoBadge } from "@/components/StatusBadge";
import { NeedsAssessmentForm } from "./NeedsAssessmentForm";
import { AssistancePlanForm } from "./AssistancePlanForm";
import { NeedsAssessmentRow } from "./NeedsAssessmentRow";
import { AssistancePlanRow } from "./AssistancePlanRow";

export default async function HumanitarianPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const [{ data: projects }, { data: locations }, { data: assessments }, { data: plans }, { data: households }] =
    await Promise.all([
      supabase.from("projects").select("id, name, code, programme:programmes!inner(category)").eq("programme.category", "humanitarian").is("archived_at", null).order("code"),
      supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
      supabase
        .from("needs_assessments")
        .select("*, project:projects(id, name, code)")
        .order("assessment_date", { ascending: false }),
      supabase
        .from("assistance_plans")
        .select("*, project:projects(id, name, code)")
        .order("created_at", { ascending: false }),
      supabase.from("households").select("id, project_id").is("archived_at", null),
    ]);

  const projectList = projects ?? [];
  const householdCountByProject = new Map<string, number>();
  for (const h of households ?? []) {
    householdCountByProject.set(h.project_id, (householdCountByProject.get(h.project_id) ?? 0) + 1);
  }

  const activeAssessments = (assessments ?? []).filter((a) => !a.archived_at);
  const activePlans = (plans ?? []).filter((p) => !p.archived_at);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Humanitarian</h1>
        <p className="text-sm text-slate-500">
          Needs assessments, household &amp; beneficiary registration, assistance plans and distributions.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Projects</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((p) => (
            <Link
              key={p.id}
              href={`/humanitarian/${p.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">{p.code}</p>
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{householdCountByProject.get(p.id) ?? 0} households registered</p>
            </Link>
          ))}
          {projectList.length === 0 && <p className="text-sm text-slate-500">No humanitarian projects yet.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Needs assessments</h2>
        </div>
        <div className="mt-3 space-y-3">
          {canEdit && <NeedsAssessmentForm projects={projectList} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Population</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Needs</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAssessments.map((a) => (
                  <NeedsAssessmentRow key={a.id} assessment={a} canEdit={canEdit} />
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
          {canEdit && <AssistancePlanForm projects={projectList} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Planned qty</th>
                  <th className="px-4 py-2">Status</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePlans.map((p) => (
                  <AssistancePlanRow key={p.id} plan={p} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {activePlans.length === 0 && <p className="p-4 text-sm text-slate-500">No assistance plans recorded yet.</p>}
          </div>
        </div>
      </div>

      {(assessments ?? []).some((a) => a.is_demo) && <DemoBadge />}
    </div>
  );
}
