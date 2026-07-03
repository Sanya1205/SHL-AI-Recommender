import { Sparkles } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="glass-panel flex items-center gap-2 rounded-2xl rounded-tl-none px-5 py-4">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.2s]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.4s]" />
        <span className="ml-1 text-xs italic text-primary-hover">Searching SHL catalog…</span>
      </div>
    </div>
  );
}
