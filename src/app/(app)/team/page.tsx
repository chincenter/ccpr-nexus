import { createClient } from "@/lib/supabase/server";
import { DemoBadge } from "@/components/StatusBadge";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  executive: "Executive / Senior Management",
  programme_manager: "Programme Manager",
  project_officer: "Project Officer",
  project_assistant: "Project Assistant / Field Staff",
  me_meal: "M&E / MEAL",
  finance: "Finance",
  viewer: "Viewer",
};

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Team</h1>
        <p className="text-sm text-slate-500">{(staff ?? []).length} active staff</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Job Title</th>
              <th className="px-4 py-2">System Role</th>
              <th className="px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(staff ?? []).map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  {member.full_name}
                  {member.is_demo && <span className="ml-2"><DemoBadge /></span>}
                </td>
                <td className="px-4 py-2 text-slate-600">{member.job_title ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[member.system_role]}</td>
                <td className="px-4 py-2 text-slate-500">{member.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
