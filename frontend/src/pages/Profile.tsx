import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, Loader2, CheckCircle2, Mail, Building2, Briefcase, CalendarDays } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useConversations } from "../hooks/useConversations";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { conversations } = useConversations();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState(user?.role ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateProfile({ name, role, company });
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Couldn't save changes.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h2 className="mb-8 text-2xl font-bold text-text-primary">Profile</h2>

      <div className="glass-panel mb-6 flex items-center gap-5 rounded-2xl p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
          style={{ backgroundColor: user.avatar_color }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-text-primary">{user.name}</p>
          <p className="flex items-center gap-1.5 truncate text-sm text-text-secondary">
            <Mail size={13} /> {user.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-outline px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-red-400/50 hover:text-red-400"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary-hover">{conversations.length}</p>
          <p className="text-xs text-text-secondary">Conversations</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary-hover">
            {conversations.reduce((sum, c) => sum + c.recommendations.length, 0)}
          </p>
          <p className="text-xs text-text-secondary">Assessments Reviewed</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs font-medium text-text-secondary">
            <CalendarDays size={13} /> Joined
          </p>
          <p className="mt-1 text-xs text-text-primary">{joinedDate}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="glass-panel space-y-4 rounded-2xl p-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary-hover">Edit Details</h3>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <Briefcase size={12} /> Role
            </label>
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
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <Building2 size={12} /> Company
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-xl primary-gradient px-6 py-3 text-sm font-bold text-white shadow-glow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
