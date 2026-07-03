import axios from "axios";
import type { ChatMessage, ChatResponse, User } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "shl-ai-token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach the JWT (if present) to every request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ---- Chat ----

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  const payload = {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  const { data } = await apiClient.post<ChatResponse>("/chat", payload);
  return data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await apiClient.get("/health");
    return data?.status === "ok";
  } catch {
    return false;
  }
}

export async function parseJobDescriptionFile(file: File): Promise<{ message: string; extracted_chars: number }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/jd/parse", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ---- Auth ----

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function signupRequest(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  company?: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/signup", input);
  return data;
}

export async function loginRequest(input: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

export async function updateProfileRequest(updates: {
  name?: string;
  role?: string;
  company?: string;
}): Promise<User> {
  const { data } = await apiClient.patch<User>("/auth/profile", updates);
  return data;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return fallback;
}
