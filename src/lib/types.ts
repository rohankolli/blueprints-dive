export type TierKey = "dock" | "clever" | "aisle" | "warehouse" | "crate" | "pangaea";

export type PromptStatus = "placeholder" | "approved";

export interface AnswerDef {
  canonical: string;
  tier: TierKey;
  aliases?: string[];
  isGem?: boolean;
}

export interface PromptDef {
  id: string;
  text: string;
  qualifier?: string;
  themeTags: string[];
  status: PromptStatus;
  answers: AnswerDef[];
}

export interface DailyMeta {
  diveDate: string;
  diveNumber: number;
  timezone: string;
  status: PromptStatus;
  label: string;
  prompts: Array<{
    id: string;
    index: number;
    text: string;
    qualifier?: string;
    themeTags: string[];
    status: PromptStatus;
  }>;
}

export interface ScoreResult {
  accepted: boolean;
  points: number;
  tier: TierKey | null;
  tierLabel: string | null;
  canonical: string | null;
  isGem: boolean;
  kmShipped: number;
  message: string;
}

export interface PromptResult {
  promptId: string;
  index: number;
  text: string;
  guess: string;
  accepted: boolean;
  points: number;
  tier: TierKey | null;
  tierLabel: string | null;
  canonical: string | null;
  isGem: boolean;
  timedOut: boolean;
}

export interface DayResult {
  diveDate: string;
  diveNumber: number;
  totalPoints: number;
  kmShipped: number;
  band: string;
  bandLabel: string;
  prompts: PromptResult[];
  shareText: string;
  status: PromptStatus;
}
