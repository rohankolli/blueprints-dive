import { NextResponse } from "next/server";

import { getDiveDate } from "@/lib/daily";
import { scoreGuess } from "@/lib/scoring";

export async function POST(request: Request) {
  let body: { diveDate?: string; promptId?: string; guess?: string };
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

  if (!body.promptId || typeof body.guess !== "string") {
    return NextResponse.json({ error: "promptId and guess are required." }, { status: 400 });
  }

  const result = scoreGuess(body.promptId, body.guess);
  return NextResponse.json(result);
}
