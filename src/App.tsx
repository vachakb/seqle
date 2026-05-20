import { useState, useCallback, useEffect } from "react";
import { ParticleCanvas } from "./components/ParticleCanvas";
import { Toast } from "./components/Toast";
import { Landing } from "./components/Landing";
import { GameBoard } from "./components/GameBoard";
import { ResultScreen } from "./components/ResultScreen";
import { HowToPlayModal } from "./components/HowToPlayModal";
import { AuthModal } from "./components/AuthModal";
import { StatsPage } from "./components/StatsPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import * as gamesApi from "./api/games";
import { getStats as fetchServerStats } from "./api/stats";
import type { GuessRecord, MathSequence, GuessResponse } from "./api/games";
import { getItem, setItem } from "./utils/storage";

type Screen = "landing" | "game" | "result" | "stats";

interface ClientGameState {
  sessionId: string;
  mode: "daily" | "practice";
  difficulty: 1 | 2 | 3;
  dayNumber?: number;
  revealedTerms: number[];
  totalTermsToShow: number;
  guesses: GuessRecord[];
  consecutiveCorrect: number;
  status: "playing" | "won" | "lost";
  hintRevealed: boolean;
  hintFamily?: string;
  ghostNumber: number | null;
  sequence?: MathSequence;
}

function getLocalStreak(): number {
  return getItem<number>("seqle-streak", 0);
}

function getLocalStreakLevel(streak: number): number {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
}

function clearStaleLocalData() {
  const migrated = getItem<boolean>("seqle-migrated-v2", false);
  if (!migrated) {
    localStorage.removeItem("seqle-stats");
    localStorage.removeItem("seqle-streak");
    localStorage.removeItem("seqle-daily-played");
    localStorage.removeItem("seqle-daily-game");
    localStorage.removeItem("seqle-daily-seq");
    setItem("seqle-migrated-v2", true);
  }
}

function hasSeenTutorial(): boolean {
  return getItem<boolean>("seqle-tutorial-seen", false);
}

