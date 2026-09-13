import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, isManagement, OPERATIONAL_ROLES } from "@/lib/auth";
import { indicatorStatus } from "@/lib/calculations";
import { IndicatorForm } from "./IndicatorForm";
import { IndicatorCard } from "./IndicatorCard";

const STATUS_OPTIONS = ["not_started", "on_track", "at_risk", "delayed", "achieved"] as const;
const VERIFICATION_OPTIONS = ["draft", "submitted", "under_review", "approved", "published"] as const;
const LEVEL_OPTIONS = ["objective", "outcome", "output"] as const;

export default async function MePage({ searchParams }: PageProps<"/me-meal">) {
  const params = await searchParams;
  const programmeFilter = typeof params.programme === "string" ? params.programme : "";
  const projectFilter = typeof params.project === "string" ? params.project : "";
  const levelFilter = typeof params.level === "string" ? params.level : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const verificationFilter = typeof params.verification === "string" ? params.verification : "";
  const responsibleFilter = typeof params.responsible === "string" ? params.responsible : "";

  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit =
    !!staff && ((OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role) || staff.system_role === "me_meal");
  const canCheck = !!staff && (staff.system_role === "me_meal" || isManagement(staff.system_role));
  const canApprove = !!staff && isManagement(staff.system_role);

  const [
    { data: indicators },
    { data: projects },
    { data: programmes },
    { data: staffList },
    { data: objectives },
    { data: outcomes },
    { data: outputs },
  ] = await Promise.all([
    supabase
      .from("indicators")
      .select(
        "*, project:projects(id, name), programme:programmes(id, name), responsible:staff!indicators_responsible_staff_id_fkey(full_name)",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, programme_id").is("archived_at", null).order("name"),
    supabase.from("programmes").select("id, name").is("archived_at", null).order("name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("objectives").select("id, name, code, project_id").is("archived_at", null),
    supabase.from("outcomes").select("id, name, code, objective_id").is("archived_at", null),
    supabase.from("outputs").select("id, name, code, outcome_id").is("archived_at", null),
  ]);

  const objectiveProjectById = new Map((objectives ?? []).map((o) => [o.id, o.project_id]));
  const outcomeProjectById = new Map(
    (outcomes ?? []).map((o) => [o.id, objectiveProjectById.get(o.objective_id) ?? ""]),
  );

  const objectiveOptions = (objectives ?? []).map((o) => ({
    id: o.id,
    label: `${o.code ? `${o.code} — ` : ""}${o.name}`,
    project_id: o.project_id,
  }));
  const outcomeOptions = (outcomes ?? []).map((o) => ({
    id: o.id,
    label: `${o.code ? `${o.code} — ` : ""}${o.name}`,
    project_id: outcomeProjectById.get(o.id) ?? "",
  }));
  const outputOptions = (outputs ?? []).map((o) => ({
    id: o.id,
    label: `${o.code ? `${o.code} — ` : ""}${o.name}`,
    project_id: outcomeProjectById.get(o.outcome_id) ?? "",
  }));

  const objectiveById = new Map((objectives ?? []).map((o) => [o.id, o]));
  const outcomeById = new Map((outcomes ?? []).map((o) => [o.id, o]));
  const outputById = new Map((outputs ?? []).map((o) => [o.id, o]));

  function resultLabel(resultType: string | null, resultId: string | null): string | null {
    if (!resultType || !resultId) return null;
    const source = resultType === "objective" ? objectiveById : resultType === "outcome" ? outcomeById : outputById;
    const entry = source.get(resultId) as { name: string } | undefined;
    return entry ? `${resultType[0].toUpperCase()}${resultType.slice(1)}: ${entry.name}` : null;
  }

  const allIndicators = indicators ?? [];
  const indicatorIds = allIndicators.map((i) => i.id);

  const measurementsQuery = indicatorIds.length
    ? supabase
        .from("indicator_measurements")
        .select("*, entered:staff!indicator_measurements_entered_by_fkey(full_name)")
        .in("indicator_id", indicatorIds)
        .order("created_at", { ascending: false })
    : null;
  const documentsQuery = indicatorIds.length
    ? supabase
        .from("documents")
        .select("*, uploader:staff!documents_created_by_fkey(full_name)")
        .eq("entity_type", "indicator")
        .in("entity_id", indicatorIds)
        .is("archived_at", null)
    : null;
  const historyQuery = indicatorIds.length
    ? supabase
        .from("audit_log")
        .select("id, action, created_at, entity_id, staff(full_name)")
        .eq("entity_type", "indicators")
        .in("entity_id", indicatorIds)
        .order("created_at", { ascending: false })
    : null;

  const [measurementsResult, documentsResult, historyResult] = await Promise.all([
    measurementsQuery,
    documentsQuery,
    historyQuery,
  ]);
  const measurements = measurementsResult?.data ?? [];
  const documents = documentsResult?.data ?? [];
  const history = historyResult?.data ?? [];

  const measurementsByIndicator = new Map<string, typeof measurements>();
  for (const m of measurements ?? []) {
    const list = measurementsByIndicator.get(m.indicator_id) ?? [];
    list.push(m);
    measurementsByIndicator.set(m.indicator_id, list);
  }
  const documentsByIndicator = new Map<string, NonNullable<typeof documents>>();
  for (const d of documents ?? []) {
    const list = documentsByIndicator.get(d.entity_id) ?? [];
    list.push(d);
    documentsByIndicator.set(d.entity_id, list);
  }
  const historyByIndicator = new Map<string, NonNullable<typeof history>>();
  for (const h of history ?? []) {
    const list = historyByIndicator.get(h.entity_id) ?? [];
    if (list.length < 5) list.push(h);
    historyByIndicator.set(h.entity_id, list);
  }

  const programmeIdByProject = new Map((projects ?? []).map((p) => [p.id, p.programme_id]));

  const filtered = allIndicators.filter((indicator) => {
    if (programmeFilter) {
      const project = indicator.project as { id: string } | null;
      const programme = indicator.programme as { id: string } | null;
      const effectiveProgrammeId = programme?.id ?? (project ? programmeIdByProject.get(project.id) : null);
      if (effectiveProgrammeId !== programmeFilter) return false;
    }
    if (projectFilter && (indicator.project as { id: string } | null)?.id !== projectFilter) return false;
    if (levelFilter && indicator.result_type !== levelFilter) return false;
    if (statusFilter && indicatorStatus(indicator.actual, indicator.target) !== statusFilter) return false;
    if (verificationFilter && indicator.verification_status !== verificationFilter) return false;
    if (responsibleFilter && indicator.responsible_staff_id !== responsibleFilter) return false;
    return true;
  });

  const summary = {
    total: filtered.length,
    onTrack: filtered.filter((i) => indicatorStatus(i.actual, i.target) === "on_track").length,
    atRisk: filtered.filter((i) => indicatorStatus(i.actual, i.target) === "at_risk").length,
    delayed: filtered.filter((i) => indicatorStatus(i.actual, i.target) === "delayed").length,
    achieved: filtered.filter((i) => indicatorStatus(i.actual, i.target) === "achieved").length,
    awaitingVerification: filtered.filter((i) => i.verification_status === "submitted" || i.verification_status === "under_review").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">M&amp;E / MEAL</h1>
        <p className="text-sm text-slate-500">
          {summary.total} indicator{summary.total === 1 ? "" : "s"} — achievement is computed live from
          actual/target, never entered separately.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryStat label="Indicators" value={summary.total} />
        <SummaryStat label="On Track" value={summary.onTrack} tone="green" />
        <SummaryStat label="At Risk" value={summary.atRisk} tone="amber" />
        <SummaryStat label="Delayed" value={summary.delayed} tone="red" />
        <SummaryStat label="Achieved" value={summary.achieved} tone="green" />
      </div>

      {canEdit && (
        <IndicatorForm
          projects={projects ?? []}
          programmes={programmes ?? []}
          staff={staffList ?? []}
          objectives={objectiveOptions}
          outcomes={outcomeOptions}
          outputs={outputOptions}
        />
      )}

      <form className="flex flex-wrap items-center gap-2 text-sm">
        <select name="programme" defaultValue={programmeFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">All programmes</option>
          {(programmes ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="project" defaultValue={projectFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">All projects</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="level" defaultValue={levelFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">All levels</option>
          {LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l} className="capitalize">{l}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select name="verification" defaultValue={verificationFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">All verification</option>
          {VERIFICATION_OPTIONS.map((v) => (
            <option key={v} value={v}>{v.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select name="responsible" defaultValue={responsibleFilter} className="rounded-md border border-slate-300 px-2 py-1">
          <option value="">Anyone responsible</option>
          {(staffList ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="space-y-3">
        {filtered.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            indicator={{
              ...indicator,
              resultLabel: resultLabel(indicator.result_type, indicator.result_id),
            }}
            canEdit={canEdit}
            canCheck={canCheck}
            canApprove={canApprove}
            measurements={measurementsByIndicator.get(indicator.id) ?? []}
            documents={documentsByIndicator.get(indicator.id) ?? []}
            history={historyByIndicator.get(indicator.id) ?? []}
            projects={projects ?? []}
            programmes={programmes ?? []}
            staff={staffList ?? []}
            objectives={objectiveOptions}
            outcomes={outcomeOptions}
            outputs={outputOptions}
          />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No indicators match this filter.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "green" | "amber" | "red" }) {
  const toneClasses = tone
    ? {
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        red: "border-red-200 bg-red-50 text-red-700",
      }[tone]
    : "border-slate-200 bg-white text-slate-900";
  return (
    <div className={`rounded-lg border p-3 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
