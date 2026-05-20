import type { GuessRecord } from "../game/engine";

interface GuessLogProps {
  guesses: GuessRecord[];
}

function ResultIcon({ result }: { result: "correct" | "higher" | "lower" }) {
  if (result === "correct") {
    return (
      <span className="text-[#22C55E] text-lg" aria-label="Correct">
        ✓
      </span>
    );
  }
  if (result === "higher") {
    return (
      <span className="text-[#EAB308] text-lg" aria-label="Too low, go higher">
        ↑
      </span>
    );
  }
  return (
    <span className="text-[#EAB308] text-lg" aria-label="Too high, go lower">
      ↓
    </span>
  );
}

function getRowBg(result: "correct" | "higher" | "lower"): string {
  if (result === "correct") return "bg-[#22C55E]/10 border-[#22C55E]/30";
  return "bg-[#EAB308]/10 border-[#EAB308]/30";
}

export function GuessLog({ guesses }: GuessLogProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="w-full max-w-xs mx-auto space-y-2 my-3">
      {guesses.map((g, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-2 rounded-lg border ${getRowBg(g.result)} animate-[slideIn_0.3s_ease-out]`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className="text-[#A09BB5] text-xs font-medium w-6">
            #{i + 1}
          </span>
          <span className="font-['JetBrains_Mono'] text-[#F1F0F5] font-bold text-base flex-1 text-center">
            {g.guessedValue}
          </span>
          <ResultIcon result={g.result} />
        </div>
      ))}
    </div>
  );
}
