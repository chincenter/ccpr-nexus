import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, programme:programmes(name, code), officer:staff!projects_project_officer_id_fkey(full_name)")
    .is("archived_at", null)
    .order("code");

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
        <p className="text-sm text-slate-500">
          {(projects ?? []).length} project{(projects ?? []).length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Programme</th>
              <th className="px-4 py-2">Officer</th>
              <th className="px-4 py-2">Progress</th>
              <th className="px-4 py-2">Budget</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(projects ?? []).map((project) => {
              const acts = activitiesByProject.get(project.id) ?? [];
              const completed = acts.filter((a) => a.status === "completed").length;
              const progress = safePercent(completed, acts.length);
              return (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{project.code}</td>
                  <td className="px-4 py-2">
                    <Link href={`/projects/${project.id}`} className="font-medium text-teal-800 hover:underline">
                      {project.name}
                    </Link>
                    {project.is_demo && <span className="ml-2"><DemoBadge /></span>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {(project.programme as { name: string } | null)?.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {(project.officer as { full_name: string } | null)?.full_name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{progress != null ? `${progress}%` : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {project.budget != null ? `$${project.budget.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={project.status} />
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
