import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, Clock, Globe, Radio, Brain } from "lucide-react";
import type { Recommendation } from "../types";
import { TEST_TYPE_LABELS } from "../types";

export default function DetailsDrawer({
  recommendation,
  onClose,
}: {
  recommendation: Recommendation | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {recommendation && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-outline/40 bg-background-secondary p-6 custom-scrollbar"
          >
            <div className="mb-6 flex items-start justify-between">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-hover">
                {recommendation.category || TEST_TYPE_LABELS[recommendation.test_type ?? ""] || "Assessment"}
              </span>
              <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                <X size={22} />
              </button>
            </div>

            <h2 className="mb-4 text-2xl font-bold text-text-primary">{recommendation.name}</h2>

            <section className="mb-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-hover">Overview</h4>
              <p className="text-sm leading-relaxed text-text-secondary">
                {recommendation.description || "No description available from the catalog for this assessment."}
              </p>
            </section>

            {recommendation.skills.length > 0 && (
              <section className="mb-6">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-hover">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.skills.map((s) => (
                    <span key={s} className="rounded-full bg-surface-variant px-3 py-1 text-xs text-text-primary">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-6 grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-4">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Clock size={14} />
                  <span className="text-xs">Duration</span>
                </div>
                <p className="text-sm font-medium text-text-primary">{recommendation.duration || "—"}</p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Globe size={14} />
                  <span className="text-xs">Languages</span>
                </div>
                <p className="text-sm font-medium text-text-primary">{recommendation.languages || "—"}</p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Radio size={14} />
                  <span className="text-xs">Remote Testing</span>
                </div>
                <p className="text-sm font-medium text-text-primary">
                  {recommendation.remote_testing === null || recommendation.remote_testing === undefined
                    ? "—"
                    : recommendation.remote_testing
                    ? "Yes"
                    : "No"}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Brain size={14} />
                  <span className="text-xs">Adaptive</span>
                </div>
                <p className="text-sm font-medium text-text-primary">
                  {recommendation.adaptive === null || recommendation.adaptive === undefined
                    ? "—"
                    : recommendation.adaptive
                    ? "Yes"
                    : "No"}
                </p>
              </div>
            </section>

            <a
              href={recommendation.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl primary-gradient py-3 text-sm font-bold text-white shadow-glow-sm transition-opacity hover:opacity-90"
            >
              View on SHL Catalog <ExternalLink size={16} />
            </a>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
