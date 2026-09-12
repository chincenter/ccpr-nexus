import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { IndicatorForm } from "./IndicatorForm";
import { IndicatorRow } from "./IndicatorRow";

export default async function MePage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit =
    !!staff && ((OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role) || staff.system_role === "me_meal");

  const [{ data: indicators }, { data: projects }, { data: programmes }, { data: staffList }] = await Promise.all([
    supabase
      .from("indicators")
      .select("*, project:projects(name), programme:programmes(name), responsible:staff!indicators_responsible_staff_id_fkey(full_name)")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").is("archived_at", null).order("name"),
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">M&amp;E / MEAL</h1>
        <p className="text-sm text-slate-500">
          {(indicators ?? []).length} indicator{(indicators ?? []).length === 1 ? "" : "s"} — achievement is
          computed live from actual/target, never entered separately.
        </p>
      </div>

      {canEdit && <IndicatorForm projects={projects ?? []} programmes={programmes ?? []} staff={staffList ?? []} />}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Indicator</th>
              <th className="px-4 py-2">Baseline → Target</th>
              <th className="px-4 py-2">Actual</th>
              <th className="px-4 py-2">Achievement</th>
              <th className="px-4 py-2">Responsible</th>
              {canEdit && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(indicators ?? []).map((indicator) => (
              <IndicatorRow key={indicator.id} indicator={indicator} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
        {(indicators ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No indicators recorded yet.</p>}
      </div>
    </div>
  );
}
