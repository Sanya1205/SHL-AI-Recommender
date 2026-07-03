import { useOutletContext } from "react-router-dom";
import { Download, Trash2, Moon, Cpu, Languages } from "lucide-react";
import type { LayoutContext } from "./Layout";

export default function Settings() {
  const { conversations, deleteConversation } = useOutletContext<LayoutContext>();

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shl-ai-conversations.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    conversations.forEach((c) => deleteConversation(c.id));
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h2 className="mb-8 text-2xl font-bold text-text-primary">Settings</h2>

      <div className="space-y-4">
        <div className="glass-panel flex items-center justify-between rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-primary-hover" />
            <div>
              <p className="font-medium text-text-primary">Theme</p>
              <p className="text-xs text-text-secondary">Dark Violet Premium (default)</p>
            </div>
          </div>
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary-hover">Active</span>
        </div>

        <div className="glass-panel flex items-center justify-between rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Languages size={18} className="text-primary-hover" />
            <div>
              <p className="font-medium text-text-primary">Language</p>
              <p className="text-xs text-text-secondary">English</p>
            </div>
          </div>
        </div>

        <div className="glass-panel flex items-center justify-between rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Cpu size={18} className="text-primary-hover" />
            <div>
              <p className="font-medium text-text-primary">AI Model</p>
              <p className="text-xs text-text-secondary">Google Gemini 2.5 Flash</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="glass-panel flex w-full items-center justify-between rounded-xl p-5 text-left transition-colors hover:bg-surface-variant"
        >
          <div className="flex items-center gap-3">
            <Download size={18} className="text-primary-hover" />
            <div>
              <p className="font-medium text-text-primary">Export Chat History</p>
              <p className="text-xs text-text-secondary">Download all conversations as JSON</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleClearAll}
          className="glass-panel flex w-full items-center justify-between rounded-xl p-5 text-left transition-colors hover:bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-red-400" />
            <div>
              <p className="font-medium text-text-primary">Clear History</p>
              <p className="text-xs text-text-secondary">Deletes all locally stored conversations</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
