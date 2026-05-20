import { useState, useEffect, useRef, useCallback } from "react";
import type { GameState } from "../game/engine";
import { getWinTitle } from "../game/engine";
import type { MathSequence } from "../game/sequences";
import { FAMILY_LABELS, TIER_INFO } from "../game/sequences";
import { getTimeUntilNextPuzzle } from "../game/daily";

interface ResultScreenProps {
  gameState: GameState;
  sequence: MathSequence;
  dayNumber: number;
  onPlayAgain: () => void;
  onBackToLanding: () => void;
  onShowToast: (message: string) => void;
}

function buildEmojiGrid(gameState: GameState): string {
  const rows = gameState.guesses.map((g) => {
    if (g.result === "correct") return "🟩";
    if (g.result === "higher") return "🟨↑";
    return "🟨↓";
  });
  return rows.join(" ");
}

function getResultSubtitle(gameState: GameState): string {
  if (gameState.status === "won") {
    const total = gameState.guesses.length;
    if (total <= 3) return "Three for three. The numbers bow to you.";
    if (total <= 4) return "Sharp eyes, sharper mind. Well played.";
    if (total <= 5) return "Persistence meets pattern recognition.";
    return "Down to the wire — and you still cracked it.";
  }
  const correctCount = gameState.guesses.filter(g => g.result === "correct").length;
  if (correctCount === 0) return "Even Euler had bad days. This sequence was a beast.";
  if (correctCount === 1) return "You found the scent but lost the trail. Almost.";
  return "So close you could taste it. The pattern slipped away at the last second.";
}

