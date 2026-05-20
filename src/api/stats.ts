import { request } from "./client";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDate: string;
}

export interface FamilyBreakdown {
  family: string;
  label: string;
  played: number;
  won: number;
  winRate: number;
  avgGuesses: number;
}

export interface DifficultyBreakdown {
  difficulty: number;
  label: string;
  played: number;
  won: number;
  winRate: number;
  avgGuesses: number;
}

export interface Insight {
  type: "strength" | "weakness" | "tip" | "milestone";
  title: string;
  description: string;
}

export interface Suggestion {
  action: string;
  reason: string;
  difficulty: 1 | 2 | 3;
  family?: string;
}

export interface AnalyticsData {
  overview: GameStats & { winRate: number };
  guessDistribution: number[];
  familyBreakdown: FamilyBreakdown[];
  difficultyBreakdown: DifficultyBreakdown[];
  recentGames: { sequenceName: string; family: string; difficulty: number; won: boolean; guessCount: number; playedAt: string }[];
  guessPatterns: { tooHigh: number; tooLow: number; correct: number; total: number };
  insights: Insight[];
  suggestions: Suggestion[];
}

export async function getStats(): Promise<{ stats: GameStats }> {
  return request<{ stats: GameStats }>("/stats");
}

export async function mergeStats(localStats: GameStats): Promise<{ stats: GameStats }> {
  return request<{ stats: GameStats }>("/stats/merge", {
    method: "PUT",
    body: JSON.stringify({ localStats }),
  });
}

export async function getHistory(): Promise<{ history: unknown[] }> {
  return request<{ history: unknown[] }>("/stats/history");
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return request<AnalyticsData>("/stats/analytics");
}
