import type { MathSequence } from "../types.js";
import { ALL_SEQUENCES } from "../data/sequences.js";

const EPOCH = new Date("2025-01-01T00:00:00Z").getTime();
const MS_PER_DAY = 86400000;

export function getDayNumber(): number {
  return Math.floor((Date.now() - EPOCH) / MS_PER_DAY);
}

export function getDailyDifficulty(dayNumber: number): 1 | 2 | 3 {
  const date = new Date(EPOCH + dayNumber * MS_PER_DAY);
  const jsDay = date.getUTCDay();
  if (jsDay >= 1 && jsDay <= 3) return 1;
  if (jsDay >= 4 && jsDay <= 5) return 2;
  return 3;
}

export function getDailySequence(dayNumber: number): MathSequence {
  const difficulty = getDailyDifficulty(dayNumber);
  const pool = ALL_SEQUENCES.filter((s) => s.difficulty === difficulty);
  const hash = Math.imul(dayNumber, 2654435761) >>> 0;
  const index = hash % pool.length;
  return pool[index];
}

export function getTimeUntilNextPuzzle(): { hours: number; minutes: number; seconds: number } {
  const now = Date.now();
  const currentDay = getDayNumber();
  const nextDayStart = EPOCH + (currentDay + 1) * MS_PER_DAY;
  const diff = Math.max(0, nextDayStart - now);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
