import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";

function monthKey(dateStr: string | null) {
  if (!dateStr) return "Unscheduled";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default async function WorkplanPage({ searchParams }: PageProps<"/workplan">) {
  const params = await searchParams;
  const programmeFilter = typeof params.programme === "string" ? params.programme : "";

  const supabase = await createClient();

  const [{ data: programmes }, { data: activities }] = await Promise.all([
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase
      .from("activities")
      .select(
        "*, project:projects(id, name, programme_id), responsible:staff!activities_responsible_staff_id_fkey(full_name)",
      )
      .is("archived_at", null)
      .order("start_date"),
  ]);

  const filtered = (activities ?? []).filter((a) => {
    if (!programmeFilter) return true;
    const project = a.project as { programme_id: string } | null;
    return project?.programme_id === programmeFilter;
  });

  const groups = new Map<string, typeof filtered>();
  for (const activity of filtered) {
    const key = monthKey(activity.start_date);
    const list = groups.get(key) ?? [];
    list.push(activity);
    groups.set(key, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Workplan</h1>
        <p className="text-sm text-slate-500">
          Every activity across active projects, grouped by planned start month. This is the same
          data shown in each project workspace — nothing here is entered separately.
        </p>
      </div>

      <form className="flex items-center gap-2 text-sm">
        <label htmlFor="programme" className="text-slate-600">
          Programme
        </label>
        <select id="programme" name="programme" defaultValue={programmeFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">All</option>
          {(programmes ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([month, items]) => (
          <div key={month}>
            <h2 className="text-sm font-semibold text-slate-700">{month}</h2>
            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Activity</th>
                    <th className="px-4 py-2">Project</th>
                    <th className="px-4 py-2">Responsible</th>
                    <th className="px-4 py-2">Planned dates</th>
                    <th className="px-4 py-2">Progress</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((activity) => {
                    const progress = safePercent(activity.actual, activity.target);
                    const project = activity.project as { id: string; name: string } | null;
                    return (
                      <tr key={activity.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900">{activity.name}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {project && (
                            <Link href={`/projects/${project.id}`} className="text-teal-800 hover:underline">
                              {project.name}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {(activity.responsible as { full_name: string } | null)?.full_name ?? "Unassigned"}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {activity.start_date ?? "—"} → {activity.end_date ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-teal-600"
                                style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{progress != null ? `${progress}%` : "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge status={activity.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {groups.size === 0 && <p className="text-sm text-slate-500">No activities match this filter.</p>}
      </div>
    </div>
  );
}
