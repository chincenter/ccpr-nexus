import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { LocationForm } from "./LocationForm";
import { LocationRow } from "./LocationRow";

const LOCATION_TYPES = ["state_region", "district", "township", "village", "site"] as const;

export default async function LocationsPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .order("name");

  const active = (locations ?? []).filter((l) => !l.archived_at);
  const archived = (locations ?? []).filter((l) => l.archived_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Locations</h1>
        <p className="text-sm text-slate-500">
          Shared location list used across projects, activities, and (in later phases) the
          Humanitarian, Mine Action, Health, and Governance modules.
        </p>
      </div>

      {canEdit && <LocationForm locationTypes={LOCATION_TYPES} />}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Administrative area</th>
              {canEdit && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.map((loc) => (
              <LocationRow key={loc.id} location={loc} canEdit={canEdit} isArchived={false} />
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && archived.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Archived locations ({archived.length})
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <tbody className="divide-y divide-slate-100">
                {archived.map((loc) => (
                  <LocationRow key={loc.id} location={loc} canEdit={canEdit} isArchived />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
