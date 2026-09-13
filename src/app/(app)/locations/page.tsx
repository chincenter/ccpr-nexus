import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { LocationForm } from "./LocationForm";
import { LocationRow } from "./LocationRow";

const LOCATION_TYPES = [
  "state_region",
  "district",
  "township",
  "village",
  "site",
  "health_facility",
  "other",
] as const;

export default async function LocationsPage({ searchParams }: PageProps<"/locations">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";

  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  let query = supabase.from("locations").select("*").order("name");
  if (q) {
    // Escape PostgREST filter-syntax metacharacters so a search term like "Hakha, or=(" can't
    // smuggle in extra filter clauses — this only ever builds an ilike search, nothing else.
    const safeQ = q.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll("(", "\\(").replaceAll(")", "\\)");
    query = query.or(
      `name.ilike.%${safeQ}%,state_region.ilike.%${safeQ}%,district.ilike.%${safeQ}%,township.ilike.%${safeQ}%,village.ilike.%${safeQ}%`,
    );
  }
  if (typeFilter) query = query.eq("location_type", typeFilter as (typeof LOCATION_TYPES)[number]);

  const { data: locations } = await query;

  const locationIds = (locations ?? []).map((l) => l.id);

  const [{ data: projectLocations }, { data: activities }] = await Promise.all([
    locationIds.length
      ? supabase
          .from("project_locations")
          .select("location_id, project:projects(id, name)")
          .in("location_id", locationIds)
      : Promise.resolve({ data: [] as { location_id: string; project: { id: string; name: string } | null }[] }),
    locationIds.length
      ? supabase
          .from("activities")
          .select("id, name, location_id")
          .in("location_id", locationIds)
          .is("archived_at", null)
      : Promise.resolve({ data: [] as { id: string; name: string; location_id: string | null }[] }),
  ]);

  const projectsByLocation = new Map<string, { id: string; name: string }[]>();
  for (const pl of projectLocations ?? []) {
    const project = pl.project as { id: string; name: string } | null;
    if (!project) continue;
    const list = projectsByLocation.get(pl.location_id) ?? [];
    list.push(project);
    projectsByLocation.set(pl.location_id, list);
  }

  const activitiesByLocation = new Map<string, { id: string; name: string }[]>();
  for (const a of activities ?? []) {
    if (!a.location_id) continue;
    const list = activitiesByLocation.get(a.location_id) ?? [];
    list.push({ id: a.id, name: a.name });
    activitiesByLocation.set(a.location_id, list);
  }

  const active = (locations ?? []).filter((l) => !l.archived_at);
  const archived = (locations ?? []).filter((l) => l.archived_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Locations</h1>
        <p className="text-sm text-slate-500">
          Shared location list used across projects and activities. Sensitive locations (e.g. hazard
          sites) are only visible to staff with access to a linked project, or administrators.
        </p>
      </div>

      {canEdit && <LocationForm locationTypes={LOCATION_TYPES} />}

      <form className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or area…"
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <select name="type" defaultValue={typeFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="">All types</option>
          {LOCATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
          Filter
        </button>
        {(q || typeFilter) && (
          <a href="/locations" className="text-xs font-medium text-teal-700 hover:underline">
            Clear
          </a>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Administrative area</th>
              <th className="px-4 py-2">Linked</th>
              {canEdit && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.map((loc) => (
              <LocationRow
                key={loc.id}
                location={loc}
                canEdit={canEdit}
                isArchived={false}
                locationTypes={LOCATION_TYPES}
                linkedProjects={projectsByLocation.get(loc.id) ?? []}
                linkedActivities={activitiesByLocation.get(loc.id) ?? []}
              />
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                  No locations match your search.
                </td>
              </tr>
            )}
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
                  <LocationRow
                    key={loc.id}
                    location={loc}
                    canEdit={canEdit}
                    isArchived
                    locationTypes={LOCATION_TYPES}
                    linkedProjects={projectsByLocation.get(loc.id) ?? []}
                    linkedActivities={activitiesByLocation.get(loc.id) ?? []}
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
