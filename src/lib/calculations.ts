/** Safe percentage: null/zero/missing targets never produce NaN or Infinity. */
export function safePercent(actual: number | null | undefined, target: number | null | undefined): number | null {
  if (actual == null || target == null || target <= 0) return null;
  const pct = (actual / target) * 100;
  if (!Number.isFinite(pct)) return null;
  return Math.min(Math.round(pct * 10) / 10, 999);
}

export function achievementLabel(pct: number | null): "on_track" | "at_risk" | "off_track" | "unknown" {
  if (pct == null) return "unknown";
  if (pct >= 90) return "on_track";
  if (pct >= 60) return "at_risk";
  return "off_track";
}

/**
 * M&E indicator status — purely computed from actual/target, never a
 * separately-entered field, so it can never drift out of sync with the
 * numbers behind it. Rule: no actual recorded yet -> not started; then
 * banded by achievement percentage. There is no manual override because
 * no such field exists on the indicator record.
 */
export type IndicatorStatus = "not_started" | "achieved" | "on_track" | "at_risk" | "delayed";

export function indicatorStatus(actual: number | null, target: number | null): IndicatorStatus {
  if (actual == null) return "not_started";
  const pct = safePercent(actual, target);
  if (pct == null) return "not_started";
  if (pct >= 100) return "achieved";
  if (pct >= 75) return "on_track";
  if (pct >= 40) return "at_risk";
  return "delayed";
}

const RISK_LEVEL_SCORE: Record<"low" | "medium" | "high", number> = { low: 1, medium: 2, high: 3 };

/** Likelihood x impact -> a simple 3-band rating, used for sorting/badging the risk register. */
export function riskRating(likelihood: "low" | "medium" | "high", impact: "low" | "medium" | "high") {
  const score = RISK_LEVEL_SCORE[likelihood] * RISK_LEVEL_SCORE[impact];
  if (score >= 6) return { label: "critical" as const, score };
  if (score >= 3) return { label: "high" as const, score };
  if (score >= 2) return { label: "medium" as const, score };
  return { label: "low" as const, score };
}

/** Budget utilization = expenditure / approved budget x 100, safe against a zero/missing budget. */
export function budgetUtilization(expenditure: number, approvedBudget: number): number | null {
  return safePercent(expenditure, approvedBudget);
}

export function budgetRemaining(approvedBudget: number, expenditure: number, commitments: number): number {
  return approvedBudget - expenditure - commitments;
}

export function utilizationSeverity(pct: number | null): "ok" | "warning" | "critical" {
  if (pct == null) return "ok";
  if (pct >= 100) return "critical";
  if (pct >= 80) return "warning";
  return "ok";
}

/**
 * Currency-aware money formatting — finance amounts must never be shown
 * with a hard-coded "$" regardless of the record's actual currency field.
 * Falls back to a plain "<code> <amount>" if the code isn't a real
 * ISO 4217 currency Intl recognizes (defensive only, not expected in
 * practice — currency is a free-text field on the budget).
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
