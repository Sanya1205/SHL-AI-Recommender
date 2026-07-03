export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string | null;
  created_at: string;
  avatar_color: string;
}

export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
  id?: string;
  timestamp?: number;
}

export interface Recommendation {
  name: string;
  url: string;
  test_type?: string | null;
  category?: string | null;
  duration?: string | null;
  skills: string[];
  description?: string | null;
  confidence?: number | null;
  remote_testing?: boolean | null;
  adaptive?: boolean | null;
  languages?: string | null;
}

export interface ChatResponse {
  reply: string;
  recommendations: Recommendation[];
  end_of_conversation: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  recommendations: Recommendation[];
  updatedAt: number;
}

export const TEST_TYPE_LABELS: Record<string, string> = {
  A: "Ability & Aptitude",
  B: "Biodata & SJT",
  C: "Competencies",
  D: "Development & 360",
  E: "Assessment Exercises",
  K: "Knowledge & Skills",
  P: "Personality",
  S: "Simulations",
};
