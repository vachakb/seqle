import crypto from "crypto";
import { pool } from "../db/pool.js";
import { ALL_SEQUENCES, FAMILY_LABELS } from "../data/sequences.js";
import { generateGhostNumber, isSpecialDate } from "../data/easter-eggs.js";
import { getDayNumber, getDailyDifficulty, getDailySequence } from "./daily.service.js";
import type { MathSequence, GuessRecord, GuessResult, GameSession, StartGameResponse, GuessResponse } from "../types.js";

const MAX_GUESSES = 6;
const CONSECUTIVE_TO_WIN = 3;

function getInitialRevealCount(difficulty: 1 | 2 | 3): number {
  return difficulty === 3 ? 4 : 3;
}

function pickPracticeSequence(difficulty: 1 | 2 | 3): MathSequence {
  const pool = ALL_SEQUENCES.filter((s) => s.difficulty === difficulty);
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

function generateGuestToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function startGame(
  mode: "daily" | "practice",
  difficulty: 1 | 2 | 3 | undefined,
  userId: number | null,
  guestToken: string | null,
): Promise<StartGameResponse> {
  let sequence: MathSequence;
  let dayNumber: number | null = null;

  if (mode === "daily") {
    dayNumber = getDayNumber();

    const special = isSpecialDate();
    if (special) {
      sequence = special;
    } else {
      sequence = getDailySequence(dayNumber);
    }

    if (userId) {
      const existing = await pool.query(
        `SELECT id FROM game_results WHERE user_id = $1 AND day_number = $2`,
        [userId, dayNumber]
      );
      if (existing.rows.length > 0) {
        throw new Error("DAILY_ALREADY_PLAYED");
      }

      const existingSession = await pool.query(
        `SELECT id, guesses, consecutive_correct, status, hint_revealed, ghost_number, initial_reveal_count
         FROM game_sessions WHERE user_id = $1 AND mode = 'daily' AND day_number = $2`,
        [userId, dayNumber]
      );
      if (existingSession.rows.length > 0) {
        const s = existingSession.rows[0];
        if (s.status !== "playing") throw new Error("DAILY_ALREADY_PLAYED");
        return resumeSessionResponse(s, sequence, dayNumber);
      }
    } else if (guestToken) {
      const existingSession = await pool.query(
        `SELECT id, guesses, consecutive_correct, status, hint_revealed, ghost_number, initial_reveal_count
         FROM game_sessions WHERE guest_token = $1 AND mode = 'daily' AND day_number = $2`,
        [guestToken, dayNumber]
      );
      if (existingSession.rows.length > 0) {
        const s = existingSession.rows[0];
        if (s.status !== "playing") throw new Error("DAILY_ALREADY_PLAYED");
        return resumeSessionResponse(s, sequence, dayNumber);
      }
    }

    difficulty = getDailyDifficulty(dayNumber);
  } else {
    difficulty = difficulty || 1;
    sequence = pickPracticeSequence(difficulty);
  }

  const initialRevealCount = getInitialRevealCount(difficulty);
  const ghostNumber = generateGhostNumber(sequence, initialRevealCount);

  const newGuestToken = (!userId && !guestToken) ? generateGuestToken() : null;
  const effectiveGuestToken = guestToken || newGuestToken;

  const result = await pool.query(
    `INSERT INTO game_sessions (user_id, guest_token, mode, day_number, sequence_id, difficulty, initial_reveal_count, ghost_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [userId, effectiveGuestToken, mode, dayNumber, sequence.id, difficulty, initialRevealCount, ghostNumber]
  );

  const sessionId = result.rows[0].id;
  const initialTerms = sequence.terms.slice(0, initialRevealCount);
  const totalTermsToShow = Math.min(sequence.terms.length, initialRevealCount + MAX_GUESSES);

  return {
    sessionId,
    initialTerms,
    totalTermsToShow,
    difficulty,
    mode,
    ...(dayNumber !== null ? { dayNumber } : {}),
    ...(newGuestToken ? { guestToken: newGuestToken } : {}),
    ghostNumber,
  };
}

function resumeSessionResponse(
  session: { id: string; guesses: GuessRecord[]; consecutive_correct: number; status: string; hint_revealed: boolean; ghost_number: number | null; initial_reveal_count: number },
  sequence: MathSequence,
  dayNumber: number,
): StartGameResponse {
  const guesses: GuessRecord[] = session.guesses || [];
  const correctCount = guesses.filter(g => g.result === "correct").length;
  const revealCount = session.initial_reveal_count + correctCount;
  const revealedTerms = sequence.terms.slice(0, revealCount);
  const totalTermsToShow = Math.min(sequence.terms.length, session.initial_reveal_count + MAX_GUESSES);

  return {
    sessionId: session.id,
    initialTerms: revealedTerms,
    totalTermsToShow,
    difficulty: sequence.difficulty,
    mode: "daily",
    dayNumber,
    ghostNumber: session.ghost_number,
  };
}

export async function submitGuess(
  sessionId: string,
  guessValue: number,
  userId: number | null,
  guestToken: string | null,
): Promise<GuessResponse> {
  const sessionResult = await pool.query(
    `SELECT * FROM game_sessions WHERE id = $1`,
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error("SESSION_NOT_FOUND");
  }

  const session = sessionResult.rows[0];

  if (userId && session.user_id !== userId) {
    throw new Error("SESSION_NOT_FOUND");
  }
  if (!userId && guestToken && session.guest_token !== guestToken) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (session.status !== "playing") {
    throw new Error("GAME_ALREADY_FINISHED");
  }

  const guesses: GuessRecord[] = session.guesses || [];
  if (guesses.length >= MAX_GUESSES) {
    throw new Error("MAX_GUESSES_REACHED");
  }

  const sequence = ALL_SEQUENCES.find(s => s.id === session.sequence_id);
  if (!sequence) {
    const special = isSpecialDate();
    if (!special || special.id !== session.sequence_id) {
      throw new Error("SEQUENCE_NOT_FOUND");
    }
    return evaluateGuess(session, special, guessValue, guesses, userId, guestToken);
  }

  return evaluateGuess(session, sequence, guessValue, guesses, userId, guestToken);
}

async function evaluateGuess(
  session: Record<string, unknown>,
  sequence: MathSequence,
  guessValue: number,
  existingGuesses: GuessRecord[],
  userId: number | null,
  _guestToken: string | null,
): Promise<GuessResponse> {
  const correctCount = existingGuesses.filter(g => g.result === "correct").length;
  const targetIndex = (session.initial_reveal_count as number) + correctCount;
  const actualValue = sequence.terms[targetIndex];

  if (actualValue === undefined) {
    throw new Error("NO_MORE_TERMS");
  }

  let result: GuessResult;
  if (guessValue === actualValue) {
    result = "correct";
  } else if (actualValue > guessValue) {
    result = "higher";
  } else {
    result = "lower";
  }

  const record: GuessRecord = {
    termIndex: targetIndex,
    guessedValue: guessValue,
    actualValue,
    result,
  };

  const newGuesses = [...existingGuesses, record];
  const newConsecutive = result === "correct" ? (session.consecutive_correct as number) + 1 : 0;

  let newStatus: "playing" | "won" | "lost" = "playing";
  if (newConsecutive >= CONSECUTIVE_TO_WIN) {
    newStatus = "won";
  } else if (newGuesses.length >= MAX_GUESSES) {
    newStatus = "lost";
  }

  const newHintRevealed = newStatus === "won"
    ? false
    : (session.hint_revealed as boolean) || newGuesses.length >= 3;

  await pool.query(
    `UPDATE game_sessions
     SET guesses = $1, consecutive_correct = $2, status = $3, hint_revealed = $4, updated_at = NOW()
     WHERE id = $5`,
    [JSON.stringify(newGuesses), newConsecutive, newStatus, newHintRevealed, session.id]
  );

  if (newStatus !== "playing") {
    await recordGameResult(session, sequence, newGuesses, newStatus === "won", userId);
  }

  const newCorrectCount = newGuesses.filter(g => g.result === "correct").length;
  const revealCount = (session.initial_reveal_count as number) + newCorrectCount;
  const revealedTerms = sequence.terms.slice(0, revealCount);

  const response: GuessResponse = {
    result,
    revealedTerms,
    guessRecord: record,
    gameStatus: newStatus,
    consecutiveCorrect: newConsecutive,
    guessesRemaining: MAX_GUESSES - newGuesses.length,
    ghostNumber: session.ghost_number as number | null,
  };

  if (newHintRevealed && newStatus === "playing") {
    response.hintFamily = FAMILY_LABELS[sequence.family] || sequence.family;
  }

  if (newStatus !== "playing") {
    response.sequence = sequence;
  }

  return response;
}

function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function recordGameResult(
  session: Record<string, unknown>,
  _sequence: MathSequence,
  guesses: GuessRecord[],
  won: boolean,
  userId: number | null,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO game_results (user_id, mode, day_number, sequence_id, difficulty, won, guess_count, guesses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, day_number) DO NOTHING`,
      [
        userId || session.user_id,
        session.mode,
        session.day_number,
        session.sequence_id,
        session.difficulty,
        won,
        guesses.length,
        JSON.stringify(guesses),
      ]
    );

    const effectiveUserId = userId || session.user_id;
    if (effectiveUserId) {
      const today = new Date().toISOString().slice(0, 10);
      const isDaily = session.mode === "daily";

      if (isDaily) {
        const statsRow = await client.query(
          `SELECT current_streak, last_played_date FROM user_stats WHERE user_id = $1`,
          [effectiveUserId]
        );
        const currentStats = statsRow.rows[0];
        const lastPlayedDate = currentStats?.last_played_date || "";
        const yesterday = getYesterdayDateStr();

        let newStreak: number;
        if (won) {
          if (lastPlayedDate === yesterday) {
            newStreak = (currentStats?.current_streak || 0) + 1;
          } else if (lastPlayedDate === today) {
            newStreak = currentStats?.current_streak || 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 0;
        }

        await client.query(
          `UPDATE user_stats SET
             games_played = games_played + 1,
             games_won = games_won + CASE WHEN $1 THEN 1 ELSE 0 END,
             current_streak = $2,
             max_streak = GREATEST(max_streak, $2),
             guess_distribution[$3] = guess_distribution[$3] + CASE WHEN $1 THEN 1 ELSE 0 END,
             last_played_date = $4,
             updated_at = NOW()
           WHERE user_id = $5`,
          [won, newStreak, guesses.length, today, effectiveUserId]
        );
      } else {
        await client.query(
          `UPDATE user_stats SET
             games_played = games_played + 1,
             games_won = games_won + CASE WHEN $1 THEN 1 ELSE 0 END,
             guess_distribution[$2] = guess_distribution[$2] + CASE WHEN $1 THEN 1 ELSE 0 END,
             updated_at = NOW()
           WHERE user_id = $3`,
          [won, guesses.length, effectiveUserId]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getGameState(
  sessionId: string,
  userId: number | null,
  guestToken: string | null,
): Promise<StartGameResponse & { guesses: GuessRecord[]; status: string; hintFamily?: string; consecutiveCorrect: number; guessesRemaining: number; sequence?: MathSequence }> {
  const result = await pool.query(
    `SELECT * FROM game_sessions WHERE id = $1`,
    [sessionId]
  );

  if (result.rows.length === 0) throw new Error("SESSION_NOT_FOUND");

  const session = result.rows[0];
  if (userId && session.user_id !== userId) throw new Error("SESSION_NOT_FOUND");
  if (!userId && guestToken && session.guest_token !== guestToken) throw new Error("SESSION_NOT_FOUND");

  const sequence = ALL_SEQUENCES.find(s => s.id === session.sequence_id) || isSpecialDate();
  if (!sequence) throw new Error("SEQUENCE_NOT_FOUND");

  const guesses: GuessRecord[] = session.guesses || [];
  const correctCount = guesses.filter(g => g.result === "correct").length;
  const revealCount = session.initial_reveal_count + correctCount;
  const revealedTerms = sequence.terms.slice(0, revealCount);
  const totalTermsToShow = Math.min(sequence.terms.length, session.initial_reveal_count + MAX_GUESSES);

  const response: ReturnType<typeof getGameState> extends Promise<infer T> ? T : never = {
    sessionId: session.id,
    initialTerms: revealedTerms,
    totalTermsToShow,
    difficulty: session.difficulty,
    mode: session.mode,
    ...(session.day_number !== null ? { dayNumber: session.day_number } : {}),
    ghostNumber: session.ghost_number,
    guesses,
    status: session.status,
    consecutiveCorrect: session.consecutive_correct,
    guessesRemaining: MAX_GUESSES - guesses.length,
  };

  if (session.hint_revealed && session.status === "playing") {
    response.hintFamily = FAMILY_LABELS[sequence.family] || sequence.family;
  }

  if (session.status !== "playing") {
    response.sequence = sequence;
  }

  return response;
}

export async function getDailyStatus(
  userId: number | null,
  guestToken: string | null,
) {
  const dayNumber = getDayNumber();
  const difficulty = getDailyDifficulty(dayNumber);

  let hasPlayed = false;
  let activeSession: string | null = null;

  if (userId) {
    const played = await pool.query(
      `SELECT id FROM game_results WHERE user_id = $1 AND day_number = $2`,
      [userId, dayNumber]
    );
    hasPlayed = played.rows.length > 0;

    if (!hasPlayed) {
      const session = await pool.query(
        `SELECT id FROM game_sessions WHERE user_id = $1 AND mode = 'daily' AND day_number = $2 AND status = 'playing'`,
        [userId, dayNumber]
      );
      activeSession = session.rows[0]?.id || null;
    }
  } else if (guestToken) {
    const session = await pool.query(
      `SELECT id, status FROM game_sessions WHERE guest_token = $1 AND mode = 'daily' AND day_number = $2`,
      [guestToken, dayNumber]
    );
    if (session.rows.length > 0) {
      if (session.rows[0].status !== "playing") {
        hasPlayed = true;
      } else {
        activeSession = session.rows[0].id;
      }
    }
  }

  return {
    dayNumber,
    difficulty,
    hasPlayed,
    activeSession,
  };
}
