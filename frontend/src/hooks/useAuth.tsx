import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  extractApiErrorMessage,
  fetchCurrentUser,
  getAuthToken,
  loginRequest,
  setAuthToken,
  signupRequest,
  updateProfileRequest,
} from "../services/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signup: (input: { name: string; email: string; password: string; role: string; company?: string }) => Promise<{ ok: boolean; error?: string }>;
  login: (input: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "role" | "company">>) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setAuthToken(null))
      .finally(() => setIsLoading(false));
  }, []);

  const signup: AuthContextValue["signup"] = async ({ name, email, password, role, company }) => {
    try {
      const { access_token, user: newUser } = await signupRequest({ name, email, password, role, company });
      setAuthToken(access_token);
      setUser(newUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiErrorMessage(error, "Couldn't create your account. Please try again.") };
    }
  };

  const login: AuthContextValue["login"] = async ({ email, password }) => {
    try {
      const { access_token, user: loggedInUser } = await loginRequest({ email, password });
      setAuthToken(access_token);
      setUser(loggedInUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiErrorMessage(error, "Incorrect email or password.") };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const updateProfile: AuthContextValue["updateProfile"] = async (updates) => {
  try {
    const sanitizedUpdates = {
      ...updates,
      company: updates.company ?? undefined,
    };
    const updated = await updateProfileRequest(sanitizedUpdates);
      setUser(updated);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiErrorMessage(error, "Couldn't update your profile.") };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
