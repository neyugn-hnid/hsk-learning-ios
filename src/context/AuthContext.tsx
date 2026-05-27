import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/storage";
import { fetchMe, mobileLogin, mobileRegister, updateProfileName } from "@/lib/api";
import type { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const savedToken = await getStoredToken();
      if (!savedToken) return;
      const response = await fetchMe(savedToken);
      setToken(savedToken);
      setUser(response.user);
    } catch {
      await clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await mobileLogin(email, password);
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function signUp(name: string, email: string, password: string) {
    const response = await mobileRegister(name, email, password);
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function signOut() {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }

  async function updateName(name: string) {
    if (!token) {
      throw new Error("Bạn chưa đăng nhập.");
    }
    const response = await updateProfileName(token, name);
    setUser(response.user);
  }

  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, updateName, signOut }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
