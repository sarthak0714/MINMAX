import { useState } from "react";
import { setAuth, verifyPassword } from "../lib/auth";

type Props = {
  onAuthenticated: () => void;
};

export default function AuthScreen({ onAuthenticated }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (verifyPassword(password)) {
      setAuth(true);
      onAuthenticated();
    } else {
      setError("Incorrect password");
      setPassword("");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="relative p-0 m-0 aspect-[9/19.5] h-screen max-h-[844px] overflow-hidden flex flex-col items-center justify-center">
        <div className="w-full max-w-sm px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Password"
                autoFocus
                className="w-full px-4 h-12 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              {error && (
                <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="w-full h-12 rounded-full bg-white/20 border border-white/40 text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
