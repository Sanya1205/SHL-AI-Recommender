export const DEFAULT_PROMPTS = [
  "Hire a Java Developer",
  "Need a Leadership Assessment",
  "Hiring a Data Scientist",
  "Compare OPQ vs GSA",
  "Technical hiring for a support role",
  "Entry-level graduate hiring",
];

export default function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {DEFAULT_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="glass-panel rounded-full px-4 py-2 text-sm text-text-primary transition-all hover:scale-105 hover:bg-surface-variant"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
