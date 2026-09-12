import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { FacilityForm } from "./FacilityForm";
import { FacilityCard } from "./FacilityCard";
import { OutreachForm } from "./OutreachForm";
import { ReferralForm } from "./ReferralForm";
import { ReferralRow } from "./ReferralRow";

export default async function HealthPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const [{ data: projects }, { data: locations }, { data: facilities }, { data: outreach }, { data: referrals }] =
    await Promise.all([
      supabase.from("projects").select("id, name, programme:programmes!inner(category)").eq("programme.category", "health").is("archived_at", null).order("name"),
      supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
      supabase
        .from("health_facilities")
        .select("*, health_services(*), location:locations(name)")
        .is("archived_at", null)
        .order("name"),
      supabase
        .from("health_outreach")
        .select("*, project:projects(name), facility:health_facilities(name)")
        .is("archived_at", null)
        .order("outreach_date", { ascending: false }),
      supabase
        .from("health_referrals")
        .select("*, project:projects(name), facility:health_facilities(name)")
        .is("archived_at", null)
        .order("referral_date", { ascending: false }),
    ]);

  const projectList = projects ?? [];
  const facilityOptions = (facilities ?? []).map((f) => ({ id: f.id, name: f.name }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Health</h1>
        <p className="text-sm text-slate-500">
          Programme &amp; service management — facilities, services, outreach and referrals. Not a medical-record system.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Facilities &amp; services</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <FacilityForm projects={projectList} locations={locations ?? []} />}
          {(facilities ?? []).map((f) => (
            <FacilityCard key={f.id} facility={f} canEdit={canEdit} />
          ))}
          {(facilities ?? []).length === 0 && <p className="text-sm text-slate-500">No facilities registered yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Outreach</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <OutreachForm projects={projectList} facilities={facilityOptions} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Activity</th>
                  <th className="px-4 py-2">People served</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(outreach ?? []).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{o.project?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{o.outreach_date}</td>
                    <td className="px-4 py-3 text-slate-600">{o.activity_description ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{o.people_served ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(outreach ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No outreach activities logged yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Referrals</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <ReferralForm projects={projectList} facilities={facilityOptions} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Referred to</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(referrals ?? []).map((r) => (
                  <ReferralRow key={r.id} referral={r} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {(referrals ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No referrals logged yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
