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
