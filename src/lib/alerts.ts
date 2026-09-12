import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { safePercent, achievementLabel, budgetUtilization, riskRating } from "@/lib/calculations";

export type Alert = { message: string; href: string; severity: "warning" | "critical" };

/**
 * Computed on every read from the same tables everything else uses — no
 * separate notifications table to keep in sync, per the "enter once, use
 * everywhere" principle. Deliberately capped per category so this stays a
 * short, actionable list rather than a firehose.
 */
export async function getManagementAlerts(supabase: SupabaseClient<Database>): Promise<Alert[]> {
  const alerts: Alert[] = [];

  const [
    { data: delayedActivities },
    { data: overdueTasks },
    { data: budgets },
    { data: risks },
    { data: indicators },
    { data: overdueActions },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("id, name, project_id, project:projects(id, name)")
      .eq("status", "delayed")
      .is("archived_at", null)
      .limit(5),
    supabase
      .from("tasks")
      .select("id, name, due_date, activity:activities(project_id)")
      .lt("due_date", new Date().toISOString().slice(0, 10))
      .neq("status", "completed")
      .is("archived_at", null)
      .limit(5),
    supabase
      .from("budgets")
      .select("id, project_id, approved_budget, project:projects(name), budget_lines(amount, expenditures(amount))")
      .is("archived_at", null),
    supabase
      .from("risks")
      .select("id, title, likelihood, impact, project_id, programme_id")
      .in("status", ["open", "mitigating"])
      .is("archived_at", null),
    supabase
      .from("indicators")
      .select("id, name, actual, target, project_id, programme_id")
      .is("archived_at", null),
    supabase
      .from("governance_actions")
      .select("id, action_description, due_date")
      .lt("due_date", new Date().toISOString().slice(0, 10))
      .not("status", "in", "(completed,cancelled)")
      .is("archived_at", null)
      .limit(5),
  ]);

  for (const a of delayedActivities ?? []) {
    const project = a.project as { id: string; name: string } | null;
    alerts.push({
      message: `Activity "${a.name}" is delayed${project ? ` (${project.name})` : ""}.`,
      href: project ? `/projects/${project.id}` : "/activities",
      severity: "warning",
    });
  }

  for (const t of overdueTasks ?? []) {
    const projectId = (t.activity as { project_id: string } | null)?.project_id;
    alerts.push({
      message: `Task "${t.name}" is overdue (due ${t.due_date}).`,
      href: projectId ? `/projects/${projectId}` : "/my-work",
      severity: "critical",
    });
  }

  for (const b of budgets ?? []) {
    const lines = (b.budget_lines ?? []) as { amount: number; expenditures: { amount: number }[] }[];
    const expenditure = lines.reduce((sum, l) => sum + l.expenditures.reduce((s, e) => s + e.amount, 0), 0);
    const pct = budgetUtilization(expenditure, b.approved_budget);
    if (pct != null && pct >= 80) {
      const project = b.project as { name: string } | null;
      alerts.push({
        message: `${project?.name ?? "A project"}'s budget is ${pct}% utilized.`,
        href: `/finance/${b.project_id}`,
        severity: pct >= 100 ? "critical" : "warning",
      });
    }
  }

  for (const r of risks ?? []) {
    const rating = riskRating(r.likelihood, r.impact);
    if (rating.label === "high" || rating.label === "critical") {
      alerts.push({
        message: `${rating.label === "critical" ? "Critical" : "High"} risk: "${r.title}".`,
        href: "/risks",
        severity: rating.label === "critical" ? "critical" : "warning",
      });
    }
  }

  for (const i of indicators ?? []) {
    const pct = safePercent(i.actual, i.target);
    if (achievementLabel(pct) === "off_track") {
      alerts.push({
        message: `Indicator "${i.name}" is off track (${pct}% of target).`,
        href: "/me-meal",
        severity: "warning",
      });
    }
  }

  for (const a of overdueActions ?? []) {
    alerts.push({
      message: `Governance action "${a.action_description}" is overdue (due ${a.due_date}).`,
      href: "/governance",
      severity: "critical",
    });
  }

  return alerts.slice(0, 12);
}
