import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import SuggestedPrompts from "../components/SuggestedPrompts";
import RecommendationPanel from "../components/RecommendationPanel";
import DetailsDrawer from "../components/DetailsDrawer";
import { useChat } from "../hooks/useChat";
import type { ChatMessage, Recommendation } from "../types";
import type { LayoutContext } from "./Layout";

export default function Workspace() {
  const { activeConversation, activeId, createConversation, updateConversation } =
    useOutletContext<LayoutContext>();

  const [messages, setMessages] = useState<ChatMessage[]>(activeConversation?.messages ?? []);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    activeConversation?.recommendations ?? [],
  );
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(activeConversation?.messages ?? []);
    setRecommendations(activeConversation?.recommendations ?? []);
  }, [activeConversation?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const { sendMessagesAsync, isSending } = useChat();

  const handleSend = async (text: string) => {
    let convId = activeId;
    if (!convId) {
      convId = createConversation();
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    try {
      const response = await sendMessagesAsync(nextMessages);
      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: response.reply },
      ];
      setMessages(finalMessages);
      setRecommendations(response.recommendations);
      updateConversation(convId, finalMessages, response.recommendations);
    } catch {
      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        {
          role: "assistant",
          content: "I couldn't reach the assessment service. Please check the API is running and try again.",
        },
      ];
      setMessages(finalMessages);
      updateConversation(convId, finalMessages, recommendations);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <section className="flex flex-1 flex-col overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl primary-gradient shadow-glow"
            >
              <Sparkles size={40} className="text-white" />
            </motion.div>
            <h2 className="mb-3 text-3xl font-bold text-text-primary">SHL AI Assessment Recommender</h2>
            <p className="mb-8 max-w-xl text-text-secondary">
              Find the right SHL assessments through intelligent conversations. Describe your role,
              challenges, or goals.
            </p>
            <div className="mb-10 max-w-2xl">
              <SuggestedPrompts onSelect={handleSend} />
            </div>
            <div className="w-full max-w-3xl">
              <ChatInput onSend={handleSend} disabled={isSending} />
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-text-secondary/50">
              Powered by SHL Advanced Psychometrics &amp; Generative AI
            </p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-8 py-8">
              {messages.map((m, idx) => (
                <MessageBubble key={idx} message={m} />
              ))}
              {isSending && <TypingIndicator />}
            </div>
            <div className="border-t border-outline/20 bg-gradient-to-t from-background to-transparent px-8 py-6">
              <div className="mx-auto max-w-3xl">
                <ChatInput onSend={handleSend} disabled={isSending} />
              </div>
            </div>
          </>
        )}
      </section>

      <RecommendationPanel recommendations={recommendations} onViewDetails={setSelectedRec} />
      <DetailsDrawer recommendation={selectedRec} onClose={() => setSelectedRec(null)} />
    </div>
  );
}
