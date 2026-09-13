import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";

const STATUSES = ["not_started", "ongoing", "completed", "delayed", "cancelled"] as const;

export default async function ActivitiesPage({ searchParams }: PageProps<"/activities">) {
  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : "";

  const supabase = await createClient();
  let query = supabase
    .from("activities")
    .select(
      "*, project:projects(id, name, code), responsible:staff!activities_responsible_staff_id_fkey(full_name)",
    )
    .is("archived_at", null)
    .order("start_date");

  if (statusFilter) query = query.eq("status", statusFilter as (typeof STATUSES)[number]);

  const { data: activities } = await query;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Activities</h1>
        <p className="text-sm text-slate-500">
          {(activities ?? []).length} activit{(activities ?? []).length === 1 ? "y" : "ies"}
        </p>
      </div>

      <form className="flex items-center gap-2 text-sm">
        <label htmlFor="status" className="text-slate-600">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={statusFilter}
          className="rounded-md border border-slate-300 px-2 py-1"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Activity</th>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Responsible</th>
              <th className="px-4 py-2">Progress</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(activities ?? []).map((activity) => {
              const progress = safePercent(activity.actual, activity.target);
              const project = activity.project as { id: string; name: string } | null;
              return (
                <tr key={activity.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/activities/${activity.id}`} className="text-slate-900 hover:text-teal-800 hover:underline">
                      {activity.name}
                    </Link>
                  </td>
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
                  <td className="px-4 py-2 text-slate-600">{progress != null ? `${progress}%` : "—"}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{activity.priority}</td>
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
  );
}
