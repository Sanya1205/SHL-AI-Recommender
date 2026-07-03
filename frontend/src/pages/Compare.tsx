import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { GitCompare, Loader2 } from "lucide-react";
import { sendChatMessage } from "../services/api";
import type { Recommendation } from "../types";

export default function Compare() {
  const [left, setLeft] = useState("OPQ32r");
  const [right, setRight] = useState("General Ability Screener (GSA)");
  const [isLoading, setIsLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!left.trim() || !right.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await sendChatMessage([
        { role: "user", content: `What is the difference between ${left} and ${right}?` },
      ]);
      setReply(response.reply);
      setRecs(response.recommendations);
    } catch {
      setError("Couldn't reach the assessment service. Please check the API is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-text-primary">Compare Assessments</h2>
        <p className="text-text-secondary">
          Deep-dive analysis between two SHL assessments, grounded strictly in catalog data.
        </p>
      </div>

      <div className="glass-panel mb-8 grid grid-cols-1 gap-4 rounded-2xl p-6 md:grid-cols-[1fr_auto_1fr_auto]">
        <input
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="First assessment (e.g. OPQ32r)"
          className="rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
        />
        <div className="flex items-center justify-center text-text-secondary">vs</div>
        <input
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder="Second assessment (e.g. GSA)"
          className="rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleCompare}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl primary-gradient px-6 py-3 text-sm font-bold text-white shadow-glow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
          Compare
        </button>
      </div>

      {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

      {reply && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="prose prose-invert max-w-none prose-table:text-sm prose-th:text-primary-hover">
            <ReactMarkdown>{reply}</ReactMarkdown>
          </div>
        </div>
      )}

      {recs.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {recs.map((r) => (
            <div key={r.url} className="glass-panel rounded-xl p-5">
              <h4 className="mb-1 font-bold text-text-primary">{r.name}</h4>
              <p className="mb-2 text-xs text-text-secondary">{r.description}</p>
              <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary-hover hover:underline">
                View on SHL Catalog →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
