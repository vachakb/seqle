export type SequenceFamily = "arithmetic" | "geometric" | "polynomial" | "recursive" | "combinatorial" | "prime-related";

export interface MathSequence {
  id: string;
  terms: number[];
  family: SequenceFamily;
  name: string;
  difficulty: 1 | 2 | 3;
  funFact?: string;
  oeis?: string;
}

export type GuessResult = "correct" | "higher" | "lower";

export interface GuessRecord {
  termIndex: number;
  guessedValue: number;
  actualValue: number;
  result: GuessResult;
}

export interface GameSession {
  id: string;
  userId: number | null;
  guestToken: string | null;
  mode: "daily" | "practice";
  dayNumber: number | null;
  sequenceId: string;
  difficulty: 1 | 2 | 3;
  initialRevealCount: number;
  guesses: GuessRecord[];
  consecutiveCorrect: number;
  status: "playing" | "won" | "lost";
  hintRevealed: boolean;
  ghostNumber: number | null;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDate: string;
}

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
