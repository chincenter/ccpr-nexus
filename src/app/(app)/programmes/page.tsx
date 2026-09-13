import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement } from "@/lib/auth";
import { ProgrammeForm } from "./ProgrammeForm";
import { ProgrammeRow } from "./ProgrammeRow";

export default async function ProgrammesPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canCreate = isManagement(staff?.system_role);

  const [{ data: programmes }, { data: projects }, { data: staffList }] = await Promise.all([
    supabase.from("programmes").select("*, lead:staff!programmes_lead_staff_id_fkey(full_name)").order("code"),
    supabase.from("projects").select("id, programme_id").is("archived_at", null),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const projectCountByProgramme = new Map<string, number>();
  for (const p of projects ?? []) {
    projectCountByProgramme.set(p.programme_id, (projectCountByProgramme.get(p.programme_id) ?? 0) + 1);
  }

  const active = (programmes ?? []).filter((p) => !p.archived_at);
  const archived = (programmes ?? []).filter((p) => p.archived_at);

  const canEditProgramme = (p: { lead_staff_id: string | null }) =>
    canCreate || (!!staff && p.lead_staff_id === staff.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Programmes</h1>
        <p className="text-sm text-slate-500">
          {active.length} programme{active.length === 1 ? "" : "s"}
        </p>
      </div>

      {canCreate && <ProgrammeForm staff={staffList ?? []} />}

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
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.map((programme) => (
              <ProgrammeRow
                key={programme.id}
                programme={programme}
                projectCount={projectCountByProgramme.get(programme.id) ?? 0}
                canEdit={canEditProgramme(programme)}
              />
            ))}
          </tbody>
        </table>
        {active.length === 0 && <p className="p-4 text-sm text-slate-500">No programmes yet.</p>}
      </div>

      {archived.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Archived programmes ({archived.length})
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <tbody className="divide-y divide-slate-100">
                {archived.map((programme) => (
                  <ProgrammeRow
                    key={programme.id}
                    programme={programme}
                    projectCount={projectCountByProgramme.get(programme.id) ?? 0}
                    canEdit={canEditProgramme(programme)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
