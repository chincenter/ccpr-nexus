import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  // green — on track / completed
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  on_track: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  // yellow — at risk / delayed
  delayed: "bg-amber-50 text-amber-700 ring-amber-600/20",
  at_risk: "bg-amber-50 text-amber-700 ring-amber-600/20",
  blocked: "bg-amber-50 text-amber-700 ring-amber-600/20",
  submitted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  under_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
  on_hold: "bg-amber-50 text-amber-700 ring-amber-600/20",
  // red — critical / off track / cancelled
  critical: "bg-red-50 text-red-700 ring-red-600/20",
  off_track: "bg-red-50 text-red-700 ring-red-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  // blue — informational / ongoing
  ongoing: "bg-blue-50 text-blue-700 ring-blue-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-600/20",
  planning: "bg-blue-50 text-blue-700 ring-blue-600/20",
  draft: "bg-blue-50 text-blue-700 ring-blue-600/20",
  // grey — not started
  not_started: "bg-slate-100 text-slate-600 ring-slate-500/20",
  // attendance
  present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  remote: "bg-blue-50 text-blue-700 ring-blue-600/20",
  field_duty: "bg-blue-50 text-blue-700 ring-blue-600/20",
  leave: "bg-amber-50 text-amber-700 ring-amber-600/20",
  absent: "bg-red-50 text-red-700 ring-red-600/20",
  // risk status
  open: "bg-amber-50 text-amber-700 ring-amber-600/20",
  mitigating: "bg-blue-50 text-blue-700 ring-blue-600/20",
  monitoring: "bg-slate-100 text-slate-600 ring-slate-500/20",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  // Phase 4: humanitarian / mine action / health / governance statuses
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cleared: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  completed_referral: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  engaged: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  assisted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  reported: "bg-amber-50 text-amber-700 ring-amber-600/20",
  under_verification: "bg-amber-50 text-amber-700 ring-amber-600/20",
  referred: "bg-amber-50 text-amber-700 ring-amber-600/20",
  planned: "bg-blue-50 text-blue-700 ring-blue-600/20",
  not_referred: "bg-slate-100 text-slate-600 ring-slate-500/20",
  not_engaged: "bg-slate-100 text-slate-600 ring-slate-500/20",
  not_assessed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  ineligible: "bg-slate-100 text-slate-600 ring-slate-500/20",
  false_alarm: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        style,
      )}
    >
      {labelize(status)}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
      DEMO DATA — NOT REAL CCPR DATA
    </span>
  );
}
