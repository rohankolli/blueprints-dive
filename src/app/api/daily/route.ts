import { NextResponse } from "next/server";

import {
  PLACEHOLDER_PROMPTS,
  SAMPLE_DAILY_PROMPT_IDS,
} from "../../../../content/placeholder-prompts";
import { getDiveDate, getDiveNumber, getNextResetIso, RESET_TIMEZONE } from "@/lib/daily";
import type { DailyMeta } from "@/lib/types";

export async function GET() {
  const diveDate = getDiveDate();
  const diveNumber = getDiveNumber(diveDate);

  const prompts = SAMPLE_DAILY_PROMPT_IDS.map((id, index) => {
    const prompt = PLACEHOLDER_PROMPTS.find((p) => p.id === id)!;
    return {
      id: prompt.id,
      index: index + 1,
      text: prompt.text,
      qualifier: prompt.qualifier,
      themeTags: prompt.themeTags,
      status: prompt.status,
    };
  });

  const payload: DailyMeta & { nextResetIso: string; timerSeconds: number } = {
    diveDate,
    diveNumber,
    timezone: RESET_TIMEZONE,
    status: "placeholder",
    label: "Sample Shipment (placeholder prompts)",
    prompts,
    nextResetIso: getNextResetIso(),
    timerSeconds: 25,
  };

  return NextResponse.json(payload);
}
