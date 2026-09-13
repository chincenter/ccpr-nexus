import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent, indicatorStatus } from "@/lib/calculations";
import { ActivityCard } from "@/components/project/ActivityCard";

export default async function ActivityDetailPage({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();

  const { data: activity } = await supabase
    .from("activities")
    .select(
      `*,
      responsible:staff!activities_responsible_staff_id_fkey(full_name),
      location:locations(name),
      project:projects(id, name, code, programme:programmes(id, name, code)),
      output:outputs(id, name, outcome:outcomes(id, name, objective:objectives(id, name)))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!activity) notFound();

  const project = activity.project as {
    id: string;
    name: string;
    code: string;
    programme: { id: string; name: string; code: string } | null;
  } | null;
  const output = activity.output as {
    id: string;
    name: string;
    outcome: { id: string; name: string; objective: { id: string; name: string } | null } | null;
  } | null;

  const [{ data: tasks }, { data: staffList }, { data: locations }, { data: outputIndicators }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, responsible:staff!tasks_responsible_staff_id_fkey(full_name)")
      .eq("activity_id", id)
      .is("archived_at", null),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
    activity.output_id
      ? supabase
          .from("indicators")
          .select("id, name, unit, target, actual, verification_status")
          .eq("result_type", "output")
          .eq("result_id", activity.output_id)
          .is("archived_at", null)
      : Promise.resolve({ data: [] }),
  ]);

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
  const progress = safePercent(activity.actual, activity.target);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500">
          {project?.programme && (
            <>
              <Link href={`/programmes/${project.programme.id}`} className="hover:underline">
                {project.programme.name}
              </Link>
              {" · "}
            </>
          )}
          {project && (
            <>
              <Link href={`/projects/${project.id}`} className="hover:underline">
                {project.name}
              </Link>
              {" · "}
            </>
          )}
          {output?.outcome?.objective && <>{output.outcome.objective.name} · </>}
          {output?.outcome && <>{output.outcome.name} · </>}
          {output && <>{output.name}</>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{activity.name}</h1>
          <StatusBadge status={activity.status} />
        </div>
        {activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Responsible" value={activity.responsible?.full_name ?? "Unassigned"} />
        <SummaryStat label="Priority" value={activity.priority} />
        <SummaryStat label="Progress" value={progress != null ? `${progress}% (${activity.actual ?? 0} / ${activity.target ?? "—"})` : "—"} />
        <SummaryStat label="Dates" value={`${activity.start_date ?? "—"} → ${activity.end_date ?? "—"}`} />
      </div>

      {(outputIndicators ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            M&amp;E indicators for {output?.name ?? "this output"}
          </h2>
          <div className="mt-2 space-y-2">
            {(outputIndicators ?? []).map((indicator) => {
              const pct = safePercent(indicator.actual, indicator.target);
              return (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{indicator.name}</p>
                    <p className="text-xs text-slate-500">
                      {indicator.actual ?? "—"} / {indicator.target ?? "—"} {indicator.unit ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">{pct != null ? `${pct}%` : "—"}</span>
                    <StatusBadge status={indicatorStatus(indicator.actual, indicator.target)} />
                  </div>
                </div>
              );
            })}
          </div>
          {project && (
            <Link href={`/projects/${project.id}`} className="mt-1 inline-block text-xs font-medium text-teal-700 hover:underline">
              Manage in Project M&amp;E →
            </Link>
          )}
        </div>
      )}

      <div>
        <ActivityCard
          activity={activity}
          tasks={tasks ?? []}
          documentsByTask={documentsByTask}
          projectId={project?.id ?? ""}
          staff={staffList ?? []}
          locations={locations ?? []}
          canEdit={canEdit}
          isArchived={!!activity.archived_at}
          defaultExpanded
        />
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{value}</p>
    </div>
  );
}
