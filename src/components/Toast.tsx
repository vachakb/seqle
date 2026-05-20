import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
      <div className="bg-[#1A1630] border border-[#8B5CF6] rounded-lg px-5 py-3 shadow-lg shadow-[#7C3AED]/20 text-[#F1F0F5] text-sm font-medium max-w-[90vw]">
        {message}
      </div>
    </div>
  );
}
