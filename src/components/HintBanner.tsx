interface HintBannerProps {
  family: string;
  visible: boolean;
}

export function HintBanner({ family, visible }: HintBannerProps) {
  if (!visible) return null;

  return (
    <div className="w-full max-w-sm mx-auto my-3 animate-[slideDown_0.4s_ease-out]">
      <div className="bg-[#252042]/80 border border-[#8B5CF6]/40 rounded-lg px-4 py-3 text-center shadow-lg shadow-[#7C3AED]/10">
        <span className="text-[#A09BB5] text-xs uppercase tracking-widest">Hint</span>
        <p className="text-[#A78BFA] font-['Orbitron'] text-sm font-bold mt-1">
          This is a{" "}
          <span className="text-[#8B5CF6] uppercase">{family}</span>{" "}
          sequence
        </p>
      </div>
    </div>
  );
}
