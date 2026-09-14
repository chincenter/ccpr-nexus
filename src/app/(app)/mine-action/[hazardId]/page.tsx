import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement, OPERATIONAL_ROLES } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { safePercent } from "@/lib/calculations";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { HazardEditForm } from "./HazardEditForm";
import { DailyUpdateForm } from "./DailyUpdateForm";
import { DailyUpdateRow } from "./DailyUpdateRow";
import { NewResponseForm, ResponseCard } from "./ResponseCard";

export default async function HazardDetailPage({ params }: PageProps<"/mine-action/[hazardId]">) {
  const { hazardId } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const role = staff?.system_role;
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(role!) || role === "project_assistant";
  const canApprove = isManagement(role);

  const { data: hazard } = await supabase
    .from("mine_hazards")
    .select("*, project:projects(id, name, code), programme:programmes(name), location:locations(name), mine_hazard_coordinates(precise_lat, precise_lng)")
    .eq("id", hazardId)
    .maybeSingle();
  if (!hazard) notFound();

  const [{ data: surveys }, { data: dailyUpdates }, { data: responses }, { data: staffList }, { data: indicators }, { data: locations }] = await Promise.all([
    supabase.from("mine_surveys").select("*").eq("hazard_id", hazardId).is("archived_at", null).order("survey_date", { ascending: false }),
    supabase
      .from("mine_daily_updates")
      .select("*, responsible:staff!mine_daily_updates_responsible_staff_id_fkey(full_name)")
      .eq("hazard_id", hazardId)
      .order("update_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("mine_responses")
      .select("*, responsible:staff!mine_responses_responsible_staff_id_fkey(full_name)")
      .eq("hazard_id", hazardId)
      .order("created_at", { ascending: false }),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    hazard.project_id
      ? supabase.from("indicators").select("id, name, target, actual, unit").eq("project_id", hazard.project_id).is("archived_at", null)
      : Promise.resolve({ data: [] }),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
  ]);

  const surveyList = surveys ?? [];
  const dailyUpdateList = dailyUpdates ?? [];
  const activeDailyUpdates = dailyUpdateList.filter((u) => !u.archived_at);
  const responseList = (responses ?? []).filter((r) => !r.archived_at);

  const evidenceIds = [hazardId, ...surveyList.map((s) => s.id), ...responseList.map((r) => r.id)];
  const { data: evidence } = evidenceIds.length
    ? await supabase
        .from("documents")
        .select("*, uploader:staff!documents_created_by_fkey(full_name)")
        .in("entity_type", ["mine_hazard", "mine_survey", "mine_response"])
        .in("entity_id", evidenceIds)
        .is("archived_at", null)
    : { data: null };

  const precise = hazard.mine_hazard_coordinates as { precise_lat: number | null; precise_lng: number | null } | null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/mine-action" className="text-xs font-medium text-teal-700 hover:underline">← Back to Mine Action</Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Hazard {hazard.hazard_code}</h1>
          <StatusBadge status={hazard.status} />
          <StatusBadge status={hazard.risk_level} />
          <StatusBadge status={hazard.verification_status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {hazard.project?.name ?? hazard.programme?.name} · {hazard.location?.name ?? "General location not set"} · {hazard.hazard_type}
        </p>
        {hazard.description && <p className="mt-1 text-sm text-slate-500">{hazard.description}</p>}
      </div>

      <HazardEditForm hazard={hazard} locations={locations ?? []} canEdit={canEdit} canSeeCoordinates={canEdit} precise={precise} />

      {indicators && indicators.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Linked M&amp;E indicators</p>
            <Link href="/me-meal" className="text-xs font-medium text-teal-700 hover:underline">Open M&amp;E →</Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {indicators.map((i) => {
              const pct = safePercent(i.actual, i.target);
              return (
                <li key={i.id} className="flex justify-between text-slate-700">
                  <span>{i.name}</span>
                  <span className="text-slate-500">{i.actual ?? "—"}/{i.target ?? "—"} {i.unit ?? ""} {pct != null && `(${pct}%)`}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-900">Survey / assessments</h2>
        <div className="mt-3 space-y-2">
          {surveyList.map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{s.survey_type ?? "Survey"} — {s.survey_date}</p>
                <div className="flex gap-2">
                  <StatusBadge status={s.status} />
                  <StatusBadge status={s.verification_status} />
                </div>
              </div>
              {s.findings && <p className="mt-1 text-slate-600">{s.findings}</p>}
            </div>
          ))}
          {surveyList.length === 0 && <p className="text-sm text-slate-500">No surveys logged for this hazard yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Response / clearance</h2>
        <div className="mt-3 space-y-2">
          {responseList.map((r) => (
            <ResponseCard key={r.id} response={r} projectId={hazard.project_id!} canEdit={canEdit} canVerify={canApprove} />
          ))}
          {responseList.length === 0 && <p className="text-sm text-slate-500">No response planned yet.</p>}
          {canEdit && hazard.project_id && <NewResponseForm projectId={hazard.project_id} hazardId={hazard.id} staff={staffList ?? []} />}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Daily update history</h2>
        <p className="text-xs text-slate-500">Newest first. Historical entries are preserved and never overwritten.</p>
        <div className="mt-3 space-y-2">
          {canEdit && hazard.project_id && (
            <DailyUpdateForm
              projectId={hazard.project_id}
              hazardId={hazard.id}
              surveys={surveyList.map((s) => ({ id: s.id, survey_type: s.survey_type, survey_date: s.survey_date }))}
              responses={responseList.map((r) => ({ id: r.id, status: r.status }))}
            />
          )}
          {activeDailyUpdates.map((u) => (
            <DailyUpdateRow key={u.id} update={u} canEdit={canEdit} />
          ))}
          {activeDailyUpdates.length === 0 && <p className="text-sm text-slate-500">No daily updates recorded yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Evidence</h2>
        <div className="mt-3 space-y-2">
          {canEdit && <DocumentUploader entityType="mine_hazard" entityId={hazard.id} />}
          <DocumentList documents={evidence ?? []} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}
