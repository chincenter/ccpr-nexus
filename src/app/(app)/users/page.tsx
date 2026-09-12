import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { NewStaffForm } from "./NewStaffForm";
import { UserRow } from "./UserRow";

export default async function UsersPage() {
  const staff = await getCurrentStaff();
  if (!staff) return null;

  if (staff.system_role !== "super_admin") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Only a Super Administrator can manage users and access.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: allStaff } = await supabase.from("staff").select("*").order("full_name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Users &amp; Access</h1>
        <p className="text-sm text-slate-500">
          Create a staff record for anyone who needs access, and set their system role. They sign
          themselves up afterward using the same email.
        </p>
      </div>

      <NewStaffForm />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">System role</th>
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(allStaff ?? []).map((member) => (
              <UserRow key={member.id} member={member} isSelf={member.id === staff.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
