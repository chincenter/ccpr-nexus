import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement, OPERATIONAL_ROLES } from "@/lib/auth";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import { HazardForm } from "./HazardForm";
import { HazardRow } from "./HazardRow";
import { MreSessionForm } from "./MreSessionForm";
import { MreSessionRow } from "./MreSessionRow";
import { MineSurveyForm } from "./MineSurveyForm";
import { MineSurveyRow } from "./MineSurveyRow";
import { VictimAssistanceForm } from "./VictimAssistanceForm";
import { VictimAssistanceRow } from "./VictimAssistanceRow";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const RESPONDABLE_STATUSES = ["open", "in_progress"];

export default async function MineActionPage({ searchParams }: PageProps<"/mine-action">) {
  const params = await searchParams;
  const projectFilter = typeof params.project === "string" ? params.project : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const riskFilter = typeof params.risk === "string" ? params.risk : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const role = staff?.system_role;
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(role!);
  const canApprove = isManagement(role);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, programme:programmes!inner(category)")
    .eq("programme.category", "mine_action")
    .is("archived_at", null)
    .order("name");

  const projectList = projects ?? [];
  const mineActionProjectIds = projectList.map((p) => p.id);

  const [
    { data: programmes },
    { data: locations },
    { data: hazards },
    { data: mreSessions },
    { data: surveys },
    { data: victimCases },
    { data: responses },
    { data: activities },
  ] = await Promise.all([
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
      .select("*, project:projects(name), location:locations(name), hazard:mine_hazards(hazard_code)")
      .is("archived_at", null)
      .order("survey_date", { ascending: false }),
    supabase
      .from("victim_assistance")
      .select("*, project:projects(name)")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("mine_responses")
      .select("*, hazard:mine_hazards(hazard_code, status), project:projects(name)")
      .is("archived_at", null),
    // The MRE-session form's activity dropdown only ever needs activities that
    // belong to Mine Action projects, not every activity in the entire
    // organization (Humanitarian, Health, Governance, etc.).
    mineActionProjectIds.length
      ? supabase.from("activities").select("id, name, project_id").in("project_id", mineActionProjectIds)
      : Promise.resolve({ data: [] as { id: string; name: string; project_id: string }[] }),
  ]);
  const allHazards = hazards ?? [];
  const activeHazards = allHazards.filter((h) => !h.archived_at);
  const responseList = responses ?? [];
  const surveyList = surveys ?? [];
  const mreList = mreSessions ?? [];
  const victimList = victimCases ?? [];

  // --- KPI calculations: every figure below is derived from the rows above,
  // never hard-coded, and safe against zero/null denominators.
  const nonClosedActiveHazards = activeHazards.filter((h) => h.status !== "closed");
  const hazardIdsSurveyed = new Set(surveyList.map((s) => s.hazard_id).filter(Boolean));
  const hazardsSurveyedCount = nonClosedActiveHazards.filter((h) => hazardIdsSurveyed.has(h.id)).length;
  const surveyCompletion = safePercent(hazardsSurveyedCount, nonClosedActiveHazards.length);

  const hazardsRequiringResponse = activeHazards.filter((h) => RESPONDABLE_STATUSES.includes(h.status));
  const respondedHazardIds = new Set(
    responseList.filter((r) => r.status === "completed" || r.status === "verified" || r.status === "closed").map((r) => r.hazard_id),
  );
  const respondedCount = hazardsRequiringResponse.filter((h) => respondedHazardIds.has(h.id)).length;
  const responseCompletion = safePercent(respondedCount, hazardsRequiringResponse.length);
  const openResponses = responseList.filter((r) => r.status === "planned" || r.status === "in_progress");

  const mreReached = mreList.reduce((sum, s) => sum + (s.participants_total ?? 0), 0);

  const victimCompletion = safePercent(victimList.filter((v) => v.referral_status === "completed").length, victimList.length);

  // --- Filters + search apply to the hazard register only.
  const filteredHazards = activeHazards.filter((h) => {
    if (projectFilter && h.project_id !== projectFilter) return false;
    if (statusFilter && h.status !== statusFilter) return false;
    if (riskFilter && h.risk_level !== riskFilter) return false;
    if (typeFilter && h.hazard_type !== typeFilter) return false;
    if (q) {
      const haystack = [h.hazard_code, h.description, h.location?.name, h.project?.name].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Landmine / Mine Action</h1>
        <p className="text-sm text-slate-500">
          Hazard tracking, daily operational updates, survey/assessment, response and victim assistance. Precise hazard
          coordinates are database-protected — see each hazard&apos;s location column.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active Hazards" value={String(nonClosedActiveHazards.length)} />
        <Kpi label="Survey Completion" value={surveyCompletion != null ? `${surveyCompletion}%` : "—"} />
        <Kpi label="Open / Pending Response" value={String(hazardsRequiringResponse.length - respondedCount)} />
        <Kpi label="Response Completion" value={responseCompletion != null ? `${responseCompletion}%` : "—"} />
        <Kpi label="MRE People Reached" value={mreReached.toLocaleString()} />
        <Kpi label="Victim Assistance Cases" value={String(victimList.length)} />
        <Kpi label="Referral Completion" value={victimCompletion != null ? `${victimCompletion}%` : "—"} />
        <Kpi label="Surveys Logged" value={String(surveyList.length)} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Hazard register</h2>
        </div>
        <form className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <input name="q" defaultValue={q} placeholder="Search hazard code, description, location…" className="rounded-md border border-slate-300 px-2 py-1.5" />
          <select name="project" defaultValue={projectFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All projects</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All statuses</option>
            {["open", "in_progress", "cleared", "monitoring", "closed"].map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="risk" defaultValue={riskFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All risk levels</option>
            {["low", "medium", "high"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select name="type" defaultValue={typeFilter} className="rounded-md border border-slate-300 px-2 py-1.5">
            <option value="">All hazard types</option>
            {["landmine", "uxo", "other_explosive", "unknown"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Filter</button>
        </form>
        <div className="mt-3 space-y-3">
          {canEdit && <HazardForm projects={projectList} programmes={programmes ?? []} locations={locations ?? []} />}
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
                {filteredHazards.map((h) => (
                  <HazardRow key={h.id} hazard={h} canEdit={canEdit} canApprove={canApprove} />
                ))}
              </tbody>
            </table>
            {filteredHazards.length === 0 && <p className="p-4 text-sm text-slate-500">No hazards match this filter.</p>}
          </div>
        </div>
      </div>

      {openResponses.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-900">Open responses / clearance</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Hazard</th>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Progress</th>
                  <th className="px-4 py-2">Target completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openResponses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/mine-action/${r.hazard_id}`} className="font-medium text-teal-800 hover:underline">
                        {r.hazard?.hazard_code ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{r.project?.name ?? "—"}</td>
                    <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2 text-slate-600">{r.progress}%</td>
                    <td className="px-4 py-2 text-slate-600">{r.target_completion_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-900">Mine risk education &amp; community awareness</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <MreSessionForm projects={projectList} locations={locations ?? []} activities={activities ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Audience</th>
                  <th className="px-4 py-2">Participants</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mreList.map((s) => (
                  <MreSessionRow key={s.id} session={s} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {mreList.length === 0 && <p className="p-4 text-sm text-slate-500">No sessions logged yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Surveys &amp; assessments</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <MineSurveyForm projects={projectList} locations={locations ?? []} hazards={allHazards.map((h) => ({ id: h.id, hazard_code: h.hazard_code, project_id: h.project_id }))} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project / hazard</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Findings</th>
                  <th className="px-4 py-2">Status</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveyList.map((s) => (
                  <MineSurveyRow key={s.id} survey={s} canEdit={canEdit} canApprove={canApprove} />
                ))}
              </tbody>
            </table>
            {surveyList.length === 0 && <p className="p-4 text-sm text-slate-500">No surveys logged yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Victim assistance</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <VictimAssistanceForm projects={projectList} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Incident date</th>
                  <th className="px-4 py-2">Injury</th>
                  <th className="px-4 py-2">Referral</th>
                  <th className="px-4 py-2">Case status</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {victimList.map((c) => (
                  <VictimAssistanceRow key={c.id} item={c} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {victimList.length === 0 && <p className="p-4 text-sm text-slate-500">No cases logged yet.</p>}
          </div>
        </div>
      </div>

      {allHazards.some((h) => h.is_demo) && <DemoBadge />}
    </div>
  );
}
