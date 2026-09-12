import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { StakeholderForm } from "./StakeholderForm";
import { StakeholderRow } from "./StakeholderRow";
import { ConsultationForm } from "./ConsultationForm";
import { ConsultationCard } from "./ConsultationCard";
import { DecisionForm } from "./DecisionForm";
import { DecisionRow } from "./DecisionRow";
import { GovernanceActionForm } from "./GovernanceActionForm";
import { GovernanceActionRow } from "./GovernanceActionRow";

export default async function GovernancePage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const [
    { data: projects },
    { data: programmes },
    { data: locations },
    { data: staffList },
    { data: stakeholders },
    { data: consultations },
    { data: decisions },
    { data: actions },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, programme:programmes!inner(category)").eq("programme.category", "governance").is("archived_at", null).order("name"),
    supabase.from("programmes").select("id, name").eq("category", "governance").is("archived_at", null).order("name"),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase
      .from("stakeholders")
      .select("*, project:projects(name), programme:programmes(name)")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("consultations")
      .select(
        "*, project:projects(name), programme:programmes(name), location:locations(name), consultation_stakeholders(stakeholder:stakeholders(name)), recommendations(*, responsible:staff!recommendations_responsible_staff_id_fkey(full_name))",
      )
      .is("archived_at", null)
      .order("consultation_date", { ascending: false }),
    supabase
      .from("decisions")
      .select("*, project:projects(name), programme:programmes(name)")
      .is("archived_at", null)
      .order("decision_date", { ascending: false }),
    supabase
      .from("governance_actions")
      .select("*, project:projects(name), programme:programmes(name), responsible:staff!governance_actions_responsible_staff_id_fkey(full_name)")
      .is("archived_at", null)
      .order("due_date"),
  ]);

  const projectList = projects ?? [];
  const programmeList = programmes ?? [];
  const stakeholderOptions = (stakeholders ?? []).map((s) => ({ id: s.id, name: s.name }));
  const recommendationOptions = (consultations ?? []).flatMap((c) => c.recommendations).map((r) => ({ id: r.id, description: r.description }));
  const decisionOptions = (decisions ?? []).map((d) => ({ id: d.id, decision_text: d.decision_text }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Governance</h1>
        <p className="text-sm text-slate-500">
          Stakeholder → consultation → recommendation → decision → action, connected end to end.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Stakeholders</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <StakeholderForm projects={projectList} programmes={programmeList} locations={locations ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Stakeholder</th>
                  <th className="px-4 py-2">Organization</th>
                  <th className="px-4 py-2">Engagement</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stakeholders ?? []).map((s) => (
                  <StakeholderRow key={s.id} stakeholder={s} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {(stakeholders ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No stakeholders registered yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Consultations &amp; recommendations</h2>
        <div className="mt-3 space-y-3">
          {canEdit && (
            <ConsultationForm projects={projectList} programmes={programmeList} locations={locations ?? []} stakeholders={stakeholderOptions} />
          )}
          {(consultations ?? []).map((c) => (
            <ConsultationCard key={c.id} consultation={c} staff={staffList ?? []} canEdit={canEdit} />
          ))}
          {(consultations ?? []).length === 0 && <p className="text-sm text-slate-500">No consultations logged yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Decisions</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <DecisionForm projects={projectList} programmes={programmeList} recommendations={recommendationOptions} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Decision</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Responsible body</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(decisions ?? []).map((d) => (
                  <DecisionRow key={d.id} decision={d} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {(decisions ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No decisions recorded yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Actions &amp; follow-up</h2>
        <div className="mt-3 space-y-3">
          {canEdit && <GovernanceActionForm projects={projectList} programmes={programmeList} decisions={decisionOptions} staff={staffList ?? []} />}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Responsible</th>
                  <th className="px-4 py-2">Due date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Follow-up</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(actions ?? []).map((a) => (
                  <GovernanceActionRow key={a.id} action={a} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {(actions ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">No actions recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
