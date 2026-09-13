import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { safePercent, achievementLabel, riskRating } from "@/lib/calculations";
import { ActivityCard } from "@/components/project/ActivityCard";
import {
  NewObjectiveForm,
  ObjectiveHeader,
  NewOutcomeForm,
  OutcomeHeader,
  NewOutputForm,
  OutputHeader,
  NewActivityForm,
} from "@/components/project/ResultsFrameworkControls";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { NewTeamMemberForm, TeamMemberRow } from "@/components/project/ProjectTeamControls";
import { NewProjectLocationForm, ProjectLocationPill } from "@/components/project/ProjectLocationControls";

export default async function ProjectDetailPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "*, programme:programmes(id, name, code, category), officer:staff!projects_project_officer_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  const [
    { data: objectives },
    { data: outcomes },
    { data: outputs },
    { data: activities },
    { data: team },
    { data: staffList },
    { data: locations },
  ] = await Promise.all([
    supabase.from("objectives").select("*").eq("project_id", id).is("archived_at", null).order("code"),
    supabase.from("outcomes").select("*").is("archived_at", null),
    supabase.from("outputs").select("*").is("archived_at", null),
    supabase
      .from("activities")
      .select(
        "*, responsible:staff!activities_responsible_staff_id_fkey(full_name), location:locations(name)",
      )
      .eq("project_id", id)
      .order("start_date"),
    supabase
      .from("project_team")
      .select("staff_id, role_on_project, staff(full_name, job_title, is_active)")
      .eq("project_id", id),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
  ]);

  const [{ data: projectLocations }, { data: risks }, { data: documents }] = await Promise.all([
    supabase.from("project_locations").select("location:locations(id, name, location_type)").eq("project_id", id),
    supabase
      .from("risks")
      .select("*, responsible:staff!risks_responsible_staff_id_fkey(full_name)")
      .eq("project_id", id)
      .is("archived_at", null),
    supabase
      .from("documents")
      .select("*, uploader:staff!documents_created_by_fkey(full_name)")
      .eq("entity_type", "project")
      .eq("entity_id", id)
      .is("archived_at", null),
  ]);

  const { data: indicators } = await supabase
    .from("indicators")
    .select("*")
    .eq("project_id", id)
    .is("archived_at", null);

  const objectiveIds = (objectives ?? []).map((o) => o.id);
  const relevantOutcomes = (outcomes ?? []).filter((o) => objectiveIds.includes(o.objective_id));
  const outcomeIds = relevantOutcomes.map((o) => o.id);
  const relevantOutputs = (outputs ?? []).filter((o) => outcomeIds.includes(o.outcome_id));
  const outputIds = new Set(relevantOutputs.map((o) => o.id));

  const activityList = (activities ?? []).filter((a) => outputIds.has(a.output_id));
  const activeActivities = activityList.filter((a) => !a.archived_at);
  const completed = activeActivities.filter((a) => a.status === "completed").length;
  const progress = safePercent(completed, activeActivities.length);

  const activityIds = activityList.map((a) => a.id);
  const { data: tasks } = activityIds.length
    ? await supabase
        .from("tasks")
        .select("*, responsible:staff!tasks_responsible_staff_id_fkey(full_name)")
        .in("activity_id", activityIds)
        .is("archived_at", null)
    : { data: [] };

  const tasksByActivity = new Map<string, typeof tasks>();
  for (const t of tasks ?? []) {
    const list = tasksByActivity.get(t.activity_id) ?? [];
    list.push(t);
    tasksByActivity.set(t.activity_id, list);
  }

  const today = new Date().toISOString().slice(0, 10);
  const completedTaskCount = (tasks ?? []).filter((t) => t.status === "completed").length;
  const overdueTaskCount = (tasks ?? []).filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed" && t.status !== "cancelled",
  ).length;

  const taskIds = (tasks ?? []).map((t) => t.id);
  const taskDocumentsQuery = await (taskIds.length
    ? supabase
        .from("documents")
        .select("*, uploader:staff!documents_created_by_fkey(full_name)")
        .eq("entity_type", "task")
        .in("entity_id", taskIds)
        .is("archived_at", null)
    : Promise.resolve({ data: null, error: null }));
  const taskDocuments = taskDocumentsQuery.data;

  const documentsByTask = new Map<string, NonNullable<typeof taskDocuments>>();
  for (const d of taskDocuments ?? []) {
    const list = documentsByTask.get(d.entity_id) ?? [];
    list.push(d);
    documentsByTask.set(d.entity_id, list);
  }

  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const category = (project.programme as { category: string } | null)?.category;
  const PROGRAMME_MODULE: Record<string, { label: string; href: string }> = {
    humanitarian: { label: "Humanitarian", href: `/humanitarian/${project.id}` },
    mine_action: { label: "Landmine / Mine Action", href: "/mine-action" },
    health: { label: "Health", href: "/health" },
    governance: { label: "Governance", href: "/governance" },
  };
  const programmeModule = category ? PROGRAMME_MODULE[category] : undefined;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-slate-500">
          {(project.programme as { name: string })?.name} · {project.code}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
          <StatusBadge status={project.status} />
          {project.is_demo && <DemoBadge />}
        </div>
        <p className="mt-1 text-sm text-slate-600">{project.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Officer" value={(project.officer as { full_name: string } | null)?.full_name ?? "Unassigned"} />
        <SummaryStat label="Budget" value={project.budget != null ? `$${project.budget.toLocaleString()}` : "—"} />
        <SummaryStat
          label="Target Beneficiaries"
          value={project.target_beneficiaries?.toLocaleString() ?? "—"}
        />
        <SummaryStat label="Progress" value={progress != null ? `${progress}%` : "No activities yet"} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Results & Activities</h2>
          {canEdit && <NewObjectiveForm projectId={project.id} />}
        </div>
        <p className="text-sm text-slate-500">
          Objective → Outcome → Output → Activity → Task. Expand an activity to update its status,
          record progress, or archive it.
        </p>

        <div className="mt-4 space-y-6">
          {(objectives ?? []).map((objective) => {
            const objOutcomes = relevantOutcomes.filter((o) => o.objective_id === objective.id);
            return (
              <div key={objective.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <ObjectiveHeader objective={objective} projectId={project.id} canEdit={canEdit} />

                {objOutcomes.map((outcome) => {
                  const outOutputs = relevantOutputs.filter((o) => o.outcome_id === outcome.id);
                  return (
                    <div key={outcome.id} className="mt-3 border-t border-slate-200 pt-3">
                      <OutcomeHeader outcome={outcome} projectId={project.id} canEdit={canEdit} />

                      {outOutputs.map((output) => {
                        const outputActivities = activityList.filter((a) => a.output_id === output.id);
                        return (
                          <div key={output.id} className="mt-3 pl-3">
                            <OutputHeader output={output} projectId={project.id} canEdit={canEdit} />

                            <div className="mt-2 space-y-2">
                              {outputActivities.map((activity) => (
                                <ActivityCard
                                  key={activity.id}
                                  activity={activity}
                                  tasks={tasksByActivity.get(activity.id) ?? []}
                                  documentsByTask={documentsByTask}
                                  projectId={project.id}
                                  staff={staffList ?? []}
                                  locations={locations ?? []}
                                  canEdit={canEdit}
                                  isArchived={!!activity.archived_at}
                                />
                              ))}
                              {outputActivities.length === 0 && (
                                <p className="text-sm text-slate-400">No activities recorded for this output yet.</p>
                              )}
                            </div>

                            {canEdit && (
                              <div className="mt-2">
                                <NewActivityForm
                                  projectId={project.id}
                                  outputId={output.id}
                                  staff={staffList ?? []}
                                  locations={locations ?? []}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {canEdit && (
                        <div className="mt-3 pl-3">
                          <NewOutputForm outcomeId={outcome.id} projectId={project.id} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {canEdit && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <NewOutcomeForm objectiveId={objective.id} projectId={project.id} />
                  </div>
                )}
              </div>
            );
          })}
          {(objectives ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No results framework recorded for this project yet.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Workplan</h2>
          <Link
            href={`/workplan?project=${project.id}`}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Open full workplan →
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryStat label="Tasks" value={String((tasks ?? []).length)} />
          <SummaryStat label="Overdue Tasks" value={String(overdueTaskCount)} />
          <SummaryStat
            label="Tasks Completed"
            value={
              (tasks ?? []).length
                ? `${Math.round((completedTaskCount / (tasks ?? []).length) * 100)}%`
                : "—"
            }
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Team</h2>
          {canEdit && <NewTeamMemberForm projectId={project.id} staff={staffList ?? []} />}
        </div>
        <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {(project.officer as { full_name: string } | null) && (
            <li className="flex justify-between px-4 py-2 text-sm">
              <span className="text-slate-800">{(project.officer as { full_name: string }).full_name}</span>
              <span className="text-slate-500">Project Officer / Lead</span>
            </li>
          )}
          {(team ?? []).map((member) => {
            const memberStaff = member.staff as
              | { full_name: string; job_title: string | null; is_active: boolean }
              | null;
            if (!memberStaff) return null;
            return (
              <TeamMemberRow
                key={member.staff_id}
                projectId={project.id}
                staffId={member.staff_id}
                fullName={memberStaff.full_name}
                jobTitle={memberStaff.job_title}
                roleOnProject={member.role_on_project}
                isActive={memberStaff.is_active}
                canEdit={canEdit}
              />
            );
          })}
          {!(project.officer as { full_name: string } | null) && (team ?? []).length === 0 && (
            <li className="px-4 py-2 text-sm text-slate-500">No team members added yet.</li>
          )}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Locations</h2>
          {canEdit && <NewProjectLocationForm projectId={project.id} locations={locations ?? []} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(projectLocations ?? []).map((pl) => {
            const loc = pl.location as { id: string; name: string; location_type: string } | null;
            return (
              loc && (
                <ProjectLocationPill
                  key={loc.id}
                  projectId={project.id}
                  locationId={loc.id}
                  name={loc.name}
                  canEdit={canEdit}
                />
              )
            );
          })}
          {(projectLocations ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No locations linked yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Risks</h2>
        <div className="mt-3 space-y-2">
          {(risks ?? []).map((risk) => {
            const rating = riskRating(risk.likelihood, risk.impact);
            return (
              <div key={risk.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{risk.title}</p>
                  <p className="text-xs text-slate-500">
                    {risk.responsible?.full_name ?? "Unassigned"} · {rating.label} risk
                  </p>
                </div>
                <StatusBadge status={risk.status} />
              </div>
            );
          })}
          {(risks ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No risks recorded — add these from the Risks &amp; Security page.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">M&amp;E Indicators</h2>
        <div className="mt-3 space-y-2">
          {(indicators ?? []).map((indicator) => {
            const pct = safePercent(indicator.actual, indicator.target);
            return (
              <div key={indicator.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{indicator.name}</p>
                  <p className="text-xs text-slate-500">
                    {indicator.actual ?? "—"} / {indicator.target ?? "—"} {indicator.unit ?? ""}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {pct != null ? `${pct}%` : "—"} · {achievementLabel(pct).replaceAll("_", " ")}
                </span>
              </div>
            );
          })}
          {(indicators ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No indicators recorded — add these from the M&amp;E / MEAL page.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Finance</h2>
          <Link href={`/finance/${project.id}`} className="text-sm font-medium text-teal-700 hover:underline">
            Open budget →
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Budget, expenditure, and commitments for this project — visible to Finance and management.
        </p>
      </div>

      {programmeModule && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{programmeModule.label}</h2>
            <Link href={programmeModule.href} className="text-sm font-medium text-teal-700 hover:underline">
              Open module →
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Programme-specific records for this project — see the {programmeModule.label} page.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-900">Documents</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <DocumentUploader entityType="project" entityId={project.id} />}
          <DocumentList documents={documents ?? []} canEdit={canEdit} />
        </div>
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
