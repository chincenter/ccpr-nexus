import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";

type ActivityJoin = {
  id: string;
  name: string;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  actual: number | null;
  target: number | null;
  project: { id: string; name: string; programme_id: string } | null;
  responsible: { full_name: string } | null;
};

type WorkplanRow = {
  key: string;
  programmeId: string | null;
  projectId: string | null;
  projectName: string | null;
  activityId: string;
  activityName: string;
  taskId: string | null;
  taskName: string | null;
  responsibleName: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  progress: number | null;
  deliverable: string | null;
  dependency: string | null;
  notes: string | null;
};

const STATUS_OPTIONS = ["not_started", "ongoing", "in_progress", "completed", "delayed", "blocked", "cancelled"];
const VIEWS = ["list", "calendar", "timeline"] as const;

function monthKey(dateStr: string | null) {
  if (!dateStr) return "Unscheduled";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function isOverdue(row: WorkplanRow) {
  if (!row.dueDate || row.status === "completed" || row.status === "cancelled") return false;
  return row.dueDate < new Date().toISOString().slice(0, 10);
}

export default async function WorkplanPage({ searchParams }: PageProps<"/workplan">) {
  const params = await searchParams;
  const programmeFilter = typeof params.programme === "string" ? params.programme : "";
  const projectFilter = typeof params.project === "string" ? params.project : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const view = VIEWS.includes(params.view as (typeof VIEWS)[number]) ? (params.view as (typeof VIEWS)[number]) : "list";
  const monthParam = typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month) ? params.month : null;

  const supabase = await createClient();

  const [{ data: programmes }, { data: projects }, { data: activities }, { data: tasks }] = await Promise.all([
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase.from("projects").select("id, name, programme_id").is("archived_at", null).order("name"),
    supabase
      .from("activities")
      .select(
        "id, name, status, priority, start_date, end_date, actual, target, project:projects(id, name, programme_id), responsible:staff!activities_responsible_staff_id_fkey(full_name)",
      )
      .is("archived_at", null),
    supabase
      .from("tasks")
      .select(
        `id, name, description, status, priority, start_date, due_date, progress, notes, activity_id,
         responsible:staff!tasks_responsible_staff_id_fkey(full_name),
         dependency:tasks!tasks_dependency_task_id_fkey(name)`,
      )
      .is("archived_at", null),
  ]);

  const activityById = new Map((activities ?? []).map((a) => [a.id, a as ActivityJoin]));
  const taskCountByActivity = new Map<string, number>();
  for (const t of tasks ?? []) {
    taskCountByActivity.set(t.activity_id, (taskCountByActivity.get(t.activity_id) ?? 0) + 1);
  }

  const rows: WorkplanRow[] = [];

  for (const t of tasks ?? []) {
    const activity = activityById.get(t.activity_id);
    const project = activity?.project ?? null;
    rows.push({
      key: `task-${t.id}`,
      programmeId: project?.programme_id ?? null,
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      activityId: t.activity_id,
      activityName: activity?.name ?? "—",
      taskId: t.id,
      taskName: t.name,
      responsibleName: (t.responsible as { full_name: string } | null)?.full_name ?? "Unassigned",
      startDate: t.start_date,
      dueDate: t.due_date,
      status: t.status,
      priority: t.priority,
      progress: t.progress,
      deliverable: t.description ?? t.name,
      dependency: (t.dependency as unknown as { name: string } | null)?.name ?? null,
      notes: t.notes,
    });
  }

  for (const a of activities ?? []) {
    if ((taskCountByActivity.get(a.id) ?? 0) > 0) continue;
    const activity = a as ActivityJoin;
    rows.push({
      key: `activity-${activity.id}`,
      programmeId: activity.project?.programme_id ?? null,
      projectId: activity.project?.id ?? null,
      projectName: activity.project?.name ?? null,
      activityId: activity.id,
      activityName: activity.name,
      taskId: null,
      taskName: null,
      responsibleName: activity.responsible?.full_name ?? "Unassigned",
      startDate: activity.start_date,
      dueDate: activity.end_date,
      status: activity.status,
      priority: activity.priority,
      progress: safePercent(activity.actual, activity.target),
      deliverable: null,
      dependency: null,
      notes: null,
    });
  }

  const filtered = rows.filter((r) => {
    if (programmeFilter && r.programmeId !== programmeFilter) return false;
    if (projectFilter && r.projectId !== projectFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  filtered.sort((a, b) => (a.dueDate ?? a.startDate ?? "9999").localeCompare(b.dueDate ?? b.startDate ?? "9999"));

  const filterQS = new URLSearchParams();
  if (programmeFilter) filterQS.set("programme", programmeFilter);
  if (projectFilter) filterQS.set("project", projectFilter);
  if (statusFilter) filterQS.set("status", statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Workplan</h1>
        <p className="text-sm text-slate-500">
          Every task and activity across active projects. This is the same Project → Activity → Task
          data shown in each project workspace — nothing here is entered separately.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="view" value={view} />
          <select name="programme" defaultValue={programmeFilter} className="rounded-md border border-slate-300 px-2 py-1">
            <option value="">All programmes</option>
            {(programmes ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="project" defaultValue={projectFilter} className="rounded-md border border-slate-300 px-2 py-1">
            <option value="">All projects</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter} className="rounded-md border border-slate-300 px-2 py-1">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
            Filter
          </button>
        </form>

        <div className="flex gap-1 rounded-md border border-slate-300 bg-white p-1 text-sm">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={`/workplan?${new URLSearchParams({ ...Object.fromEntries(filterQS), view: v }).toString()}`}
              className={`rounded px-3 py-1 capitalize ${
                v === view ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      {view === "list" && <ListView rows={filtered} />}
      {view === "calendar" && <CalendarView rows={filtered} monthParam={monthParam} filterQS={filterQS} />}
      {view === "timeline" && <TimelineView rows={filtered} />}
    </div>
  );
}

function ListView({ rows }: { rows: WorkplanRow[] }) {
  const groups = new Map<string, WorkplanRow[]>();
  for (const row of rows) {
    const key = monthKey(row.dueDate ?? row.startDate);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([month, items]) => (
        <div key={month}>
          <h2 className="text-sm font-semibold text-slate-700">{month}</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Activity</th>
                  <th className="px-4 py-2">Task</th>
                  <th className="px-4 py-2">Responsible</th>
                  <th className="px-4 py-2">Start → Due</th>
                  <th className="px-4 py-2">Progress</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600">
                      {row.projectId && (
                        <Link href={`/projects/${row.projectId}`} className="text-teal-800 hover:underline">
                          {row.projectName}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      <Link href={`/activities/${row.activityId}`} className="hover:underline">
                        {row.activityName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{row.taskName ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{row.responsibleName}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {row.startDate ?? "—"} → {row.dueDate ?? "—"}
                      {isOverdue(row) && <span className="ml-1 font-medium text-red-600">(overdue)</span>}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{ width: `${Math.min(row.progress ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{row.progress != null ? `${row.progress}%` : "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={row.priority} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {groups.size === 0 && <p className="text-sm text-slate-500">No activities or tasks match this filter.</p>}
    </div>
  );
}

function CalendarView({
  rows,
  monthParam,
  filterQS,
}: {
  rows: WorkplanRow[];
  monthParam: string | null;
  filterQS: URLSearchParams;
}) {
  const today = new Date();
  const [y, m] = monthParam ? monthParam.split("-").map(Number) : [today.getFullYear(), today.getMonth() + 1];
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const byDate = new Map<string, WorkplanRow[]>();
  for (const row of rows) {
    if (!row.dueDate) continue;
    const list = byDate.get(row.dueDate) ?? [];
    list.push(row);
    byDate.set(row.dueDate, list);
  }

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    days.push(d);
    if (i >= 34 && d.getUTCDay() === 6 && d.getUTCMonth() !== monthStart.getUTCMonth()) break;
  }

  function monthHref(offset: number) {
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    const qs = new URLSearchParams(filterQS);
    qs.set("view", "calendar");
    qs.set("month", `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    return `/workplan?${qs.toString()}`;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <Link href={monthHref(-1)} className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">
          ← Prev
        </Link>
        <h2 className="text-sm font-semibold text-slate-800">
          {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
        </h2>
        <Link href={monthHref(1)} className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">
          Next →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-slate-50 px-1 py-1 text-center font-medium text-slate-500">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const items = byDate.get(iso) ?? [];
          const inMonth = d.getUTCMonth() === monthStart.getUTCMonth();
          return (
            <div key={iso} className={`min-h-[5rem] bg-white p-1 ${inMonth ? "" : "bg-slate-50 text-slate-300"}`}>
              <p className={`text-right ${inMonth ? "text-slate-500" : "text-slate-300"}`}>{d.getUTCDate()}</p>
              <div className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((row) => (
                  <Link
                    key={row.key}
                    href={`/activities/${row.activityId}`}
                    title={row.taskName ?? row.activityName}
                    className="block truncate rounded bg-teal-50 px-1 text-teal-800 hover:bg-teal-100"
                  >
                    {row.taskName ?? row.activityName}
                  </Link>
                ))}
                {items.length > 3 && <p className="text-slate-400">+{items.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">Showing items by due date. Items without a due date are not shown here.</p>
    </div>
  );
}

function TimelineView({ rows }: { rows: WorkplanRow[] }) {
  const dated = rows.filter((r) => r.startDate || r.dueDate);
  if (dated.length === 0) {
    return <p className="text-sm text-slate-500">No dated activities or tasks match this filter.</p>;
  }

  const starts = dated.map((r) => new Date(r.startDate ?? r.dueDate!).getTime());
  const ends = dated.map((r) => new Date(r.dueDate ?? r.startDate!).getTime());
  const rangeStart = Math.min(...starts);
  const rangeEnd = Math.max(...ends, rangeStart + 1000 * 60 * 60 * 24);
  const span = rangeEnd - rangeStart;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-[640px] space-y-2">
        {dated.map((row) => {
          const start = new Date(row.startDate ?? row.dueDate!).getTime();
          const end = new Date(row.dueDate ?? row.startDate!).getTime();
          const left = ((start - rangeStart) / span) * 100;
          const width = Math.max(((end - start) / span) * 100, 1);
          return (
            <div key={row.key} className="flex items-center gap-3 text-sm">
              <div className="w-56 shrink-0 truncate text-slate-700" title={row.activityName}>
                {row.taskName ?? row.activityName}
              </div>
              <div className="relative h-4 flex-1 rounded bg-slate-100">
                <div
                  className={`absolute top-0 h-4 rounded ${isOverdue(row) ? "bg-red-400" : "bg-teal-500"}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${row.startDate ?? "—"} → ${row.dueDate ?? "—"}`}
                />
              </div>
              <div className="w-16 shrink-0 text-right">
                <StatusBadge status={row.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
