import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../types";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient">
          <Sparkles size={16} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
          isUser
            ? "primary-gradient rounded-tr-none text-white shadow-glow-sm"
            : "glass-panel rounded-tl-none border-l-2 border-l-primary text-text-primary"
        }`}
      >
        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-table:text-xs">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-variant">
          <User size={16} />
        </div>
      )}
    </motion.div>
  );
}
