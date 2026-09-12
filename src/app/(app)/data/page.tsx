import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { DATA_TABLES, PAGE_SIZE, type DataTableName } from "./tableConfig";
import { RowActions } from "./RowActions";

const DISPLAY_COLUMNS: Record<DataTableName, string[]> = {
  staff: ["full_name", "email", "job_title", "system_role", "is_active"],
  programmes: ["code", "name", "category", "status"],
  projects: ["code", "name", "status", "budget"],
  activities: ["name", "status", "priority", "start_date"],
  tasks: ["name", "status", "progress", "due_date"],
  risks: ["title", "category", "likelihood", "impact", "status"],
  indicators: ["name", "unit", "baseline", "target", "actual"],
  locations: ["name", "location_type", "township"],
};

function isArchivedRow(row: Record<string, unknown>, config: (typeof DATA_TABLES)[DataTableName]) {
  return config.archiveColumn === "is_active" ? row.is_active === false : !!row.archived_at;
}

export default async function DataManagementPage({ searchParams }: PageProps<"/data">) {
  const staff = await getCurrentStaff();
  if (!staff) return null;

  if (staff.system_role !== "super_admin") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Only a Super Administrator can access Data Management.
      </div>
    );
  }

  const params = await searchParams;
  const table = (typeof params.table === "string" && params.table in DATA_TABLES ? params.table : "projects") as DataTableName;
  const search = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const config = DATA_TABLES[table];
  const supabase = await createClient();

  let query = supabase
    .from(table)
    .select("*", { count: "exact" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .order(config.searchColumn as string);

  if (search) query = query.ilike(config.searchColumn, `%${search}%`);

  const { data: rows, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const columns = DISPLAY_COLUMNS[table];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Data Management</h1>
        <p className="text-sm text-slate-500">
          Direct view over the underlying tables, for administrators. Use the regular pages for
          everyday work — this is for search, correction, and archive/restore.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2 text-sm">
        <select name="table" defaultValue={table} className="rounded-md border border-slate-300 px-2 py-1.5">
          {Object.entries(DATA_TABLES).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={search}
          placeholder={`Search by ${config.searchColumn.replaceAll("_", " ")}`}
          className="rounded-md border border-slate-300 px-2 py-1.5"
        />
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-2">
                  {c.replaceAll("_", " ")}
                </th>
              ))}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows ?? []).map((row) => {
              const r = row as Record<string, unknown>;
              const archived = isArchivedRow(r, config);
              return (
                <tr key={String(r.id)} className={archived ? "bg-slate-50 text-slate-400" : "hover:bg-slate-50"}>
                  {columns.map((c) => (
                    <td key={c} className="whitespace-nowrap px-4 py-2">
                      {String(r[c] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    <RowActions table={table} id={String(r.id)} isArchived={archived} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(rows ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No rows found.</p>}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {page} of {totalPages} ({count ?? 0} rows)
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <a href={`/data?table=${table}&q=${encodeURIComponent(search)}&page=${page - 1}`} className="text-teal-700 hover:underline">
              Previous
            </a>
          )}
          {page < totalPages && (
            <a href={`/data?table=${table}&q=${encodeURIComponent(search)}&page=${page + 1}`} className="text-teal-700 hover:underline">
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
