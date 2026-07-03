import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useConversations } from "../hooks/useConversations";
import type { Conversation, ChatMessage, Recommendation } from "../types";

export interface LayoutContext {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeId: string | null;
  setActiveId: (id: string) => void;
  createConversation: () => string;
  updateConversation: (id: string, messages: ChatMessage[], recommendations: Recommendation[]) => void;
  deleteConversation: (id: string) => void;
}

export default function Layout() {
  const {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    createConversation,
    updateConversation,
    deleteConversation,
  } = useConversations();

  const context: LayoutContext = {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    createConversation,
    updateConversation,
    deleteConversation,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        onNewChat={createConversation}
        onDeleteConversation={deleteConversation}
      />
      <div className="ml-[280px] flex min-h-screen flex-col">
        <TopBar />
        <main className="flex-1">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
