import type { GuessRecord } from "../game/engine";

function guessEmoji(record: GuessRecord): string {
  switch (record.result) {
    case "correct":
      return "🟩";
    case "higher":
      return "🟨↑";
    case "lower":
      return "🟨↓";
  }
}

export function generateShareText(
  guesses: GuessRecord[],
  dayNumber: number | null,
  mode: string,
  difficulty: number,
): string {
  const correctCount = guesses.filter((g) => g.result === "correct").length;
  const won = correctCount >= 3;
  const score = won ? `${guesses.length}/6` : "X/6";

  const diffLabel = difficulty === 1 ? "Easy" : difficulty === 2 ? "Medium" : "Hard";
  let header: string;
  if (mode === "daily" && dayNumber !== null) {
    header = `SEQLE Daily #${dayNumber} ${score}`;
  } else {
    header = `SEQLE Practice ${diffLabel} ${score}`;
  }

  const grid = guesses.map((g) => guessEmoji(g)).join(" ");

  return `${header}\n${grid}\n\nCrack the sequence → seqle.vercel.app`;
}
