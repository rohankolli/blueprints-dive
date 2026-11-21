import "server-only";

import { PLACEHOLDER_PROMPTS } from "../../content/placeholder-prompts";
import { normalizeAnswer, levenshtein, typoThreshold } from "./normalize";
import { TIER_LABELS, TIER_POINTS, pointsToKm } from "./tiers";
import type { AnswerDef, PromptDef, ScoreResult, TierKey } from "./types";

const promptById = new Map(PLACEHOLDER_PROMPTS.map((p) => [p.id, p]));

export function getPrompt(promptId: string): PromptDef | undefined {
  return promptById.get(promptId);
}

export function listPromptsByIds(ids: string[]): PromptDef[] {
  return ids
    .map((id) => promptById.get(id))
    .filter((p): p is PromptDef => Boolean(p));
}

interface MatchHit {
  answer: AnswerDef;
  via: "exact" | "alias" | "fuzzy";
}

function buildLookup(answers: AnswerDef[]): Map<string, AnswerDef> {
  const map = new Map<string, AnswerDef>();
  for (const answer of answers) {
    map.set(normalizeAnswer(answer.canonical), answer);
    for (const alias of answer.aliases ?? []) {
      map.set(normalizeAnswer(alias), answer);
    }
  }
  return map;
}

function fuzzyMatch(normalized: string, answers: AnswerDef[]): MatchHit | null {
  if (!normalized) return null;
  const threshold = typoThreshold(normalized.length);
  if (threshold === 0) return null;

  let best: MatchHit | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const answer of answers) {
    const candidates = [answer.canonical, ...(answer.aliases ?? [])].map(normalizeAnswer);
    for (const candidate of candidates) {
      if (Math.abs(candidate.length - normalized.length) > threshold) continue;
      const dist = levenshtein(normalized, candidate);
      if (dist > 0 && dist <= threshold && dist < bestDist) {
        bestDist = dist;
        best = { answer, via: "fuzzy" };
      }
    }
  }

  return best;
}

export function scoreGuess(promptId: string, guess: string): ScoreResult {
  const prompt = getPrompt(promptId);
  if (!prompt) {
    return {
      accepted: false,
      points: 0,
      tier: null,
      tierLabel: null,
      canonical: null,
      isGem: false,
      kmShipped: 0,
      message: "Unknown prompt.",
    };
  }

  const normalized = normalizeAnswer(guess);
  if (!normalized) {
    return {
      accepted: false,
      points: 0,
      tier: null,
      tierLabel: null,
      canonical: null,
      isGem: false,
      kmShipped: 0,
      message: "Enter an answer before the clock runs out.",
    };
  }

  const lookup = buildLookup(prompt.answers);
  let hit: MatchHit | null = null;

  const exact = lookup.get(normalized);
  if (exact) {
    hit = {
      answer: exact,
      via: normalizeAnswer(exact.canonical) === normalized ? "exact" : "alias",
    };
  } else {
    hit = fuzzyMatch(normalized, prompt.answers);
  }

  if (!hit) {
    return {
      accepted: false,
      points: 0,
      tier: null,
      tierLabel: null,
      canonical: null,
      isGem: false,
      kmShipped: 0,
      message: "No match in the manifest — try another angle while time remains.",
    };
  }

  const tier = hit.answer.tier as TierKey;
  const points = TIER_POINTS[tier];
  const isGem = Boolean(hit.answer.isGem) || tier === "pangaea";

  return {
    accepted: true,
    points,
    tier,
    tierLabel: TIER_LABELS[tier],
    canonical: hit.answer.canonical,
    isGem,
    kmShipped: pointsToKm(points),
    message:
      hit.via === "fuzzy"
        ? `Matched as “${hit.answer.canonical}” — ${TIER_LABELS[tier]}.`
        : `${TIER_LABELS[tier]} — shipped ${pointsToKm(points)} km.`,
  };
}

/** Study sheet only after a completed dive (server-gated). */
export function buildStudySheet(promptIds: string[]) {
  return promptIds.map((id) => {
    const prompt = getPrompt(id);
    if (!prompt) return { id, text: "", answers: [] as Array<{ canonical: string; tier: TierKey; points: number; isGem: boolean }> };
    return {
      id: prompt.id,
      text: prompt.text,
      qualifier: prompt.qualifier,
      answers: prompt.answers
        .map((a) => ({
          canonical: a.canonical,
          tier: a.tier,
          points: TIER_POINTS[a.tier],
          isGem: Boolean(a.isGem),
        }))
        .sort((a, b) => b.points - a.points),
    };
  });
}
