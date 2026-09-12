import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";

const CATEGORY_LABELS: Record<string, string> = {
  humanitarian: "Humanitarian",
  mine_action: "Landmine / Mine Action",
  health: "Health",
  governance: "Governance",
  peacebuilding: "Peacebuilding",
  research_policy: "Research / Policy",
  other: "Other",
};

export default async function ProgrammesPage() {
  const supabase = await createClient();
  const { data: programmes } = await supabase
    .from("programmes")
    .select("*, lead:staff!programmes_lead_staff_id_fkey(full_name)")
    .is("archived_at", null)
    .order("code");

  const { data: projects } = await supabase.from("projects").select("id, programme_id").is("archived_at", null);
  const projectCountByProgramme = new Map<string, number>();
  for (const p of projects ?? []) {
    projectCountByProgramme.set(p.programme_id, (projectCountByProgramme.get(p.programme_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Programmes</h1>
        <p className="text-sm text-slate-500">
          {(programmes ?? []).length} programme{(programmes ?? []).length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Lead</th>
              <th className="px-4 py-2">Projects</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(programmes ?? []).map((programme) => (
              <tr key={programme.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{programme.code}</td>
                <td className="px-4 py-2">
                  <Link href={`/programmes/${programme.id}`} className="font-medium text-teal-800 hover:underline">
                    {programme.name}
                  </Link>
                  {programme.is_demo && <span className="ml-2"><DemoBadge /></span>}
                </td>
                <td className="px-4 py-2 text-slate-600">{CATEGORY_LABELS[programme.category]}</td>
                <td className="px-4 py-2 text-slate-600">
                  {(programme.lead as { full_name: string } | null)?.full_name ?? "Unassigned"}
                </td>
                <td className="px-4 py-2 text-slate-600">{projectCountByProgramme.get(programme.id) ?? 0}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={programme.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
