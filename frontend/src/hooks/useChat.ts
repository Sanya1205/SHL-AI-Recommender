import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "../services/api";
import type { ChatMessage, ChatResponse } from "../types";

interface UseChatOptions {
  onSuccess?: (response: ChatResponse, sentMessages: ChatMessage[]) => void;
}

export function useChat({ onSuccess }: UseChatOptions = {}) {
  const mutation = useMutation({
    mutationFn: (messages: ChatMessage[]) => sendChatMessage(messages),
    onSuccess: (data, variables) => onSuccess?.(data, variables),
  });

  return {
    sendMessages: mutation.mutate,
    sendMessagesAsync: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}
