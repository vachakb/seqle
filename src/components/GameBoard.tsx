import { useState, useCallback } from "react";
import { SequenceGrid } from "./SequenceGrid";
import { GuessLog } from "./GuessLog";
import { NumPad } from "./NumPad";
import { HintBanner } from "./HintBanner";
import type { GuessResult } from "../game/engine";
import { getInputEasterEgg, checkGhostGuessPrank } from "../data/easter-eggs";

interface GameBoardProps {
  gameState: {
    mode: "daily" | "practice";
    difficulty: 1 | 2 | 3;
    guesses: { termIndex: number; guessedValue: number; actualValue: number; result: GuessResult }[];
    consecutiveCorrect: number;
    status: "playing" | "won" | "lost";
    hintRevealed: boolean;
    ghostNumber: number | null;
  };
  revealedTerms: number[];
  totalTermsToShow: number;
  hintFamily?: string;
  onGuess: (value: number) => void;
  onBack: () => void;
  onShowToast: (message: string) => void;
  dayNumber?: number;
}

const TIER_LABELS: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

export function GameBoard({
  gameState,
  revealedTerms,
  totalTermsToShow,
  hintFamily,
  onGuess,
  onBack,
  onShowToast,
  dayNumber,
}: GameBoardProps) {
  const [inputValue, setInputValue] = useState("");

  const correctCount = gameState.guesses.filter(g => g.result === "correct").length;
  const revealedCount = revealedTerms.length;

  const terms: (number | null)[] = [];
  for (let i = 0; i < totalTermsToShow; i++) {
    if (i < revealedCount) {
      terms.push(revealedTerms[i]);
    } else {
      terms.push(null);
    }
  }

  const guessResults: (GuessResult | null)[] = [];
  const initialRevealCount = revealedCount - correctCount;
  for (let i = 0; i < totalTermsToShow; i++) {
    if (i < initialRevealCount) {
      guessResults.push(null);
    } else {
      const guess = gameState.guesses.find(
        (g) => g.termIndex === i && g.result === "correct"
      );
      guessResults.push(guess ? "correct" : null);
    }
  }

  const currentIndex = revealedCount;

  const handleSubmit = useCallback(() => {
    if (inputValue === "" || inputValue === "-") return;
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) return;

    const easterEgg = getInputEasterEgg(numValue);
    if (easterEgg) {
      onShowToast(easterEgg);
    }

    const ghostMsg = checkGhostGuessPrank(numValue, gameState.ghostNumber);
    if (ghostMsg) {
      onShowToast(ghostMsg);
    }

    onGuess(numValue);
    setInputValue("");
  }, [inputValue, onGuess, onShowToast, gameState.ghostNumber]);

  const modeLabel =
    gameState.mode === "daily"
      ? `Daily #${dayNumber ?? "?"}`
      : `Practice ${TIER_LABELS[gameState.difficulty] || ""}`;

  const guessCount = gameState.guesses.length;

  return (
    <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-[#A09BB5] hover:text-[#F1F0F5] transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="text-center">
          <h1 className="font-['Orbitron'] text-lg font-bold text-[#F1F0F5] tracking-wider">
            SEQLE
          </h1>
          <span className="text-[#A09BB5] text-xs">{modeLabel}</span>
        </div>
        <div className="w-[44px]" />
      </div>

      {/* Sequence Grid */}
      <SequenceGrid
        terms={terms}
        guessResults={guessResults}
        currentIndex={currentIndex < totalTermsToShow ? currentIndex : totalTermsToShow - 1}
      />

      {/* Guess counter */}
      <div className="text-[#A09BB5] text-sm my-2">
        Guess{" "}
        <span className="font-['JetBrains_Mono'] text-[#A78BFA] font-bold">
          {guessCount + 1}
        </span>{" "}
        of{" "}
        <span className="font-['JetBrains_Mono'] text-[#A78BFA] font-bold">
          6
        </span>
      </div>

      {/* Guess Log */}
      <GuessLog guesses={gameState.guesses} />

      {/* Hint Banner */}
      <HintBanner
        family={hintFamily || ""}
        visible={gameState.hintRevealed && !!hintFamily}
      />

      {/* NumPad */}
      <NumPad
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={gameState.status !== "playing"}
        ghostNumber={gameState.ghostNumber}
      />
    </div>
  );
}
