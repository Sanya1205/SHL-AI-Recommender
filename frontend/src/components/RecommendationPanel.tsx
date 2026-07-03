import { AnimatePresence, motion } from "framer-motion";
import { Radar } from "lucide-react";
import type { Recommendation } from "../types";
import RecommendationCard from "./RecommendationCard";

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onViewDetails: (rec: Recommendation) => void;
}

export default function RecommendationPanel({ recommendations, onViewDetails }: RecommendationPanelProps) {
  return (
    <aside className="hidden h-full w-[340px] shrink-0 flex-col border-l border-outline/30 bg-background-secondary/60 lg:flex">
      <div className="border-b border-outline/30 p-6">
        <h3 className="text-lg font-bold text-text-primary">Recommendations</h3>
        <p className="mt-1 text-xs text-text-secondary">
          {recommendations.length > 0
            ? `${recommendations.length} tailored match${recommendations.length > 1 ? "es" : ""}`
            : "Insights will appear as you chat"}
        </p>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        {recommendations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center opacity-50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-outline">
              <Radar size={24} className="text-text-secondary" />
            </div>
            <p className="text-sm text-text-secondary">
              Describe your talent needs to see tailored assessment suites.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {recommendations.map((rec) => (
              <motion.div
                key={rec.url}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <RecommendationCard rec={rec} onViewDetails={onViewDetails} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
}
