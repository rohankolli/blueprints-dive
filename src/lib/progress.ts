import type { DayResult } from "./types";

const STORAGE_KEY = "surplus.guest.v1";

export interface GuestProgress {
  playerId: string;
  streak: number;
  lastCompletedDate: string | null;
  resultsByDate: Record<string, DayResult>;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyProgress(): GuestProgress {
  return {
    playerId: randomId(),
    streak: 0,
    lastCompletedDate: null,
    resultsByDate: {},
  };
}

export function loadProgress(): GuestProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = emptyProgress();
      saveProgress(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as GuestProgress;
    if (!parsed.playerId) parsed.playerId = randomId();
    if (!parsed.resultsByDate) parsed.resultsByDate = {};
    return parsed;
  } catch {
    const fresh = emptyProgress();
    saveProgress(fresh);
    return fresh;
  }
}

export function saveProgress(progress: GuestProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function previousCalendarDate(diveDate: string): string {
  const [y, m, d] = diveDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

export function recordCompletion(diveDate: string, result: DayResult): GuestProgress {
  const progress = loadProgress();
  progress.resultsByDate[diveDate] = result;

  if (progress.lastCompletedDate === diveDate) {
    // Already counted — keep streak.
  } else if (progress.lastCompletedDate === previousCalendarDate(diveDate)) {
    progress.streak += 1;
  } else {
    progress.streak = 1;
  }

  progress.lastCompletedDate = diveDate;
  saveProgress(progress);
  return progress;
}

export function hasCompletedToday(diveDate: string): boolean {
  const progress = loadProgress();
  return Boolean(progress.resultsByDate[diveDate]);
}
