import Link from "next/link";
import { StatusBadge, DemoBadge } from "@/components/StatusBadge";

export function ProjectCard({
  id,
  code,
  name,
  description,
  isDemo,
  status,
  programmeId,
  programmeName,
  officerName,
  progress,
  budget,
  activitiesCount,
  tasksCount,
  teamCount,
  locationsCount,
}: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isDemo: boolean;
  status: string;
  programmeId: string | null;
  programmeName: string | null;
  officerName: string | null;
  progress: number | null;
  budget: number | null;
  activitiesCount: number;
  tasksCount: number;
  teamCount: number;
  locationsCount: number;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm">
      {programmeName && (
        <div className="mb-1">
          {programmeId ? (
            <Link href={`/programmes/${programmeId}`} className="text-xs font-medium text-slate-500 hover:text-teal-700 hover:underline">
              {programmeName}
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-500">{programmeName}</span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/projects/${id}`} className="font-semibold text-slate-900 hover:text-teal-800 hover:underline">
            {name}
          </Link>
          <p className="font-mono text-xs text-slate-500">{code}</p>
        </div>
        {isDemo && <DemoBadge />}
      </div>

      {description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{description}</p>}

      <div className="mt-3 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-slate-500">Project Officer</p>
          <p className="text-slate-800">{officerName ?? "Unassigned"}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{progress != null ? `${progress}%` : "Not started"}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(progress ?? 0, 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
        <MetricStat label="Activities" value={activitiesCount} />
        <MetricStat label="Tasks" value={tasksCount} />
        <MetricStat label="Team" value={teamCount} />
        <MetricStat label="Locations" value={locationsCount} />
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-slate-500">Budget</p>
          <p className="text-sm font-semibold text-slate-900">
            {budget != null ? `$${budget.toLocaleString()}` : "—"}
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Open Project →
        </Link>
      </div>
    </div>
  );
}

function MetricStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