export function ResultScreen({
  gameState,
  sequence,
  dayNumber,
  onPlayAgain,
  onBackToLanding,
  onShowToast,
}: ResultScreenProps) {
  const isWin = gameState.status === "won";
  const correctCount = gameState.guesses.filter(g => g.result === "correct").length;
  const lossTitle = correctCount === 0 ? "BETTER LUCK NEXT TIME" : "SO CLOSE, YET SO FAR"
  const title = isWin ? getWinTitle(gameState) : lossTitle;
  const subtitle = getResultSubtitle(gameState);
  const [showShareCard, setShowShareCard] = useState(false);

  const [countdown, setCountdown] = useState(getTimeUntilNextPuzzle());

  useEffect(() => {
    if (gameState.mode !== "daily") return;
    const interval = setInterval(() => {
      setCountdown(getTimeUntilNextPuzzle());
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.mode]);

  const familyLabel = FAMILY_LABELS[sequence.family];
  const modeText = gameState.mode === "daily"
    ? `Daily #${dayNumber}`
    : `Practice ${TIER_INFO[gameState.difficulty].label}`;
  const resultText = isWin ? `${gameState.guesses.length}/6` : "X/6";

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* Win/Loss header */}
      <div className="mb-6 text-center">
        {isWin && (
          <div className="text-4xl mb-3 animate-[bounce_1s_ease-in-out_3]">
            <svg width="48" height="48" viewBox="0 0 32 32" className="text-[#FACC15] mx-auto" aria-hidden="true">
              <path
                d="M16 2L18.5 12H28L20.5 18L23 28L16 22L9 28L11.5 18L4 12H13.5L16 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
        <h1 className="font-['Orbitron'] text-2xl sm:text-3xl font-black text-[#F1F0F5] tracking-wider mb-2">
          {title}
        </h1>
        <p className="text-[#A09BB5] text-sm sm:text-base">{subtitle}</p>
      </div>

      {/* Sequence info */}
      <div className="bg-[#1A1630] border border-[#252042] rounded-xl p-5 max-w-sm w-full mb-6">
        <h2 className="font-['Orbitron'] text-sm text-[#A78BFA] font-bold mb-1 uppercase tracking-wider">
          {sequence.name}
        </h2>
        <p className="text-[#A09BB5] text-xs mb-3">
          Family: <span className="text-[#8B5CF6]">{familyLabel}</span>
        </p>

        {/* Full sequence */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {sequence.terms.slice(0, 8).map((t, i) => (
            <span
              key={i}
              className="font-['JetBrains_Mono'] text-sm text-[#F1F0F5] bg-[#252042] px-2 py-1 rounded"
            >
              {t}
            </span>
          ))}
          <span className="text-[#A09BB5]">...</span>
        </div>

        {/* Fun fact */}
        {sequence.funFact && (
          <p className="text-[#A09BB5] text-xs italic leading-relaxed">
            {sequence.funFact}
          </p>
        )}

        {/* OEIS reference */}
        {sequence.oeis && (
          <p className="text-[#8B5CF6] text-xs mt-2">
            OEIS:{" "}
            <a
              href={`https://oeis.org/${sequence.oeis}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#A78BFA] transition-colors"
            >
              {sequence.oeis}
            </a>
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setShowShareCard(true)}
          className="w-full py-4 px-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-['Orbitron']
            font-bold text-sm rounded-xl transition-all duration-200
            shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50
            active:scale-95 min-h-[44px] cursor-pointer"
        >
          SHARE RESULT
        </button>

        {gameState.mode === "practice" && (
          <button
            onClick={onPlayAgain}
            className="w-full py-4 px-6 bg-transparent border-2 border-[#8B5CF6]/50
              hover:border-[#8B5CF6] text-[#A78BFA] font-['Orbitron'] font-bold text-sm
              rounded-xl transition-all duration-200 hover:bg-[#8B5CF6]/10
              active:scale-95 min-h-[44px] cursor-pointer"
          >
            PRACTICE MORE
          </button>
        )}

        <button
          onClick={onBackToLanding}
          className="w-full py-3 px-6 text-[#A09BB5] hover:text-[#F1F0F5] text-sm
            transition-colors min-h-[44px] cursor-pointer"
        >
          Back to Home
        </button>
      </div>

      {/* Countdown for daily mode */}
      {gameState.mode === "daily" && (
        <div className="mt-8 text-center">
          <p className="text-[#A09BB5] text-xs uppercase tracking-widest mb-1">
            Next Seqle in
          </p>
          <p className="font-['JetBrains_Mono'] text-[#A78BFA] text-xl font-bold">
            {String(countdown.hours).padStart(2, "0")}h{" "}
            {String(countdown.minutes).padStart(2, "0")}m{" "}
            {String(countdown.seconds).padStart(2, "0")}s
          </p>
        </div>
      )}

      {/* Share Card Overlay */}
      {showShareCard && (
        <ShareCardOverlay
          title={title}
          modeText={modeText}
          resultText={resultText}
          emojiGrid={buildEmojiGrid(gameState)}
          sequenceName={sequence.name}
          isWin={isWin}
          onClose={() => setShowShareCard(false)}
          onShowToast={onShowToast}
          guessCount={gameState.guesses.length}
          dayNumber={dayNumber}
          mode={gameState.mode}
        />
      )}
    </div>
  );
}

interface ShareCardOverlayProps {
  title: string;
  modeText: string;
  resultText: string;
  emojiGrid: string;
  sequenceName: string;
  isWin: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
  guessCount: number;
  dayNumber: number;
  mode: "daily" | "practice";
}

function ShareCardOverlay({
  title,
  modeText,
  resultText,
  emojiGrid,
  sequenceName,
  isWin,
  onClose,
  onShowToast,
  guessCount,
  dayNumber,
  mode,
}: ShareCardOverlayProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = `SEQLE ${modeText} ${resultText}\n${emojiGrid}\n\nCrack the sequence → seqle.vercel.app`;

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      onShowToast("Copied to clipboard!");
    } catch {
      onShowToast("Could not copy. Try long-pressing to select text.");
    }
  }, [shareText, onShowToast]);

  const handleShare = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;

    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 2,
      });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (blob && navigator.share) {
        const file = new File([blob], "seqle-result.png", { type: "image/png" });
        await navigator.share({
          text: shareText,
          files: [file],
        });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      onShowToast("Copied result to clipboard!");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shareText);
        onShowToast("Copied result to clipboard!");
      } catch {
        onShowToast("Could not share. Try a screenshot instead!");
      }
    }
  }, [shareText, onShowToast]);

  const handleDownload = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;

    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `seqle-${modeText.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onShowToast("Card downloaded!");
    } catch {
      onShowToast("Could not generate image. Try a screenshot instead!");
    }
  }, [modeText, onShowToast]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The card itself */}
        <div
          ref={cardRef}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1A1630 0%, #0D0B1A 50%, #1A1630 100%)",
          }}
        >
          <div className="p-6 border border-[#8B5CF6]/30 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 32 32" className="text-[#FACC15]" aria-hidden="true">
                  <path d="M18 4L12 16h6l-4 12 10-14h-7l5-10z" fill="currentColor"/>
                </svg>
                <span className="font-['Orbitron'] text-base font-bold text-[#F1F0F5] tracking-wider">
                  SEQLE
                </span>
              </div>
              <span className="text-[#A09BB5] text-xs font-['JetBrains_Mono']">
                {modeText}
              </span>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <h2
                className={`font-['Orbitron'] text-lg font-black tracking-wider mb-1 ${
                  isWin ? "text-[#22C55E]" : "text-[#EAB308]"
                }`}
              >
                {title}
              </h2>
              <p className="text-[#A09BB5] text-xs">
                {sequenceName}
              </p>
            </div>

            {/* Result + emoji grid */}
            <div className="bg-[#252042]/60 rounded-xl p-4 mb-4 text-center">
              <p className="font-['JetBrains_Mono'] text-3xl font-bold text-[#F1F0F5] mb-2">
                {resultText}
              </p>
              <p className="font-['JetBrains_Mono'] text-lg tracking-widest">
                {emojiGrid}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[#A09BB5]">
              <span className="text-[10px] uppercase tracking-widest">
                seqle.vercel.app
              </span>
              <span className="text-[10px]">
                Crack the sequence. Prove the rule.
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons below the card */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-3 w-full">
            <button
              onClick={handleShare}
              className="flex-1 py-3 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-['Orbitron']
                font-bold text-xs rounded-xl transition-all duration-200
                shadow-lg shadow-[#7C3AED]/30 active:scale-95 min-h-[44px] cursor-pointer"
            >
              SHARE
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 px-4 bg-transparent border border-[#8B5CF6]/50
                text-[#A78BFA] font-['Orbitron'] font-bold text-xs
                rounded-xl transition-all duration-200 hover:bg-[#8B5CF6]/10
                active:scale-95 min-h-[44px] cursor-pointer"
            >
              SAVE IMAGE
            </button>
          </div>
          <button
            onClick={handleCopyText}
            className="w-full py-2.5 px-4 text-[#A09BB5] hover:text-[#F1F0F5] text-xs
              transition-colors min-h-[44px] cursor-pointer"
          >
            Copy text to clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
