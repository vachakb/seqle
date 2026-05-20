import { useState, useEffect } from "react";
import { getAnalytics } from "../api/stats";
import type { AnalyticsData, Insight, Suggestion } from "../api/stats";

interface StatsPageProps {
  onBack: () => void;
  onStartPractice: (difficulty: 1 | 2 | 3) => void;
}

const INSIGHT_ICONS: Record<string, string> = {
  strength: "💪",
  weakness: "🎯",
  tip: "💡",
  milestone: "⭐",
};

const INSIGHT_COLORS: Record<string, string> = {
  strength: "border-[#22C55E]/30 bg-[#22C55E]/5",
  weakness: "border-[#EAB308]/30 bg-[#EAB308]/5",
  tip: "border-[#8B5CF6]/30 bg-[#8B5CF6]/5",
  milestone: "border-[#FACC15]/30 bg-[#FACC15]/5",
};

const DIFF_COLORS: Record<number, string> = {
  1: "text-[#22C55E]",
  2: "text-[#EAB308]",
  3: "text-[#F97316]",
};

export function StatsPage({ onBack, onStartPractice }: StatsPageProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError("Sign in to view your stats and analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-[#A09BB5] font-['JetBrains_Mono'] animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-[#A09BB5] mb-4">{error}</p>
        <button onClick={onBack} className="text-[#A78BFA] hover:text-[#F1F0F5] transition-colors cursor-pointer">
          Back to Home
        </button>
      </div>
    );
  }

  const { overview, guessDistribution, familyBreakdown, difficultyBreakdown, recentGames, guessPatterns, insights, suggestions } = data;
  const maxDist = Math.max(...guessDistribution, 1);

  return (
    <div className="relative z-10 min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-[#A09BB5] hover:text-[#F1F0F5] transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-['Orbitron'] text-xl font-bold text-[#F1F0F5] tracking-wider">ANALYTICS</h1>
        <div className="w-[44px]" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Played" value={overview.gamesPlayed} />
        <StatCard label="Win Rate" value={`${overview.winRate}%`} />
        <StatCard label="Streak" value={overview.currentStreak} accent />
        <StatCard label="Best Streak" value={overview.maxStreak} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Section title="WHAT TO DO NEXT">
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} onStartPractice={onStartPractice} />
            ))}
          </div>
        </Section>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Section title="INSIGHTS">
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </Section>
      )}

      {/* Guess Distribution */}
      <Section title="GUESS DISTRIBUTION">
        <div className="space-y-1.5">
          {guessDistribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-['JetBrains_Mono'] text-xs text-[#A09BB5] w-4 text-right">{i + 1}</span>
              <div className="flex-1 h-6 bg-[#252042]/40 rounded overflow-hidden">
                <div
                  className="h-full bg-[#8B5CF6] rounded flex items-center justify-end px-2 transition-all duration-500"
                  style={{ width: `${Math.max((count / maxDist) * 100, count > 0 ? 8 : 0)}%` }}
                >
                  {count > 0 && (
                    <span className="font-['JetBrains_Mono'] text-[10px] text-white font-bold">{count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Guess Patterns */}
      {guessPatterns.total >= 3 && (
        <Section title="GUESS PATTERNS">
          <div className="flex gap-3">
            <PatternBar label="Too Low" count={guessPatterns.tooLow} total={guessPatterns.total} color="bg-[#3B82F6]" />
            <PatternBar label="Correct" count={guessPatterns.correct} total={guessPatterns.total} color="bg-[#22C55E]" />
            <PatternBar label="Too High" count={guessPatterns.tooHigh} total={guessPatterns.total} color="bg-[#F97316]" />
          </div>
        </Section>
      )}

      {/* Family Breakdown */}
      {familyBreakdown.length > 0 && (
        <Section title="BY SEQUENCE FAMILY">
          <div className="space-y-2">
            {familyBreakdown.map((f) => (
              <div key={f.family} className="bg-[#1A1630] border border-[#252042] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[#F1F0F5] text-sm font-medium">{f.label}</span>
                  <span className="text-[#A09BB5] text-xs ml-2">{f.played} games</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#A09BB5]">avg {f.avgGuesses}</span>
                  <span className={`font-['JetBrains_Mono'] text-sm font-bold ${f.winRate >= 60 ? "text-[#22C55E]" : f.winRate >= 30 ? "text-[#EAB308]" : "text-[#F97316]"}`}>
                    {f.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Difficulty Breakdown */}
      {difficultyBreakdown.length > 0 && (
        <Section title="BY DIFFICULTY">
          <div className="grid grid-cols-3 gap-3">
            {difficultyBreakdown.map((d) => (
              <div key={d.difficulty} className="bg-[#1A1630] border border-[#252042] rounded-lg p-3 text-center">
                <div className={`font-['Orbitron'] text-xs font-bold mb-1 ${DIFF_COLORS[d.difficulty]}`}>
                  {d.label}
                </div>
                <div className="font-['JetBrains_Mono'] text-lg text-[#F1F0F5] font-bold">{d.winRate}%</div>
                <div className="text-[#A09BB5] text-[10px]">{d.played} played · avg {d.avgGuesses}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <Section title="RECENT GAMES">
          <div className="space-y-1.5">
            {recentGames.map((g, i) => (
              <div key={i} className="bg-[#1A1630] border border-[#252042] rounded-lg px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs ${g.won ? "text-[#22C55E]" : "text-[#F97316]"}`}>
                    {g.won ? "W" : "L"}
                  </span>
                  <span className="text-[#F1F0F5] text-sm truncate">{g.sequenceName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#A09BB5] text-[10px]">{g.family}</span>
                  <span className="font-['JetBrains_Mono'] text-xs text-[#A09BB5]">{g.guessCount}/6</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="h-8" />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-[#1A1630] border border-[#252042] rounded-xl p-3 text-center">
      <div className={`font-['JetBrains_Mono'] text-2xl font-bold ${accent ? "text-[#FACC15]" : "text-[#F1F0F5]"}`}>
        {value}
      </div>
      <div className="text-[#A09BB5] text-[10px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-['Orbitron'] text-xs text-[#A78BFA] font-bold tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={`border rounded-lg p-3 ${INSIGHT_COLORS[insight.type]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{INSIGHT_ICONS[insight.type]}</span>
        <span className="text-[#F1F0F5] text-sm font-medium">{insight.title}</span>
      </div>
      <p className="text-[#A09BB5] text-xs leading-relaxed">{insight.description}</p>
    </div>
  );
}

function SuggestionCard({ suggestion, onStartPractice }: { suggestion: Suggestion; onStartPractice: (d: 1 | 2 | 3) => void }) {
  return (
    <div className="bg-[#1A1630] border border-[#8B5CF6]/20 rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[#F1F0F5] text-sm font-medium mb-0.5">{suggestion.action}</div>
        <p className="text-[#A09BB5] text-xs leading-relaxed">{suggestion.reason}</p>
      </div>
      <button
        onClick={() => onStartPractice(suggestion.difficulty)}
        className="shrink-0 px-3 py-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 text-[#A78BFA] text-xs
          font-bold rounded-lg transition-colors cursor-pointer min-h-[32px]"
      >
        GO
      </button>
    </div>
  );
}

function PatternBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 text-center">
      <div className="h-24 bg-[#252042]/40 rounded-lg relative overflow-hidden mb-1 flex items-end">
        <div className={`w-full ${color} rounded-lg transition-all duration-500`} style={{ height: `${Math.max(pct, 4)}%` }} />
      </div>
      <div className="font-['JetBrains_Mono'] text-sm text-[#F1F0F5] font-bold">{pct}%</div>
      <div className="text-[#A09BB5] text-[10px]">{label}</div>
    </div>
  );
}
