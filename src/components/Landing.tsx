import { useState, useEffect } from "react";
import { TierSelector } from "./TierSelector";
import { MATH_QUOTES } from "../data/easter-eggs";

interface LandingProps {
  onStartDaily: () => void;
  onStartPractice: (difficulty: 1 | 2 | 3) => void;
  streak: number;
  streakLevel: number;
  isAuthenticated?: boolean;
  userEmail?: string;
  onAuthClick?: () => void;
  onLogout?: () => void;
  gameLoading?: boolean;
  onStatsClick?: () => void;
}

export function Landing({ onStartDaily, onStartPractice, streak, streakLevel, isAuthenticated, userEmail, onAuthClick, onLogout, gameLoading, onStatsClick }: LandingProps) {
  const [showTiers, setShowTiers] = useState(false);
  const [quote] = useState(() => MATH_QUOTES[Math.floor(Math.random() * MATH_QUOTES.length)]);
  const [showSparrow, setShowSparrow] = useState(false);
  const [sparrowDismissed, setSparrowDismissed] = useState(false);

  useEffect(() => {
    if (sparrowDismissed) return;
    const delay = 2000 + Math.random() * 5000;
    const timer = setTimeout(() => setShowSparrow(true), delay);
    return () => clearTimeout(timer);
  }, [sparrowDismissed]);

  useEffect(() => {
    if (!showSparrow) return;
    const timer = setTimeout(() => {
      setShowSparrow(false);
      setSparrowDismissed(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, [showSparrow]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* Auth indicator */}
      <div className="absolute top-4 right-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-[#A09BB5] text-xs">{userEmail}</span>
            <button
              onClick={onLogout}
              className="text-[#A09BB5] hover:text-[#F1F0F5] text-xs transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="text-[#A78BFA] hover:text-[#F1F0F5] text-xs transition-colors cursor-pointer"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Sparrow easter egg */}
      {showSparrow && (
        <div
          className="relative mb-1 animate-[sparrowPop_0.5s_ease-out_both] cursor-pointer"
          onClick={() => { setShowSparrow(false); setSparrowDismissed(true); }}
        >
          <div className="flex flex-col items-center">
            {/* Speech bubble */}
            <div className="bg-white rounded-xl px-3 py-1.5 mb-1 relative shadow-lg animate-[fadeIn_0.3s_ease-out_0.4s_both]">
              <span className="text-[#0D0B1A] text-xs font-medium whitespace-nowrap">hi there! i am a friend of sero 🐦</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
            </div>
            {/* Sparrow SVG */}
            <svg width="36" height="32" viewBox="0 0 36 32" fill="none" aria-hidden="true">
              {/* Body */}
              <ellipse cx="18" cy="22" rx="9" ry="8" fill="#C4956A"/>
              {/* Head */}
              <circle cx="18" cy="12" r="7" fill="#8B6F4E"/>
              {/* Eye left */}
              <circle cx="15.5" cy="11" r="1.8" fill="white"/>
              <circle cx="15.8" cy="10.7" r="1" fill="#0D0B1A"/>
              <circle cx="16.2" cy="10.3" r="0.3" fill="white"/>
              {/* Eye right */}
              <circle cx="20.5" cy="11" r="1.8" fill="white"/>
              <circle cx="20.8" cy="10.7" r="1" fill="#0D0B1A"/>
              <circle cx="21.2" cy="10.3" r="0.3" fill="white"/>
              {/* Beak */}
              <path d="M17 14L18 16.5L19 14" fill="#F59E0B"/>
              {/* Blush */}
              <circle cx="14" cy="14" r="1.5" fill="#E8A0BF" opacity="0.4"/>
              <circle cx="22" cy="14" r="1.5" fill="#E8A0BF" opacity="0.4"/>
              {/* Wing left */}
              <ellipse cx="11" cy="22" rx="4" ry="3" fill="#A07B50" transform="rotate(-15 11 22)"/>
              {/* Wing right */}
              <ellipse cx="25" cy="22" rx="4" ry="3" fill="#A07B50" transform="rotate(15 25 22)"/>
              {/* Feet */}
              <path d="M15 29L13 31M15 29L15 31M15 29L17 31" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round"/>
              <path d="M21 29L19 31M21 29L21 31M21 29L23 31" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-3 mb-3">
        <svg width="32" height="32" viewBox="0 0 32 32" className="text-[#FACC15] animate-pulse" aria-hidden="true">
          <path
            d="M16 2L18.5 12H28L20.5 18L23 28L16 22L9 28L11.5 18L4 12H13.5L16 2Z"
            fill="currentColor"
          />
        </svg>
        <h1 className="font-['Orbitron'] text-5xl sm:text-6xl md:text-7xl font-black text-[#F1F0F5] tracking-wider">
          SEQLE
        </h1>
        <svg width="32" height="32" viewBox="0 0 32 32" className="text-[#FACC15] animate-pulse" aria-hidden="true">
          <path
            d="M16 2L18.5 12H28L20.5 18L23 28L16 22L9 28L11.5 18L4 12H13.5L16 2Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Subtitle */}
      <p className="text-[#A09BB5] text-base sm:text-lg mb-8 tracking-wide">
        Crack the sequence. Prove the rule.
      </p>

      {/* Streak display */}
      {streak > 0 && (
        <div className="flex items-center gap-2 mb-6 text-sm">
          {streak >= 3 && (
            <span className="text-[#F97316] text-xl animate-[flicker_1.5s_ease-in-out_infinite]">
              {streakLevel >= 3 ? "🔥🔥🔥" : streakLevel >= 2 ? "🔥🔥" : "🔥"}
            </span>
          )}
          <span className="font-['JetBrains_Mono'] text-[#FACC15] font-bold text-lg">
            {streak}
          </span>
          <span className="text-[#A09BB5]">day streak</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onStartDaily}
          disabled={gameLoading}
          className="w-full py-4 px-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-['Orbitron']
            font-bold text-lg rounded-xl transition-all duration-200
            shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50
            active:scale-95 min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {gameLoading ? "LOADING..." : "DAILY PUZZLE"}
        </button>

        <button
          onClick={() => setShowTiers(!showTiers)}
          className="w-full py-4 px-6 bg-transparent border-2 border-[#8B5CF6]/50
            hover:border-[#8B5CF6] text-[#A78BFA] font-['Orbitron'] font-bold text-lg
            rounded-xl transition-all duration-200 hover:bg-[#8B5CF6]/10
            active:scale-95 min-h-[44px] cursor-pointer"
        >
          PRACTICE
        </button>

        {showTiers && <TierSelector onSelect={onStartPractice} />}

        <button
          onClick={onStatsClick}
          className="w-full py-3 px-6 text-[#A09BB5] hover:text-[#F1F0F5] text-sm
            font-medium transition-colors min-h-[44px] cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1" y="8" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
            <rect x="5.5" y="5" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.7"/>
            <rect x="10" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>
          </svg>
          Analytics
        </button>
      </div>

      {/* Math quote */}
      <p className="mt-12 text-[#A09BB5]/60 text-xs sm:text-sm italic max-w-sm text-center leading-relaxed px-4">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}
