import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { HazardForm } from "./HazardForm";
import { HazardRow } from "./HazardRow";
import { MreSessionForm } from "./MreSessionForm";
import { MineSurveyForm } from "./MineSurveyForm";
import { MineSurveyRow } from "./MineSurveyRow";
import { VictimAssistanceForm } from "./VictimAssistanceForm";
import { VictimAssistanceRow } from "./VictimAssistanceRow";

export default async function MineActionPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const [
    { data: projects },
    { data: programmes },
    { data: locations },
    { data: hazards },
    { data: mreSessions },
    { data: surveys },
    { data: victimCases },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, programme:programmes!inner(category)").eq("programme.category", "mine_action").is("archived_at", null).order("name"),
    supabase.from("programmes").select("id, name").eq("category", "mine_action").is("archived_at", null).order("name"),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
    supabase
      .from("mine_hazards")
      .select("*, project:projects(name), programme:programmes(name), location:locations(name), mine_hazard_coordinates(precise_lat, precise_lng)")
      .order("date_identified", { ascending: false }),
    supabase
      .from("mre_sessions")
      .select("*, project:projects(name), location:locations(name)")
      .is("archived_at", null)
      .order("session_date", { ascending: false }),
    supabase
      .from("mine_surveys")
      .select("*, project:projects(name), location:locations(name)")
      .is("archived_at", null)
      .order("survey_date", { ascending: false }),
    supabase
      .from("victim_assistance")
      .select("*, project:projects(name)")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const activeHazards = (hazards ?? []).filter((h) => !h.archived_at);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Landmine / Mine Action</h1>
        <p className="text-sm text-slate-500">
          Hazard tracking, mine risk education, survey/assessment and victim assistance. Precise hazard
          coordinates are restricted — see each hazard&apos;s location column.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Hazards</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <HazardForm projects={projects ?? []} programmes={programmes ?? []} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Hazard</th>
                  <th className="px-4 py-2">Risk</th>
                  <th className="px-4 py-2">Verification</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Status</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeHazards.map((h) => (
                  <HazardRow key={h.id} hazard={h} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {activeHazards.length === 0 && <p className="p-4 text-sm text-slate-500">No hazards recorded yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Mine risk education &amp; community awareness</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <MreSessionForm projects={projects ?? []} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Audience</th>
                  <th className="px-4 py-2">Participants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(mreSessions ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{s.project?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{s.session_date}</td>
                    <td className="px-4 py-3 text-slate-600">{s.session_type}</td>
                    <td className="px-4 py-3 text-slate-600">{s.audience_description ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {(s.participants_total ?? (s.participants_male ?? 0) + (s.participants_female ?? 0)) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(mreSessions ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No sessions logged yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Surveys &amp; assessments</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <MineSurveyForm projects={projects ?? []} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Findings</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(surveys ?? []).map((s) => (
                  <MineSurveyRow key={s.id} survey={s} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {(surveys ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No surveys logged yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Victim assistance</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <VictimAssistanceForm projects={projects ?? []} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Incident date</th>
                  <th className="px-4 py-2">Injury</th>
                  <th className="px-4 py-2">Referral</th>
                  <th className="px-4 py-2">Case status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(victimCases ?? []).map((c) => (
                  <VictimAssistanceRow key={c.id} item={c} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {(victimCases ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No cases logged yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
