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

const RISK_LEVEL_SCORE: Record<"low" | "medium" | "high", number> = { low: 1, medium: 2, high: 3 };

/** Likelihood x impact -> a simple 3-band rating, used for sorting/badging the risk register. */
export function riskRating(likelihood: "low" | "medium" | "high", impact: "low" | "medium" | "high") {
  const score = RISK_LEVEL_SCORE[likelihood] * RISK_LEVEL_SCORE[impact];
  if (score >= 6) return { label: "critical" as const, score };
  if (score >= 3) return { label: "high" as const, score };
  if (score >= 2) return { label: "medium" as const, score };
  return { label: "low" as const, score };
}
