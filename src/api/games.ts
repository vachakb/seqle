import { request } from "./client";
import type { GuessResult, GuessRecord } from "../game/engine";
export type { GuessResult, GuessRecord } from "../game/engine";

export interface StartGameResponse {
  sessionId: string;
  initialTerms: number[];
  totalTermsToShow: number;
  difficulty: 1 | 2 | 3;
  mode: "daily" | "practice";
  dayNumber?: number;
  guestToken?: string;
  ghostNumber: number | null;
}

export interface MathSequence {
  id: string;
  terms: number[];
  family: "arithmetic" | "geometric" | "polynomial" | "recursive" | "combinatorial" | "prime-related";
  name: string;
  difficulty: 1 | 2 | 3;
  funFact?: string;
  oeis?: string;
}

export interface GuessResponse {
  result: GuessResult;
  revealedTerms: number[];
  guessRecord: GuessRecord;
  gameStatus: "playing" | "won" | "lost";
  hintFamily?: string;
  consecutiveCorrect: number;
  guessesRemaining: number;
  ghostNumber: number | null;
  sequence?: MathSequence;
}

export interface GameStateResponse extends StartGameResponse {
  guesses: GuessRecord[];
  status: string;
  hintFamily?: string;
  consecutiveCorrect: number;
  guessesRemaining: number;
  sequence?: MathSequence;
}

export interface DailyStatusResponse {
  dayNumber: number;
  difficulty: 1 | 2 | 3;
  hasPlayed: boolean;
  activeSession: string | null;
}

export async function startGame(mode: "daily" | "practice", difficulty?: 1 | 2 | 3): Promise<StartGameResponse> {
  const res = await request<StartGameResponse>("/games/start", {
    method: "POST",
    body: JSON.stringify({ mode, difficulty }),
  });

  if (res.guestToken) {
    localStorage.setItem("seqle-guest-token", res.guestToken);
  }

  return res;
}

export async function submitGuess(sessionId: string, value: number): Promise<GuessResponse> {
  return request<GuessResponse>(`/games/${sessionId}/guess`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

export async function getDailyStatus(): Promise<DailyStatusResponse> {
  return request<DailyStatusResponse>("/games/daily");
}

export async function getGameState(sessionId: string): Promise<GameStateResponse> {
  return request<GameStateResponse>(`/games/${sessionId}`);
}
