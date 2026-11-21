"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RouteMap } from "@/components/RouteMap";
import { loadProgress } from "@/lib/progress";

interface DailySummary {
  diveNumber: number;
  diveDate: string;
  label: string;
  status: string;
}

export function HomeHero() {
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [streak, setStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const progress = loadProgress();

    fetch("/api/daily")
      .then((r) => r.json())
      .then((data: DailySummary) => {
        if (cancelled) return;
        setDaily(data);
        setStreak(progress.streak);
        setDoneToday(Boolean(progress.resultsByDate[data.diveDate]));
      })
      .catch(() => {
        if (!cancelled) setDaily(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-16 pt-2">
      <section className="relative min-h-[78vh] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(160deg,rgba(13,115,119,0.14),rgba(255,255,255,0.35)_40%,rgba(212,146,42,0.12))] shadow-[var(--shadow)]">
        <RouteMap className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(243,247,248,0.15)_0%,rgba(243,247,248,0.55)_48%,rgba(243,247,248,0.92)_100%)]" />

        <div className="relative z-10 flex min-h-[78vh] flex-col justify-end p-6 sm:p-10 lg:p-14">
          <div className="animate-rise max-w-2xl space-y-5">
            <h1 className="display text-5xl leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Surplus
            </h1>
            <p className="max-w-xl text-base text-ink-soft sm:text-lg">
              Seven shared prompts a day. Rare answers ship farther across Pangaea — obvious ones barely leave
              the dock.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/play" className="btn-primary">
                {doneToday ? "View today’s results" : "Begin shipment"}
              </Link>
              <a
                className="btn-ghost"
                href="https://www.blueprintsforpangaea.org/"
                target="_blank"
                rel="noreferrer"
              >
                About B4P
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-8">
        <div className="flex flex-wrap gap-3 text-sm text-ink-soft">
          <span>
            Daily Shipment #{daily?.diveNumber ?? "—"} · {daily?.diveDate ?? "…"} · streak {streak}
          </span>
          <span className="font-semibold text-[#8a5b10]">Placeholder prompts until Rohan supplies finals</span>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Daily Shipment",
              body: "One attempt per calendar day. Resets at midnight America/New_York.",
            },
            {
              title: "Rarity scores",
              body: "Loading dock → One in a Pangaea. Pre-assigned tiers — speed doesn’t change points.",
            },
            {
              title: "Mission tone",
              body: "Medical surplus, logistics, chapters, and global health literacy — original B4P theme.",
            },
          ].map((item) => (
            <div key={item.title} className="animate-rise">
              <h2 className="display text-xl text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
