import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export function AuthModal({ isOpen, onClose, onShowToast }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await register(email, password, displayName || undefined);
        onShowToast("Account created! Your progress is now saved.");
      } else {
        await login(email, password);
        onShowToast("Welcome back!");
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1630] border border-[#252042] rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Orbitron'] text-xl font-bold text-[#F1F0F5] text-center mb-1">
          {mode === "register" ? "SAVE YOUR PROGRESS" : "WELCOME BACK"}
        </h2>
        <p className="text-[#A09BB5] text-sm text-center mb-6">
          {mode === "register"
            ? "Create an account to keep your streak across devices"
            : "Sign in to your account"}
        </p>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
              mode === "register"
                ? "bg-[#8B5CF6] text-white"
                : "bg-[#252042] text-[#A09BB5] hover:text-[#F1F0F5]"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
              mode === "login"
                ? "bg-[#8B5CF6] text-white"
                : "bg-[#252042] text-[#A09BB5] hover:text-[#F1F0F5]"
            }`}
          >
            Log In
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-[#252042] border border-[#8B5CF6]/20 rounded-lg
                text-[#F1F0F5] placeholder-[#A09BB5]/60 text-sm
                focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#252042] border border-[#8B5CF6]/20 rounded-lg
              text-[#F1F0F5] placeholder-[#A09BB5]/60 text-sm
              focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
          />
          <input
            type="password"
            placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : 1}
            className="w-full px-4 py-3 bg-[#252042] border border-[#8B5CF6]/20 rounded-lg
              text-[#F1F0F5] placeholder-[#A09BB5]/60 text-sm
              focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-['Orbitron']
              font-bold text-sm rounded-xl transition-all duration-200
              shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50
              active:scale-95 min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : mode === "register" ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-[#A09BB5] hover:text-[#F1F0F5] text-sm transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
