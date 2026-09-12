import { createClient } from "@/lib/supabase/server";

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("audit_log")
    .select("*, staff(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">Most recent 100 changes across the system.</p>
      </div>

      {error && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You do not have permission to view the audit log.
        </p>
      )}

      {!error && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Who</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(entries ?? []).map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {(entry.staff as { full_name: string } | null)?.full_name ?? "System"}
                  </td>
                  <td className="px-4 py-2 capitalize text-slate-800">{entry.action}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
