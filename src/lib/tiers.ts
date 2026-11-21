import type { TierKey } from "./types";

export const TIER_POINTS: Record<TierKey, number> = {
  dock: 10,
  clever: 15,
  aisle: 30,
  warehouse: 60,
  crate: 85,
  pangaea: 100,
};

export const TIER_LABELS: Record<TierKey, string> = {
  dock: "Loading dock",
  clever: "Clever SKU",
  aisle: "Common aisle",
  warehouse: "Deep warehouse",
  crate: "Overseas crate",
  pangaea: "One in a Pangaea",
};

/** Share-row glyphs (original to Surplus — not Krillion emoji sets). */
export const TIER_GLYPHS: Record<TierKey, string> = {
  dock: "📦",
  clever: "🏷️",
  aisle: "🗂️",
  warehouse: "🏭",
  crate: "🚢",
  pangaea: "🌐",
};

export const MISS_GLYPH = "⬜";

export const KM_PER_POINT = 10;

export function pointsToKm(points: number): number {
  return points * KM_PER_POINT;
}

export function dayBand(totalPoints: number): { band: string; bandLabel: string } {
  if (totalPoints >= 450) {
    return { band: "pangaea", bandLabel: "One in a Pangaea" };
  }
  if (totalPoints >= 351) {
    return { band: "crate", bandLabel: "Overseas crate" };
  }
  if (totalPoints >= 251) {
    return { band: "warehouse", bandLabel: "Deep warehouse" };
  }
  if (totalPoints >= 151) {
    return { band: "aisle", bandLabel: "Common aisle" };
  }
  return { band: "dock", bandLabel: "Loading dock" };
}
