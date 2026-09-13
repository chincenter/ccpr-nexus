import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement } from "@/lib/auth";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { safePercent, indicatorStatus } from "@/lib/calculations";
import { ProgrammeEditForm } from "./ProgrammeEditForm";
import { ProjectForm } from "./ProjectForm";

export default async function ProgrammeDetailPage({ params }: PageProps<"/programmes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();

  const { data: programme } = await supabase
    .from("programmes")
    .select("*, lead:staff!programmes_lead_staff_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!programme) notFound();

  const [{ data: projects }, { data: staffList }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, officer:staff!projects_project_officer_id_fkey(full_name)")
      .eq("programme_id", id)
      .is("archived_at", null)
      .order("code"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: activities } = projectIds.length
    ? await supabase.from("activities").select("id, project_id, status").in("project_id", projectIds)
    : { data: [] };

  const activitiesByProject = new Map<string, { status: string }[]>();
  for (const a of activities ?? []) {
    const list = activitiesByProject.get(a.project_id) ?? [];
    list.push(a);
    activitiesByProject.set(a.project_id, list);
  }

  const { data: programmeIndicators } = await supabase
    .from("indicators")
    .select("actual, target, verification_status")
    .is("archived_at", null)
    .or(`programme_id.eq.${id}${projectIds.length ? `,project_id.in.(${projectIds.join(",")})` : ""}`);

  const meIndicators = programmeIndicators ?? [];
  const achievements = meIndicators
    .map((i) => safePercent(i.actual, i.target))
    .filter((p): p is number => p != null);
  const averageAchievement = achievements.length
    ? Math.round(achievements.reduce((sum, p) => sum + p, 0) / achievements.length)
    : null;
  const meSummary = {
    indicators: meIndicators.length,
    atRisk: meIndicators.filter((i) => indicatorStatus(i.actual, i.target) === "at_risk").length,
    delayed: meIndicators.filter((i) => indicatorStatus(i.actual, i.target) === "delayed").length,
    awaitingVerification: meIndicators.filter(
      (i) => i.verification_status === "submitted" || i.verification_status === "under_review",
    ).length,
    averageAchievement,
  };

  const canEditProgramme = isManagement(staff?.system_role) || (!!staff && programme.lead_staff_id === staff.id);
  const canCreateProject = isManagement(staff?.system_role) || staff?.system_role === "programme_manager";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500">Programme · {programme.code}</p>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{programme.name}</h1>
          <StatusBadge status={programme.status} />
          {programme.is_demo && <DemoBadge />}
        </div>
        <p className="mt-1 text-sm text-slate-600">{programme.description}</p>
        <p className="mt-1 text-sm text-slate-500">
          Lead: {(programme.lead as { full_name: string } | null)?.full_name ?? "Unassigned"}
        </p>
      </div>

      {canEditProgramme && <ProgrammeEditForm programme={programme} staff={staffList ?? []} />}

      <div>
        <h2 className="text-base font-semibold text-slate-900">M&amp;E Summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Projects</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{(projects ?? []).length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Indicators</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{meSummary.indicators}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Average Achievement</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {meSummary.averageAchievement != null ? `${meSummary.averageAchievement}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">At Risk / Delayed</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">{meSummary.atRisk + meSummary.delayed}</p>
          </div>
        </div>
        {meSummary.awaitingVerification > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {meSummary.awaitingVerification} indicator{meSummary.awaitingVerification === 1 ? "" : "s"} awaiting verification.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Projects</h2>
          {canCreateProject && <ProjectForm programmeId={programme.id} staff={staffList ?? []} />}
        </div>
        <div className="mt-3 space-y-2">
          {(projects ?? []).map((project) => {
            const acts = activitiesByProject.get(project.id) ?? [];
            const completed = acts.filter((a) => a.status === "completed").length;
            const progress = safePercent(completed, acts.length);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-300"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">{project.code}</p>
                  <p className="font-medium text-slate-900">{project.name}</p>
                  <p className="text-xs text-slate-500">
                    Officer: {(project.officer as { full_name: string } | null)?.full_name ?? "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span>{progress != null ? `${progress}%` : "—"}</span>
                  <StatusBadge status={project.status} />
                </div>
              </Link>
            );
          })}
          {(projects ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No projects under this programme yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
