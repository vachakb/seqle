import type { GuessResult } from "../game/engine";

interface SequenceGridProps {
  terms: (number | null)[];
  guessResults: (GuessResult | null)[];
  currentIndex: number;
}

function getTileClasses(
  index: number,
  currentIndex: number,
  value: number | null,
  result: GuessResult | null
): string {
  const base =
    "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-lg flex items-center justify-center font-['JetBrains_Mono'] font-bold text-lg sm:text-xl transition-all duration-300";

  // Correctly guessed
  if (result === "correct") {
    return `${base} bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50 shadow-md shadow-[#22C55E]/20 animate-[flipIn_0.5s_ease-out]`;
  }

  // Known revealed term (initial terms)
  if (value !== null && index < currentIndex) {
    return `${base} bg-[#252042] text-[#F1F0F5] border border-[#8B5CF6]/30`;
  }

  // Current guess target (pulsing)
  if (index === currentIndex) {
    return `${base} bg-[#252042] border-2 border-[#8B5CF6] text-[#8B5CF6] animate-[pulse_2s_ease-in-out_infinite] shadow-lg shadow-[#7C3AED]/30`;
  }

  // Future unknowns
  return `${base} bg-[#1A1630]/50 text-[#A09BB5]/40 border border-[#252042]`;
}

export function SequenceGrid({ terms, guessResults, currentIndex }: SequenceGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2 my-4">
      {terms.map((term, i) => {
        const result = guessResults[i] ?? null;
        const isRevealed = term !== null;
        const isCurrent = i === currentIndex;

        return (
          <div
            key={i}
            className={getTileClasses(i, currentIndex, term, result)}
          >
            {isRevealed ? (
              <span>{term}</span>
            ) : (
              <span className={isCurrent ? "text-xl" : "text-base"}>?</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
