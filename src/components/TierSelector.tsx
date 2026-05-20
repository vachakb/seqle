import { TIER_INFO } from "../game/sequences";

interface TierSelectorProps {
  onSelect: (difficulty: 1 | 2 | 3) => void;
}

const TIER_ICONS: Record<1 | 2 | 3, string> = {
  1: "∼",
  2: "∆",
  3: "⚡",
};

export function TierSelector({ onSelect }: TierSelectorProps) {
  const tiers = [1, 2, 3] as const;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]">
      {tiers.map((tier) => {
        const info = TIER_INFO[tier];
        return (
          <button
            key={tier}
            onClick={() => onSelect(tier)}
            className="flex-1 border border-[#8B5CF6]/50 rounded-xl p-4 bg-[#1A1630]/60
              hover:border-[#8B5CF6] hover:shadow-lg hover:shadow-[#7C3AED]/20
              transition-all duration-200 cursor-pointer text-left
              active:scale-95 min-h-[44px]"
          >
            <div className="text-2xl mb-1">{TIER_ICONS[tier]}</div>
            <div className="font-['Orbitron'] text-sm font-bold text-[#A78BFA] mb-1">
              {info.label}
            </div>
            <div className="text-xs text-[#A09BB5] leading-snug">
              {info.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
