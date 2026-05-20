export type GuessResult = "correct" | "higher" | "lower";

export interface GuessRecord {
  termIndex: number;
  guessedValue: number;
  actualValue: number;
  result: GuessResult;
}

export interface GameState {
  mode: "daily" | "practice";
  sequenceId: string;
  difficulty: 1 | 2 | 3;
  initialRevealCount: number;
  guesses: GuessRecord[];
  consecutiveCorrect: number;
  status: "playing" | "won" | "lost";
  startTime: number;
  hintRevealed: boolean;
  ghostNumber: number | null;
}

export function getWinTitle(state: GameState): string {
  const total = state.guesses.length;
  switch (total) {
    case 3:
      return "FLAWLESS MIND";
    case 4:
      return "PATTERN HUNTER";
    case 5:
      return "CODE BREAKER";
    case 6:
      return "CLUTCH GENIUS";
    default:
      return "SEQUENCE CRACKED";
  }
}
