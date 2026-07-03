import { useRef, useState, type KeyboardEvent } from "react";
import { Send, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="glass-panel flex items-end gap-2 rounded-3xl p-2 shadow-2xl">
      <div className="flex flex-1 flex-col p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder ?? "Describe the role you're hiring for…"}
          className="w-full resize-none border-none bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-0"
        />
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={() => navigate("/upload")}
            title="Upload Job Description"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-variant"
          >
            <Paperclip size={18} />
          </button>
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="m-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl primary-gradient text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
