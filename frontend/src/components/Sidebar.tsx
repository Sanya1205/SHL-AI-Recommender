import { NavLink, useNavigate } from "react-router-dom";
import { MessageSquarePlus, History, ClipboardList, Settings, Sparkles, Trash2, UserCircle } from "lucide-react";
import type { Conversation } from "../types";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNewChat = () => {
    onNewChat();
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[280px] flex-col border-r border-outline/40 bg-sidebar p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl primary-gradient text-white shadow-glow-sm">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none text-primary-hover">SHL AI</h1>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-text-secondary opacity-70">
            Recruiter Copilot
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-3 rounded-lg border-l-2 border-primary bg-surface p-3 text-sm font-medium text-text-primary transition-all hover:scale-[0.99]"
        >
          <MessageSquarePlus size={18} />
          New Chat
        </button>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex w-full items-center gap-3 rounded-lg p-3 text-sm text-text-secondary transition-colors hover:bg-surface-variant ${
              isActive ? "bg-surface-variant text-text-primary" : ""
            }`
          }
        >
          <ClipboardList size={18} />
          Upload Job Description
        </NavLink>

        <div className="pb-2 pt-6">
          <p className="px-3 text-[10px] uppercase tracking-wider text-text-secondary/60">Recent Conversations</p>
        </div>

        {conversations.length === 0 && (
          <p className="px-3 text-xs text-text-secondary/50">Your conversations will appear here.</p>
        )}

        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 rounded-lg p-3 text-sm transition-colors hover:bg-surface-variant ${
              c.id === activeId ? "bg-surface-variant text-text-primary" : "text-text-secondary"
            }`}
          >
            <button
              onClick={() => {
                onSelectConversation(c.id);
                navigate("/");
              }}
              className="flex flex-1 items-center gap-3 overflow-hidden text-left"
            >
              <History size={16} className="shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
            <button
              onClick={() => onDeleteConversation(c.id)}
              className="shrink-0 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              title="Delete conversation"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline/40 pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg p-3 text-sm text-text-secondary transition-colors hover:bg-surface-variant ${
              isActive ? "bg-surface-variant text-text-primary" : ""
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-surface-variant ${
              isActive ? "bg-surface-variant text-text-primary" : "text-text-secondary"
            }`
          }
        >
          {user ? (
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: user.avatar_color }}
            >
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          ) : (
            <UserCircle size={18} />
          )}
          <span className="truncate">{user ? user.name : "Profile"}</span>
        </NavLink>
      </div>
    </aside>
  );
}
