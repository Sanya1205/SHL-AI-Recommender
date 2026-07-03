import { useCallback, useEffect, useState } from "react";
import type { ChatMessage, Conversation, Recommendation } from "../types";

const STORAGE_KEY = "shl-ai-conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function persist(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Storage full or unavailable — fail silently, app remains usable in-memory.
  }
}

function titleFromMessage(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || "New conversation";
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  useEffect(() => {
    persist(conversations);
  }, [conversations]);

  const createConversation = useCallback((): string => {
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: "New conversation",
      messages: [],
      recommendations: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  const updateConversation = useCallback(
    (id: string, messages: ChatMessage[], recommendations: Recommendation[]) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                messages,
                recommendations,
                title: c.messages.length === 0 && messages[0] ? titleFromMessage(messages[0].content) : c.title,
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
    },
    [],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveId((current) => (current === id ? null : current));
    },
    [],
  );

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    createConversation,
    updateConversation,
    deleteConversation,
  };
}
