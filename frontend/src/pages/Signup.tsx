import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Recruiter");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signup({ name, email, password, role, company });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl primary-gradient shadow-glow">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-text-secondary">Start finding the right SHL assessments faster</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-2xl p-8">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Lee"
              className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none"
              >
                <option>Recruiter</option>
                <option>Hiring Manager</option>
                <option>HR Business Partner</option>
                <option>Talent Acquisition Lead</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Company (optional)</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl primary-gradient py-3 text-sm font-bold text-white shadow-glow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-hover hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
