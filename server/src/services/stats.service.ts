import { pool } from "../db/pool.js";
import type { GameStats, GuessRecord } from "../types.js";
import { ALL_SEQUENCES, FAMILY_LABELS } from "../data/sequences.js";

function defaultStats(): GameStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: "",
  };
}

export async function getStats(userId: number): Promise<GameStats> {
  const result = await pool.query(
    `SELECT games_played, games_won, current_streak, max_streak, guess_distribution, last_played_date
     FROM user_stats WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) return defaultStats();

  const row = result.rows[0];
  return {
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    currentStreak: row.current_streak,
    maxStreak: row.max_streak,
    guessDistribution: row.guess_distribution || [0, 0, 0, 0, 0, 0],
    lastPlayedDate: row.last_played_date || "",
  };
}

export async function mergeStats(userId: number, localStats: GameStats): Promise<GameStats> {
  const serverStats = await getStats(userId);

  if (serverStats.gamesPlayed > 0) return serverStats;

  const MAX_MERGE_GAMES = 20;
  const cappedPlayed = Math.min(localStats.gamesPlayed, MAX_MERGE_GAMES);
  const cappedWon = Math.min(localStats.gamesWon, cappedPlayed);
  const cappedStreak = Math.min(localStats.currentStreak, cappedPlayed);
  const cappedMaxStreak = Math.min(localStats.maxStreak, cappedPlayed);
  const cappedDist = localStats.guessDistribution.map(v => Math.min(Math.max(v, 0), cappedWon));

  const distSum = cappedDist.reduce((a, b) => a + b, 0);
  const finalDist = distSum > cappedWon
    ? cappedDist.map(() => 0)
    : cappedDist;

  await pool.query(
    `UPDATE user_stats SET
       games_played = $1,
       games_won = $2,
       current_streak = $3,
       max_streak = $4,
       guess_distribution = $5,
       last_played_date = $6,
       updated_at = NOW()
     WHERE user_id = $7`,
    [cappedPlayed, cappedWon, cappedStreak, cappedMaxStreak, finalDist, localStats.lastPlayedDate || "", userId]
  );

  return getStats(userId);
}

export async function getGameHistory(userId: number, limit = 20) {
  const result = await pool.query(
    `SELECT mode, day_number, sequence_id, difficulty, won, guess_count, played_at
     FROM game_results WHERE user_id = $1
     ORDER BY played_at DESC LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map(r => ({
    mode: r.mode,
    dayNumber: r.day_number,
    sequenceId: r.sequence_id,
    difficulty: r.difficulty,
    won: r.won,
    guessCount: r.guess_count,
    playedAt: r.played_at,
  }));
}

interface FamilyBreakdown {
  family: string;
  label: string;
  played: number;
  won: number;
  winRate: number;
  avgGuesses: number;
}

interface DifficultyBreakdown {
  difficulty: number;
  label: string;
  played: number;
  won: number;
  winRate: number;
  avgGuesses: number;
}

interface Insight {
  type: "strength" | "weakness" | "tip" | "milestone";
  title: string;
  description: string;
}

interface Suggestion {
  action: string;
  reason: string;
  difficulty: 1 | 2 | 3;
  family?: string;
}

export interface AnalyticsResponse {
  overview: GameStats & { winRate: number };
  guessDistribution: number[];
  familyBreakdown: FamilyBreakdown[];
  difficultyBreakdown: DifficultyBreakdown[];
  recentGames: { sequenceName: string; family: string; difficulty: number; won: boolean; guessCount: number; playedAt: string }[];
  guessPatterns: { tooHigh: number; tooLow: number; correct: number; total: number };
  insights: Insight[];
  suggestions: Suggestion[];
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

export async function getAnalytics(userId: number): Promise<AnalyticsResponse> {
  const [statsResult, gamesResult, sessionsResult] = await Promise.all([
    pool.query(
      `SELECT games_played, games_won, current_streak, max_streak, guess_distribution, last_played_date
       FROM user_stats WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT sequence_id, difficulty, won, guess_count, guesses, played_at, mode
       FROM game_results WHERE user_id = $1 ORDER BY played_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT guesses, sequence_id FROM game_sessions WHERE user_id = $1 AND status != 'playing'`,
      [userId]
    ),
  ]);

  const statsRow = statsResult.rows[0];
  const stats: GameStats = statsRow ? {
    gamesPlayed: statsRow.games_played,
    gamesWon: statsRow.games_won,
    currentStreak: statsRow.current_streak,
    maxStreak: statsRow.max_streak,
    guessDistribution: statsRow.guess_distribution || [0, 0, 0, 0, 0, 0],
    lastPlayedDate: statsRow.last_played_date || "",
  } : defaultStats();

  const seqMap = new Map(ALL_SEQUENCES.map(s => [s.id, s]));

  const familyMap = new Map<string, { played: number; won: number; totalGuesses: number }>();
  const diffMap = new Map<number, { played: number; won: number; totalGuesses: number }>();

  let tooHigh = 0;
  let tooLow = 0;
  let correct = 0;
  let totalGuessRecords = 0;

  for (const game of gamesResult.rows) {
    const seq = seqMap.get(game.sequence_id);
    const family = seq?.family || "unknown";

    if (!familyMap.has(family)) familyMap.set(family, { played: 0, won: 0, totalGuesses: 0 });
    const fEntry = familyMap.get(family)!;
    fEntry.played++;
    if (game.won) fEntry.won++;
    fEntry.totalGuesses += game.guess_count;

    if (!diffMap.has(game.difficulty)) diffMap.set(game.difficulty, { played: 0, won: 0, totalGuesses: 0 });
    const dEntry = diffMap.get(game.difficulty)!;
    dEntry.played++;
    if (game.won) dEntry.won++;
    dEntry.totalGuesses += game.guess_count;

    const guesses: GuessRecord[] = game.guesses || [];
    for (const g of guesses) {
      totalGuessRecords++;
      if (g.result === "correct") correct++;
      else if (g.result === "higher") tooLow++;
      else tooHigh++;
    }
  }

  const familyBreakdown: FamilyBreakdown[] = [];
  for (const [family, data] of familyMap) {
    familyBreakdown.push({
      family,
      label: FAMILY_LABELS[family] || family,
      played: data.played,
      won: data.won,
      winRate: data.played > 0 ? Math.round((data.won / data.played) * 100) : 0,
      avgGuesses: data.played > 0 ? Math.round((data.totalGuesses / data.played) * 10) / 10 : 0,
    });
  }
  familyBreakdown.sort((a, b) => b.played - a.played);

  const difficultyBreakdown: DifficultyBreakdown[] = [];
  for (const diff of [1, 2, 3]) {
    const data = diffMap.get(diff);
    if (data) {
      difficultyBreakdown.push({
        difficulty: diff,
        label: DIFFICULTY_LABELS[diff],
        played: data.played,
        won: data.won,
        winRate: data.played > 0 ? Math.round((data.won / data.played) * 100) : 0,
        avgGuesses: data.played > 0 ? Math.round((data.totalGuesses / data.played) * 10) / 10 : 0,
      });
    }
  }

  const recentGames = gamesResult.rows.slice(0, 10).map(g => {
    const seq = seqMap.get(g.sequence_id);
    return {
      sequenceName: seq?.name || g.sequence_id,
      family: seq ? (FAMILY_LABELS[seq.family] || seq.family) : "Unknown",
      difficulty: g.difficulty,
      won: g.won,
      guessCount: g.guess_count,
      playedAt: g.played_at,
    };
  });

  const insights = generateInsights(stats, familyBreakdown, difficultyBreakdown, { tooHigh, tooLow, correct, total: totalGuessRecords });
  const suggestions = generateSuggestions(stats, familyBreakdown, difficultyBreakdown);

  return {
    overview: { ...stats, winRate: stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0 },
    guessDistribution: stats.guessDistribution,
    familyBreakdown,
    difficultyBreakdown,
    recentGames,
    guessPatterns: { tooHigh, tooLow, correct, total: totalGuessRecords },
    insights,
    suggestions,
  };
}

function generateInsights(
  stats: GameStats,
  families: FamilyBreakdown[],
  difficulties: DifficultyBreakdown[],
  patterns: { tooHigh: number; tooLow: number; correct: number; total: number },
): Insight[] {
  const insights: Insight[] = [];

  if (stats.gamesPlayed === 0) return [{ type: "tip", title: "Welcome!", description: "Play your first game to start building your profile." }];

  const bestFamily = families.filter(f => f.played >= 2).sort((a, b) => b.winRate - a.winRate || a.avgGuesses - b.avgGuesses)[0];
  if (bestFamily && bestFamily.winRate > 0) {
    insights.push({
      type: "strength",
      title: `${bestFamily.label} Master`,
      description: `You win ${bestFamily.winRate}% of ${bestFamily.label.toLowerCase()} sequences with an average of ${bestFamily.avgGuesses} guesses.`,
    });
  }

  const worstFamily = families.filter(f => f.played >= 2).sort((a, b) => a.winRate - b.winRate || b.avgGuesses - a.avgGuesses)[0];
  if (worstFamily && worstFamily !== bestFamily && worstFamily.winRate < 100) {
    insights.push({
      type: "weakness",
      title: `${worstFamily.label} Challenge`,
      description: `${worstFamily.label} sequences have your lowest win rate at ${worstFamily.winRate}%. Targeted practice could help.`,
    });
  }

  if (patterns.total >= 5) {
    const highPct = Math.round((patterns.tooHigh / patterns.total) * 100);
    const lowPct = Math.round((patterns.tooLow / patterns.total) * 100);
    if (highPct > lowPct + 15) {
      insights.push({ type: "tip", title: "Overshooting", description: `${highPct}% of your wrong guesses are too high. Try lower estimates when unsure.` });
    } else if (lowPct > highPct + 15) {
      insights.push({ type: "tip", title: "Undershooting", description: `${lowPct}% of your wrong guesses are too low. Sequences often grow faster than expected.` });
    }
  }

  if (stats.currentStreak >= 7) {
    insights.push({ type: "milestone", title: "On Fire!", description: `${stats.currentStreak}-day streak! You're in the top tier of consistency.` });
  } else if (stats.currentStreak >= 3) {
    insights.push({ type: "milestone", title: "Building Momentum", description: `${stats.currentStreak}-day streak. Keep it going!` });
  }

  if (stats.maxStreak >= 14) {
    insights.push({ type: "milestone", title: "Streak Legend", description: `Your all-time best streak of ${stats.maxStreak} days is legendary.` });
  }

  const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
  if (winRate >= 80 && stats.gamesPlayed >= 5) {
    insights.push({ type: "strength", title: "Sharp Mind", description: `${Math.round(winRate)}% overall win rate across ${stats.gamesPlayed} games. Impressive.` });
  }

  if (stats.gamesPlayed >= 10) {
    insights.push({ type: "milestone", title: "Decimal Devotee", description: `${stats.gamesPlayed} games played. You're a regular!` });
  }
  if (stats.gamesPlayed >= 50) {
    insights.push({ type: "milestone", title: "Half-Centurion", description: `${stats.gamesPlayed} games and counting. True dedication.` });
  }

  return insights;
}

function generateSuggestions(
  stats: GameStats,
  families: FamilyBreakdown[],
  difficulties: DifficultyBreakdown[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (stats.gamesPlayed === 0) {
    suggestions.push({ action: "Play your first daily puzzle", reason: "Daily puzzles build streaks and test different sequence types.", difficulty: 1 });
    return suggestions;
  }

  const weakFamilies = families.filter(f => f.played >= 2 && f.winRate < 50).sort((a, b) => a.winRate - b.winRate);
  for (const wf of weakFamilies.slice(0, 2)) {
    const seqsInFamily = ALL_SEQUENCES.filter(s => s.family === wf.family);
    const easyInFamily = seqsInFamily.filter(s => s.difficulty === 1).length;
    const suggestDiff: 1 | 2 | 3 = easyInFamily > 0 ? 1 : 2;
    suggestions.push({
      action: `Practice ${wf.label} sequences`,
      reason: `Your win rate for ${wf.label.toLowerCase()} is ${wf.winRate}%. Start with ${DIFFICULTY_LABELS[suggestDiff].toLowerCase()} difficulty to build pattern recognition.`,
      difficulty: suggestDiff,
      family: wf.family,
    });
  }

  const easyStats = difficulties.find(d => d.difficulty === 1);
  const medStats = difficulties.find(d => d.difficulty === 2);
  const hardStats = difficulties.find(d => d.difficulty === 3);

  if (easyStats && easyStats.winRate >= 70 && easyStats.played >= 3 && (!medStats || medStats.played < 2)) {
    suggestions.push({
      action: "Step up to Medium difficulty",
      reason: `You're winning ${easyStats.winRate}% of easy games. Medium sequences will introduce factorials, Catalan numbers, and polynomial growth.`,
      difficulty: 2,
    });
  }

  if (medStats && medStats.winRate >= 60 && medStats.played >= 3 && (!hardStats || hardStats.played < 2)) {
    suggestions.push({
      action: "Try Hard difficulty",
      reason: `${medStats.winRate}% win rate on medium — you're ready for Recaman, partition numbers, and Collatz snippets.`,
      difficulty: 3,
    });
  }

  const unplayedFamilies = Object.keys(FAMILY_LABELS).filter(f => !families.find(fb => fb.family === f));
  if (unplayedFamilies.length > 0) {
    const fam = unplayedFamilies[0];
    suggestions.push({
      action: `Explore ${FAMILY_LABELS[fam]} sequences`,
      reason: `You haven't encountered any ${FAMILY_LABELS[fam].toLowerCase()} sequences yet. Practice mode lets you target specific types.`,
      difficulty: 1,
      family: fam,
    });
  }

  if (stats.currentStreak === 0 && stats.maxStreak >= 3) {
    suggestions.push({
      action: "Rebuild your daily streak",
      reason: `Your streak reset but you've hit ${stats.maxStreak} before. One daily puzzle a day is all it takes.`,
      difficulty: 1,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      action: "Keep playing daily puzzles",
      reason: "You're doing well across the board. Daily puzzles keep your skills sharp with varied challenges.",
      difficulty: 1,
    });
  }

  return suggestions.slice(0, 3);
}
