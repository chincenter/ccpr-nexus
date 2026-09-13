import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default async function MyWorkPage() {
  const staff = await getCurrentStaff();
  if (!staff) return null;

  const supabase = await createClient();

  const [{ data: officerProjects }, { data: teamProjects }, { data: activities }, { data: tasks }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("project_officer_id", staff.id).is("archived_at", null),
      supabase
        .from("project_team")
        .select("role_on_project, project:projects(*)")
        .eq("staff_id", staff.id),
      supabase
        .from("activities")
        .select("*, project:projects(id, name)")
        .eq("responsible_staff_id", staff.id)
        .is("archived_at", null),
      supabase
        .from("tasks")
        .select("*, activity:activities(id, name, project:projects(id, name))")
        .eq("responsible_staff_id", staff.id)
        .is("archived_at", null),
    ]);

  type ProjectRow = NonNullable<typeof officerProjects>[number];
  const projectMap = new Map<string, { project: ProjectRow; role: string }>();
  for (const p of officerProjects ?? []) {
    if (p.archived_at) continue;
    projectMap.set(p.id, { project: p, role: "Project Officer / Lead" });
  }
  for (const tp of teamProjects ?? []) {
    const project = tp.project as ProjectRow | null;
    if (!project || project.archived_at || projectMap.has(project.id)) continue;
    projectMap.set(project.id, { project, role: tp.role_on_project.replaceAll("_", " ") });
  }
  const myProjects = Array.from(projectMap.values());

  const allTasks = tasks ?? [];
  const openTasks = allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = allTasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 10);

  const overdue = openTasks.filter((t) => {
    const d = daysUntil(t.due_date);
    return d != null && d < 0;
  });
  const dueToday = openTasks.filter((t) => daysUntil(t.due_date) === 0);
  const upcoming = openTasks.filter((t) => {
    const d = daysUntil(t.due_date);
    return d != null && d > 0 && d <= 7;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Work</h1>
        <p className="text-sm text-slate-500">Items tied to your staff record: {staff.full_name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Overdue" value={overdue.length} tone="red" />
        <StatCard label="Due Today" value={dueToday.length} tone="amber" />
        <StatCard label="Upcoming (7 days)" value={upcoming.length} tone="blue" />
        <StatCard label="Completed" value={completedTasks.length} tone="green" />
      </div>

      <Section title="My Projects">
        {myProjects.map(({ project, role }) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:border-teal-300"
          >
            <div>
              <span className="font-medium text-slate-800">{project.name}</span>
              <span className="ml-2 text-xs capitalize text-slate-500">{role}</span>
            </div>
            <StatusBadge status={project.status} />
          </Link>
        ))}
        {myProjects.length === 0 && (
          <EmptyState text="No projects assigned to you as project officer or team member." />
        )}
      </Section>

      <Section title="My Activities">
        {(activities ?? []).map((a) => (
          <Link
            key={a.id}
            href={`/activities/${a.id}`}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:border-teal-300"
          >
            <div>
              <span className="font-medium text-slate-800">{a.name}</span>
              <span className="ml-2 text-xs text-slate-500">{(a.project as { name: string } | null)?.name}</span>
            </div>
            <StatusBadge status={a.status} />
          </Link>
        ))}
        {(activities ?? []).length === 0 && <EmptyState text="No activities assigned to you." />}
      </Section>

      <Section title="My Open Tasks">
        {openTasks.map((t) => {
          const d = daysUntil(t.due_date);
          const activity = t.activity as { id: string; name: string; project: { id: string; name: string } | null } | null;
          return (
            <Link
              key={t.id}
              href={`/activities/${activity?.id ?? ""}`}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:border-teal-300"
            >
              <div>
                <p className="font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">
                  {activity?.project?.name ? `${activity.project.name} · ` : ""}
                  {activity?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {d != null && (
                  <span className={d < 0 ? "text-red-600" : d === 0 ? "text-amber-600" : "text-slate-500"}>
                    {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`}
                  </span>
                )}
                <StatusBadge status={t.status} />
              </div>
            </Link>
          );
        })}
        {openTasks.length === 0 && <EmptyState text="No open tasks." />}
      </Section>

      <Section title="Recently Completed">
        {completedTasks.map((t) => {
          const activity = t.activity as { id: string; name: string; project: { id: string; name: string } | null } | null;
          return (
            <Link
              key={t.id}
              href={`/activities/${activity?.id ?? ""}`}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:border-teal-300"
            >
              <div>
                <p className="font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">
                  {activity?.project?.name ? `${activity.project.name} · ` : ""}
                  {activity?.name}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </Link>
          );
        })}
        {completedTasks.length === 0 && <EmptyState text="No completed tasks yet." />}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "blue" | "green" }) {
  const toneClasses = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[tone];
  return (
    <div className={`rounded-lg border p-4 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
