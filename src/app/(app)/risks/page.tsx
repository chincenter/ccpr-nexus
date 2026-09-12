import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { RiskForm } from "./RiskForm";
import { RiskRow } from "./RiskRow";

export default async function RisksPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const [{ data: risks }, { data: projects }, { data: programmes }, { data: staffList }] = await Promise.all([
    supabase
      .from("risks")
      .select("*, project:projects(name), programme:programmes(name), responsible:staff!risks_responsible_staff_id_fkey(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").is("archived_at", null).order("name"),
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const active = (risks ?? []).filter((r) => !r.archived_at);
  const archived = (risks ?? []).filter((r) => r.archived_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Risks &amp; Security</h1>
        <p className="text-sm text-slate-500">{active.length} open risk record{active.length === 1 ? "" : "s"}</p>
      </div>

      {canEdit && <RiskForm projects={projects ?? []} programmes={programmes ?? []} staff={staffList ?? []} />}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Rating</th>
              <th className="px-4 py-2">Responsible</th>
              <th className="px-4 py-2">Review date</th>
              <th className="px-4 py-2">Status</th>
              {canEdit && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.map((risk) => (
              <RiskRow key={risk.id} risk={risk} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
        {active.length === 0 && <p className="p-4 text-sm text-slate-500">No risks recorded yet.</p>}
      </div>

      {canEdit && archived.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Archived risks ({archived.length})
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <tbody className="divide-y divide-slate-100">
                {archived.map((risk) => (
                  <RiskRow key={risk.id} risk={risk} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
