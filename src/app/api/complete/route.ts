import { NextResponse } from "next/server";

import { SAMPLE_DAILY_PROMPT_IDS } from "../../../../content/placeholder-prompts";
import { getDiveDate, getDiveNumber } from "@/lib/daily";
import { buildShareText } from "@/lib/share";
import { buildStudySheet } from "@/lib/scoring";
import { dayBand, pointsToKm } from "@/lib/tiers";
import type { PromptResult } from "@/lib/types";

interface CompleteBody {
  diveDate?: string;
  prompts?: Array<{
    promptId: string;
    guess: string;
    accepted: boolean;
    points: number;
    tier: PromptResult["tier"];
    tierLabel: PromptResult["tierLabel"];
    canonical: string | null;
    isGem: boolean;
    timedOut: boolean;
  }>;
}

export async function POST(request: Request) {
  let body: CompleteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const today = getDiveDate();
  if (body.diveDate && body.diveDate !== today) {
    return NextResponse.json(
      { error: "This shipment has closed. Reload for today’s Daily Shipment.", code: "DIVE_EXPIRED" },
      { status: 409 },
    );
  }

  if (!Array.isArray(body.prompts) || body.prompts.length !== 7) {
    return NextResponse.json({ error: "Expected 7 prompt results." }, { status: 400 });
  }

  const diveNumber = getDiveNumber(today);
  const promptMeta = SAMPLE_DAILY_PROMPT_IDS.map((id, i) => ({ id, index: i + 1 }));

  const prompts: PromptResult[] = body.prompts.map((p, i) => ({
    promptId: p.promptId,
    index: promptMeta[i]?.index ?? i + 1,
    text: "",
    guess: p.guess,
    accepted: Boolean(p.accepted),
    points: Number(p.points) || 0,
    tier: p.tier ?? null,
    tierLabel: p.tierLabel ?? null,
    canonical: p.canonical ?? null,
    isGem: Boolean(p.isGem),
    timedOut: Boolean(p.timedOut),
  }));

  // Re-validate totals from submitted accepted scores (client already scored via API).
  const totalPoints = prompts.reduce((sum, p) => sum + (p.accepted ? p.points : 0), 0);
  const { band, bandLabel } = dayBand(totalPoints);
  const shareText = buildShareText({ diveNumber, diveDate: today, totalPoints, prompts });

  const studySheet = buildStudySheet(SAMPLE_DAILY_PROMPT_IDS);

  // Attach prompt text from study sheet for results UI.
  const withText = prompts.map((p, i) => ({
    ...p,
    text: studySheet[i]?.text ?? "",
  }));

  return NextResponse.json({
    diveDate: today,
    diveNumber,
    totalPoints,
    kmShipped: pointsToKm(totalPoints),
    band,
    bandLabel,
    prompts: withText,
    shareText,
    status: "placeholder",
    studySheet,
  });
}
