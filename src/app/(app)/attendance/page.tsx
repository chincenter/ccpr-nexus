import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { TodayPanel } from "./TodayPanel";

function lastNDays(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default async function AttendancePage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  if (!staff) return null;

  const today = new Date().toISOString().slice(0, 10);
  const days = lastNDays(7);

  const { data: myToday } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", staff.id)
    .eq("date", today)
    .maybeSingle();

  const canSeeTeam = isManagement(staff.system_role) || staff.system_role === "programme_manager";

  let teamRows: { full_name: string; id: string }[] = [];
  let recordsByStaffDate = new Map<string, { status: string }>();

  if (canSeeTeam) {
    const [{ data: activeStaff }, { data: records }] = await Promise.all([
      supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
      supabase.from("attendance").select("staff_id, date, status").gte("date", days[0]),
    ]);
    teamRows = activeStaff ?? [];
    recordsByStaffDate = new Map((records ?? []).map((r) => [`${r.staff_id}_${r.date}`, r]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">Record your own status; managers see the team&apos;s last 7 days.</p>
      </div>

      <TodayPanel today={myToday ?? null} />

      {canSeeTeam && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Staff</th>
                {days.map((d) => (
                  <th key={d} className="px-2 py-2 text-center">
                    {new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamRows.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">{member.full_name}</td>
                  {days.map((d) => {
                    const record = recordsByStaffDate.get(`${member.id}_${d}`);
                    return (
                      <td key={d} className="px-2 py-2 text-center">
                        {record ? <StatusBadge status={record.status} /> : <span className="text-slate-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
