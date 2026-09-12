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

  const [{ data: projects }, { data: activities }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").eq("project_officer_id", staff.id).is("archived_at", null),
    supabase
      .from("activities")
      .select("*, project:projects(id, name)")
      .eq("responsible_staff_id", staff.id)
      .is("archived_at", null),
    supabase
      .from("tasks")
      .select("*, activity:activities(id, name, project_id)")
      .eq("responsible_staff_id", staff.id)
      .is("archived_at", null)
      .neq("status", "completed"),
  ]);

  const taskList = tasks ?? [];
  const overdue = taskList.filter((t) => {
    const d = daysUntil(t.due_date);
    return d != null && d < 0;
  });
  const dueToday = taskList.filter((t) => daysUntil(t.due_date) === 0);
  const upcoming = taskList.filter((t) => {
    const d = daysUntil(t.due_date);
    return d != null && d > 0 && d <= 7;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Work</h1>
        <p className="text-sm text-slate-500">Items tied to your staff record: {staff.full_name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Overdue" value={overdue.length} tone="red" />
        <StatCard label="Due Today" value={dueToday.length} tone="amber" />
        <StatCard label="Upcoming (7 days)" value={upcoming.length} tone="blue" />
      </div>

      <Section title="My Projects">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:border-teal-300">
            <span className="font-medium text-slate-800">{p.name}</span>
            <StatusBadge status={p.status} />
          </Link>
        ))}
        {(projects ?? []).length === 0 && <EmptyState text="No projects assigned to you as project officer." />}
      </Section>

      <Section title="My Activities">
        {(activities ?? []).map((a) => (
          <Link
            key={a.id}
            href={`/projects/${(a.project as { id: string })?.id}`}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:border-teal-300"
          >
            <span className="font-medium text-slate-800">{a.name}</span>
            <StatusBadge status={a.status} />
          </Link>
        ))}
        {(activities ?? []).length === 0 && <EmptyState text="No activities assigned to you." />}
      </Section>

      <Section title="My Open Tasks">
        {taskList.map((t) => {
          const d = daysUntil(t.due_date);
          return (
            <div key={t.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">{(t.activity as { name: string } | null)?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {d != null && (
                  <span className={d < 0 ? "text-red-600" : d === 0 ? "text-amber-600" : "text-slate-500"}>
                    {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`}
                  </span>
                )}
                <StatusBadge status={t.status} />
              </div>
            </div>
          );
        })}
        {taskList.length === 0 && <EmptyState text="No open tasks." />}
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

function StatCard({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "blue" }) {
  const toneClasses = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  }[tone];
  return (
    <div className={`rounded-lg border p-4 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
