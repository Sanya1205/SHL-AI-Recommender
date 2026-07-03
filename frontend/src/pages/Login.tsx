import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login({ email, password });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl primary-gradient shadow-glow">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to SHL AI Recruiter Copilot</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-2xl p-8">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl primary-gradient py-3 text-sm font-bold text-white shadow-glow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary-hover hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
