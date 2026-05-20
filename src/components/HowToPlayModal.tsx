interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    number: 1,
    title: "Spot the pattern",
    description:
      "You see the start of a sequence. Guess what comes next.",
    example: "2, 4, 6, 8, ?",
    color: "#8B5CF6",
  },
  {
    number: 2,
    title: "Get feedback",
    description:
      "GREEN = correct. YELLOW with arrow = the answer is higher or lower.",
    example: "🟩 = right, 🟨↑ = go higher, 🟨↓ = go lower",
    color: "#22C55E",
  },
  {
    number: 3,
    title: "Unlock a hint",
    description:
      "After 3 guesses, you get a hint about the sequence type (e.g., Polynomial, Recursive).",
    example: "Hint: This is a POLYNOMIAL sequence",
    color: "#EAB308",
  },
  {
    number: 4,
    title: "Crack the code",
    description:
      "Get 3 correct in a row to crack the code. You have 6 guesses total.",
    example: "3 in a row = WIN",
    color: "#FACC15",
  },
];

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1630] border border-[#252042] rounded-2xl p-6 w-full max-w-sm animate-[fadeIn_0.2s_ease-out] shadow-2xl max-h-[90vh] overflow-y-auto">
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

        <h2 className="font-['Orbitron'] text-lg font-bold text-[#F1F0F5] text-center mb-6 tracking-wider">
          HOW TO PLAY
        </h2>

        <div className="space-y-5">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-3">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-['Orbitron'] text-sm font-bold text-[#0D0B1A]"
                style={{ backgroundColor: step.color }}
              >
                {step.number}
              </div>
              <div className="flex-1">
                <h3 className="text-[#F1F0F5] text-sm font-semibold mb-1">
                  {step.title}
                </h3>
                <p className="text-[#A09BB5] text-xs leading-relaxed mb-1">
                  {step.description}
                </p>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#8B5CF6]/70">
                  {step.example}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 px-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white
            font-['Orbitron'] font-bold text-sm rounded-xl transition-all duration-200
            shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50
            active:scale-95 min-h-[44px] cursor-pointer"
        >
          GOT IT!
        </button>
      </div>
    </div>
  );
}