function markTutorialSeen(): void {
  setItem("seqle-tutorial-seen", true);
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function updateLocalStats(won: boolean, guessCount: number, mode: "daily" | "practice") {
  const stats = getItem("seqle-stats", {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: "",
  });
  const today = new Date().toISOString().slice(0, 10);

  stats.gamesPlayed += 1;
  if (won) {
    stats.gamesWon += 1;
    if (guessCount >= 1 && guessCount <= 6) {
      stats.guessDistribution[guessCount - 1] += 1;
    }
  }

  if (mode === "daily") {
    if (won) {
      if (stats.lastPlayedDate === getYesterday()) {
        stats.currentStreak += 1;
      } else if (stats.lastPlayedDate === today) {
        // already counted today, don't change
      } else {
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 0;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastPlayedDate = today;
  }

  setItem("seqle-stats", stats);
  setItem("seqle-streak", stats.currentStreak);
}

clearStaleLocalData();

function AppInner() {
  const { isAuthenticated, user, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>("landing");
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<1 | 2 | 3 | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenTutorial());
  const [showAuth, setShowAuth] = useState(false);
  const [streak, setStreak] = useState(0);
  const streakLevel = getLocalStreakLevel(streak);
  const [dayNumber, setDayNumber] = useState<number | undefined>(undefined);
  const [gameLoading, setGameLoading] = useState(false);

  useEffect(() => {
    const savedSessionId = localStorage.getItem("seqle-active-session");
    if (savedSessionId) {
      gamesApi.getGameState(savedSessionId).then(res => {
        if (res.status === "playing") {
          setGameState({
            sessionId: savedSessionId,
            mode: res.mode,
            difficulty: res.difficulty,
            dayNumber: res.dayNumber,
            revealedTerms: res.initialTerms,
            totalTermsToShow: res.totalTermsToShow,
            guesses: res.guesses,
            consecutiveCorrect: res.consecutiveCorrect,
            status: "playing",
            hintRevealed: !!res.hintFamily,
            hintFamily: res.hintFamily,
            ghostNumber: res.ghostNumber,
          });
          setSelectedDifficulty(res.difficulty);
          setDayNumber(res.dayNumber);
          setScreen("game");
        } else {
          localStorage.removeItem("seqle-active-session");
        }
      }).catch(() => {
        localStorage.removeItem("seqle-active-session");
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchServerStats()
        .then(res => setStreak(res.stats.currentStreak))
        .catch(() => setStreak(getLocalStreak()));
    } else {
      setStreak(getLocalStreak());
    }
  }, [isAuthenticated]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const refreshStreak = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const res = await fetchServerStats();
        setStreak(res.stats.currentStreak);
        return;
      } catch { /* fall through to local */ }
    }
    setStreak(getLocalStreak());
  }, [isAuthenticated]);

  const handleStartDaily = useCallback(async () => {
    setGameLoading(true);
    try {
      const res = await gamesApi.startGame("daily");
      setDayNumber(res.dayNumber);
      setSelectedDifficulty(res.difficulty);
      localStorage.setItem("seqle-active-session", res.sessionId);
      setGameState({
        sessionId: res.sessionId,
        mode: "daily",
        difficulty: res.difficulty,
        dayNumber: res.dayNumber,
        revealedTerms: res.initialTerms,
        totalTermsToShow: res.totalTermsToShow,
        guesses: [],
        consecutiveCorrect: 0,
        status: "playing",
        hintRevealed: false,
        ghostNumber: res.ghostNumber,
      });
      setScreen("game");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("already played")) {
        showToast("You've already played today's daily puzzle!");
      } else {
        showToast("Failed to start game. Is the server running?");
      }
    } finally {
      setGameLoading(false);
    }
  }, [showToast]);

  const handleStartPractice = useCallback(async (difficulty: 1 | 2 | 3) => {
    setGameLoading(true);
    try {
      const res = await gamesApi.startGame("practice", difficulty);
      localStorage.setItem("seqle-active-session", res.sessionId);
      setSelectedDifficulty(difficulty);
      setGameState({
        sessionId: res.sessionId,
        mode: "practice",
        difficulty: res.difficulty,
        revealedTerms: res.initialTerms,
        totalTermsToShow: res.totalTermsToShow,
        guesses: [],
        consecutiveCorrect: 0,
        status: "playing",
        hintRevealed: false,
        ghostNumber: res.ghostNumber,
      });
      setScreen("game");
    } catch {
      showToast("Failed to start game. Is the server running?");
    } finally {
      setGameLoading(false);
    }
  }, [showToast]);

  const handleGuess = useCallback(async (value: number) => {
    if (!gameState || gameState.status !== "playing") return;

    try {
      const res: GuessResponse = await gamesApi.submitGuess(gameState.sessionId, value);

      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          revealedTerms: res.revealedTerms,
          guesses: [...prev.guesses, res.guessRecord],
          consecutiveCorrect: res.consecutiveCorrect,
          status: res.gameStatus,
          hintRevealed: !!res.hintFamily,
          hintFamily: res.hintFamily,
          ghostNumber: res.ghostNumber,
          sequence: res.sequence,
        };
      });

      if (res.gameStatus === "won" || res.gameStatus === "lost") {
        localStorage.removeItem("seqle-active-session");
        const totalGuesses = gameState.guesses.length + 1;
        updateLocalStats(res.gameStatus === "won", totalGuesses, gameState.mode);

        setTimeout(() => {
          setScreen("result");
          refreshStreak();

          const localStats = getItem<{ gamesPlayed: number } | null>("seqle-stats", null);
          if (localStats && localStats.gamesPlayed === 1 && !isAuthenticated) {
            setTimeout(() => setShowAuth(true), 500);
          }
        }, 800);
      }
    } catch {
      showToast("Failed to submit guess. Please try again.");
    }
  }, [gameState, showToast, isAuthenticated, refreshStreak]);

  const handleBack = useCallback(() => {
    localStorage.removeItem("seqle-active-session");
    setScreen("landing");
    setGameState(null);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (selectedDifficulty) {
      handleStartPractice(selectedDifficulty);
    }
  }, [selectedDifficulty, handleStartPractice]);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
    markTutorialSeen();
  }, []);

  const engineGameState = gameState ? {
    mode: gameState.mode,
    sequenceId: "",
    difficulty: gameState.difficulty,
    initialRevealCount: gameState.revealedTerms.length - gameState.guesses.filter(g => g.result === "correct").length,
    guesses: gameState.guesses.map(g => ({
      termIndex: g.termIndex,
      guessedValue: g.guessedValue,
      actualValue: g.actualValue,
      result: g.result as "correct" | "higher" | "lower",
    })),
    consecutiveCorrect: gameState.consecutiveCorrect,
    status: gameState.status,
    startTime: Date.now(),
    hintRevealed: gameState.hintRevealed,
    ghostNumber: gameState.ghostNumber,
  } : null;

  const resultSequence = gameState?.sequence ? gameState.sequence : null;

  return (
    <div className="relative min-h-screen bg-[#0D0B1A] overflow-hidden">
      <ParticleCanvas />

      {screen === "landing" && (
        <Landing
          onStartDaily={handleStartDaily}
          onStartPractice={handleStartPractice}
          streak={streak}
          streakLevel={streakLevel}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          onAuthClick={() => setShowAuth(true)}
          onLogout={logout}
          gameLoading={gameLoading}
          onStatsClick={() => setScreen("stats")}
        />
      )}

      {screen === "stats" && (
        <StatsPage
          onBack={handleBack}
          onStartPractice={handleStartPractice}
        />
      )}

      {screen === "game" && gameState && engineGameState && (
        <GameBoard
          gameState={engineGameState}
          revealedTerms={gameState.revealedTerms}
          totalTermsToShow={gameState.totalTermsToShow}
          hintFamily={gameState.hintFamily}
          onGuess={handleGuess}
          onBack={handleBack}
          onShowToast={showToast}
          dayNumber={dayNumber}
        />
      )}

      {screen === "result" && gameState && engineGameState && resultSequence && (
        <ResultScreen
          gameState={engineGameState}
          sequence={resultSequence}
          dayNumber={dayNumber ?? 0}
          onPlayAgain={handlePlayAgain}
          onBackToLanding={handleBack}
          onShowToast={showToast}
        />
      )}

      <Toast message={toastMessage} onDismiss={dismissToast} />
      <HowToPlayModal isOpen={showTutorial} onClose={handleCloseTutorial} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onShowToast={showToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
