import { useEffect, useCallback, useState, useRef } from "react";

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  ghostNumber?: number | null;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["-", "0", "⌫"],
];

export function NumPad({ value, onChange, onSubmit, disabled, ghostNumber }: NumPadProps) {
  const [flickerVisible, setFlickerVisible] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (flickerIntervalRef.current) {
      clearInterval(flickerIntervalRef.current);
      flickerIntervalRef.current = null;
    }
    setFlickerVisible(false);

    if (disabled || ghostNumber == null) return;

    idleTimerRef.current = setTimeout(() => {
      flickerIntervalRef.current = setInterval(() => {
        setFlickerVisible(true);
        setTimeout(() => setFlickerVisible(false), 150);
      }, 4000);
      setFlickerVisible(true);
      setTimeout(() => setFlickerVisible(false), 150);
    }, 10000);
  }, [disabled, ghostNumber]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (flickerIntervalRef.current) clearInterval(flickerIntervalRef.current);
    };
  }, [resetIdleTimer]);

  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return;

      resetIdleTimer();

      if (key === "⌫") {
        onChange(value.slice(0, -1));
        return;
      }

      if (key === "-") {
        // Toggle negative sign
        if (value.startsWith("-")) {
          onChange(value.slice(1));
        } else {
          onChange("-" + value);
        }
        return;
      }

      // Limit input length
      const numericPart = value.replace("-", "");
      if (numericPart.length >= 12) return;

      onChange(value + key);
    },
    [value, onChange, disabled, resetIdleTimer]
  );

  // Keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabled) return;

      if (e.key >= "0" && e.key <= "9") {
        handleKey(e.key);
      } else if (e.key === "Backspace") {
        handleKey("⌫");
      } else if (e.key === "-") {
        handleKey("-");
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, handleKey, onSubmit]);

  return (
    <div className="w-full max-w-xs mx-auto mt-4">
      {/* Current input display */}
      <div className="mb-3 h-12 flex items-center justify-center bg-[#1A1630] rounded-lg border border-[#252042]">
        <span className="font-['JetBrains_Mono'] text-2xl text-[#F1F0F5] font-bold tracking-wider min-w-[2ch] text-center">
          {flickerVisible && !value && ghostNumber != null ? (
            <span className="text-[#A09BB5]/20 animate-[flicker_0.15s_ease-in-out]">{ghostNumber}</span>
          ) : (
            value || <span className="text-[#A09BB5]/40">...</span>
          )}
        </span>
      </div>

      {/* Number pad grid */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            disabled={disabled}
            className="h-14 rounded-lg bg-[#252042] text-[#F1F0F5] font-['JetBrains_Mono'] font-bold text-xl
              hover:bg-[#8B5CF6]/30 active:scale-90 transition-all duration-100
              disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
              min-h-[44px] select-none"
            aria-label={key === "⌫" ? "Backspace" : key === "-" ? "Negative sign" : key}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={disabled || value === "" || value === "-"}
        className="w-full mt-3 py-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white
          font-['Orbitron'] font-bold text-base tracking-wider
          shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50
          active:scale-95 transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
      >
        SUBMIT
      </button>
    </div>
  );
}
