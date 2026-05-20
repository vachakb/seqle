interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}

interface StatsModalProps {
  stats: Stats;
  isOpen: boolean;
  onClose: () => void;
  streakLevel: number;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center p-3 bg-[#252042]/60 rounded-lg min-w-[60px]">
      <span className="font-['JetBrains_Mono'] text-xl sm:text-2xl font-bold text-[#F1F0F5]">
        {value}
      </span>
      <span className="text-[#A09BB5] text-[10px] sm:text-xs mt-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function StatsModal({ stats, isOpen, onClose, streakLevel }: StatsModalProps) {
  if (!isOpen) return null;

  const winPct =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1630] border border-[#252042] rounded-2xl p-6 w-full max-w-sm animate-[fadeIn_0.2s_ease-out] shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A09BB5] hover:text-[#F1F0F5] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <h2 className="font-['Orbitron'] text-lg font-bold text-[#F1F0F5] text-center mb-5 tracking-wider">
          STATISTICS
        </h2>

        {/* Streak fire icon */}
        {streakLevel > 0 && (
          <div className="text-center mb-3 text-xl">
            {streakLevel >= 3 ? "🔥🔥🔥" : streakLevel >= 2 ? "🔥🔥" : "🔥"}
          </div>
        )}

        {/* Stat boxes */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatBox label="Played" value={stats.gamesPlayed} />
          <StatBox label="Win %" value={`${winPct}`} />
          <StatBox label="Streak" value={stats.currentStreak} />
          <StatBox label="Max" value={stats.maxStreak} />
        </div>

        {/* Guess distribution */}
        <h3 className="text-[#A09BB5] text-xs uppercase tracking-widest mb-3 text-center">
          Guess Distribution
        </h3>
        <div className="space-y-1.5 mb-4">
          {stats.guessDistribution.map((count, i) => {
            const widthPct = Math.max(
              (count / maxDistribution) * 100,
              count > 0 ? 10 : 4
            );
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-xs text-[#A09BB5] w-3 text-right">
                  {i + 1}
                </span>
                <div
                  className="h-5 rounded bg-[#8B5CF6]/70 flex items-center justify-end px-2 transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="font-['JetBrains_Mono'] text-[10px] text-white font-bold">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone badges placeholder */}
        {stats.gamesPlayed >= 10 && (
          <div className="border-t border-[#252042] pt-4 mt-4">
            <h3 className="text-[#A09BB5] text-xs uppercase tracking-widest mb-2 text-center">
              Milestones
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {stats.gamesPlayed >= 10 && (
                <span className="bg-[#252042] text-[#A78BFA] text-xs px-3 py-1 rounded-full">
                  10 Games
                </span>
              )}
              {stats.gamesPlayed >= 50 && (
                <span className="bg-[#252042] text-[#A78BFA] text-xs px-3 py-1 rounded-full">
                  50 Games
                </span>
              )}
              {stats.maxStreak >= 7 && (
                <span className="bg-[#252042] text-[#FACC15] text-xs px-3 py-1 rounded-full">
                  7-Day Streak
                </span>
              )}
              {stats.maxStreak >= 30 && (
                <span className="bg-[#252042] text-[#F97316] text-xs px-3 py-1 rounded-full">
                  30-Day Streak
                </span>
              )}
              {winPct >= 80 && stats.gamesPlayed >= 10 && (
                <span className="bg-[#252042] text-[#22C55E] text-xs px-3 py-1 rounded-full">
                  80%+ Win Rate
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
