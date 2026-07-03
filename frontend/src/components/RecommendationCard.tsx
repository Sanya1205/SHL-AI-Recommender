import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Bookmark, BarChart3 } from "lucide-react";
import type { Recommendation } from "../types";
import { TEST_TYPE_LABELS } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  P: "text-tertiary border-tertiary/30 bg-tertiary/10",
  K: "text-primary-hover border-primary/30 bg-primary/10",
  A: "text-secondary border-secondary/30 bg-secondary/10",
};

export default function RecommendationCard({
  rec,
  onViewDetails,
}: {
  rec: Recommendation;
  onViewDetails: (rec: Recommendation) => void;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const colorClass = CATEGORY_COLORS[rec.test_type ?? ""] ?? "text-secondary border-secondary/30 bg-secondary/10";
  const categoryLabel = rec.category || TEST_TYPE_LABELS[rec.test_type ?? ""] || "Assessment";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-panel rounded-2xl p-5"
    >
      <div className="mb-3 flex items-start justify-between">
        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
          {categoryLabel}
        </span>
        <button onClick={() => setBookmarked((b) => !b)} className="text-text-secondary hover:text-primary-hover">
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      <h3 className="mb-1 text-base font-bold text-text-primary">{rec.name}</h3>
      {rec.description && (
        <p className="mb-3 line-clamp-2 text-xs text-text-secondary">{rec.description}</p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        {rec.duration && (
          <span className="flex items-center gap-1">
            <Clock size={13} /> {rec.duration}
          </span>
        )}
        {rec.confidence != null && (
          <span className="flex items-center gap-1">
            <BarChart3 size={13} /> {rec.confidence}% match
          </span>
        )}
      </div>

      {rec.skills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {rec.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded bg-surface-variant px-2 py-0.5 text-[11px] text-text-secondary">
              {skill}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => onViewDetails(rec)}
        className="w-full rounded-xl border border-outline py-2.5 text-sm font-medium text-text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"
      >
        View Details
      </button>
    </motion.div>
  );
}
