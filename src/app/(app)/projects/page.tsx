import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement } from "@/lib/auth";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import { ProjectForm } from "@/components/project/ProjectForm";
import { ProjectCard } from "@/components/project/ProjectCard";

const STATUS_OPTIONS = ["planning", "active", "on_hold", "completed", "cancelled"] as const;
const VIEWS = ["cards", "list"] as const;

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const programmeFilter = typeof params.programme === "string" ? params.programme : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const officerFilter = typeof params.officer === "string" ? params.officer : "";
  const locationFilter = typeof params.location === "string" ? params.location : "";
  const view = VIEWS.includes(params.view as (typeof VIEWS)[number]) ? (params.view as (typeof VIEWS)[number]) : "cards";

  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canCreateProject = isManagement(staff?.system_role) || staff?.system_role === "programme_manager";

  const [{ data: projects }, { data: programmes }, { data: staffList }, { data: locations }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "*, programme:programmes(id, name, code), officer:staff!projects_project_officer_id_fkey(full_name)",
      )
      .is("archived_at", null)
      .order("code"),
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
  ]);

  const projectIds = (projects ?? []).map((p) => p.id);

  const activitiesQuery = projectIds.length
    ? supabase.from("activities").select("id, project_id, status").in("project_id", projectIds).is("archived_at", null)
    : null;
  const teamQuery = projectIds.length
    ? supabase.from("project_team").select("project_id").in("project_id", projectIds)
    : null;
  const projectLocationsQuery = projectIds.length
    ? supabase.from("project_locations").select("project_id, location_id").in("project_id", projectIds)
    : null;

  const [activitiesResult, teamResult, projectLocationsResult] = await Promise.all([
    activitiesQuery,
    teamQuery,
    projectLocationsQuery,
  ]);
  const activities = activitiesResult?.data ?? [];
  const teamRows = teamResult?.data ?? [];
  const projectLocationRows = projectLocationsResult?.data ?? [];

  const activityIds = activities.map((a) => a.id);
  const tasksQuery = activityIds.length
    ? supabase.from("tasks").select("id, activity_id").in("activity_id", activityIds).is("archived_at", null)
    : null;
  const { data: tasks } = tasksQuery ? await tasksQuery : { data: [] };

  const activityProjectById = new Map(activities.map((a) => [a.id, a.project_id]));

  const activitiesByProject = new Map<string, typeof activities>();
  for (const a of activities) {
    const list = activitiesByProject.get(a.project_id) ?? [];
    list.push(a);
    activitiesByProject.set(a.project_id, list);
  }

  const taskCountByProject = new Map<string, number>();
  for (const t of tasks ?? []) {
    const projectId = activityProjectById.get(t.activity_id);
    if (!projectId) continue;
    taskCountByProject.set(projectId, (taskCountByProject.get(projectId) ?? 0) + 1);
  }

  const teamCountByProject = new Map<string, number>();
  for (const t of teamRows) {
    teamCountByProject.set(t.project_id, (teamCountByProject.get(t.project_id) ?? 0) + 1);
  }

  const locationIdsByProject = new Map<string, Set<string>>();
  for (const pl of projectLocationRows) {
    const set = locationIdsByProject.get(pl.project_id) ?? new Set<string>();
    set.add(pl.location_id);
    locationIdsByProject.set(pl.project_id, set);
  }

  const rows = (projects ?? []).map((project) => {
    const acts = activitiesByProject.get(project.id) ?? [];
    const completed = acts.filter((a) => a.status === "completed").length;
    const progress = safePercent(completed, acts.length);
    const programme = project.programme as { id: string; name: string; code: string } | null;
    const officer = project.officer as { full_name: string } | null;
    const projectLocationIds = locationIdsByProject.get(project.id) ?? new Set<string>();

    return {
      project,
      programme,
      officer,
      progress,
      activitiesCount: acts.length,
      tasksCount: taskCountByProject.get(project.id) ?? 0,
      teamCount: teamCountByProject.get(project.id) ?? 0,
      locationsCount: projectLocationIds.size,
      projectLocationIds,
    };
  });

  const filtered = rows.filter((row) => {
    if (programmeFilter && row.programme?.id !== programmeFilter) return false;
    if (statusFilter && row.project.status !== statusFilter) return false;
    if (officerFilter && row.project.project_officer_id !== officerFilter) return false;
    if (locationFilter && !row.projectLocationIds.has(locationFilter)) return false;
    if (q) {
      const haystack = [row.project.name, row.project.code, row.programme?.name, row.officer?.full_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const filterQS = new URLSearchParams();
  if (q) filterQS.set("q", q);
  if (programmeFilter) filterQS.set("programme", programmeFilter);
  if (statusFilter) filterQS.set("status", statusFilter);
  if (officerFilter) filterQS.set("officer", officerFilter);
  if (locationFilter) filterQS.set("location", locationFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} project{filtered.length === 1 ? "" : "s"}
            {filtered.length !== rows.length ? ` of ${rows.length}` : ""}
          </p>
        </div>
        {canCreateProject && <ProjectForm programmes={programmes ?? []} staff={staffList ?? []} />}
      </div>

      <form className="flex flex-wrap items-center gap-2 text-sm">
        <input type="hidden" name="view" value={view} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search projects…"
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <select name="programme" defaultValue={programmeFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All programmes</option>
          {(programmes ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select name="officer" defaultValue={officerFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All officers</option>
          {(staffList ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <select name="location" defaultValue={locationFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All locations</option>
          {(locations ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
          Filter
        </button>
        {(q || programmeFilter || statusFilter || officerFilter || locationFilter) && (
          <Link href="/projects" className="text-xs font-medium text-teal-700 hover:underline">
            Clear
          </Link>
        )}
      </form>

      <div className="flex gap-1 rounded-md border border-slate-300 bg-white p-1 text-sm w-fit">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/projects?${new URLSearchParams({ ...Object.fromEntries(filterQS), view: v }).toString()}`}
            className={`rounded px-3 py-1 capitalize ${
              v === view ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <ProjectCard
              key={row.project.id}
              id={row.project.id}
              code={row.project.code}
              name={row.project.name}
              description={row.project.description}
              isDemo={!!row.project.is_demo}
              status={row.project.status}
              programmeId={row.programme?.id ?? null}
              programmeName={row.programme?.name ?? null}
              officerName={row.officer?.full_name ?? null}
              progress={row.progress}
              budget={row.project.budget}
              activitiesCount={row.activitiesCount}
              tasksCount={row.tasksCount}
              teamCount={row.teamCount}
              locationsCount={row.locationsCount}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No projects match this filter.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Programme</th>
                <th className="px-4 py-2">Officer</th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Activities</th>
                <th className="px-4 py-2">Budget</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.project.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{row.project.code}</td>
                  <td className="px-4 py-2">
                    <Link href={`/projects/${row.project.id}`} className="font-medium text-teal-800 hover:underline">
                      {row.project.name}
                    </Link>
                    {row.project.is_demo && (
                      <span className="ml-2">
                        <DemoBadge />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{row.programme?.name}</td>
                  <td className="px-4 py-2 text-slate-600">{row.officer?.full_name ?? "Unassigned"}</td>
                  <td className="px-4 py-2 text-slate-600">{row.progress != null ? `${row.progress}%` : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{row.activitiesCount}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {row.project.budget != null ? `$${row.project.budget.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={row.project.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No projects match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
