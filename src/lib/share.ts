import { MISS_GLYPH, TIER_GLYPHS, dayBand, pointsToKm } from "./tiers";
import type { PromptResult, TierKey } from "./types";

export function buildShareText(args: {
  diveNumber: number;
  diveDate: string;
  totalPoints: number;
  prompts: PromptResult[];
}): string {
  const { bandLabel } = dayBand(args.totalPoints);
  const row = args.prompts
    .map((p) => {
      if (!p.accepted || !p.tier) return MISS_GLYPH;
      return TIER_GLYPHS[p.tier as TierKey] ?? MISS_GLYPH;
    })
    .join("");

  return [
    `Surplus #${args.diveNumber} · Daily Shipment`,
    `${args.totalPoints}/700 · ${pointsToKm(args.totalPoints)} km · ${bandLabel}`,
    row,
    "Play at blueprints-dive — Blueprints for Pangaea",
  ].join("\n");
}
