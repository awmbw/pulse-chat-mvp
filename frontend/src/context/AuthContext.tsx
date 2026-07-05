import { socket } from "@/lib/socket";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginRequest, registerRequest, type AuthUser } from "@/lib/auth";
import { generateKeyPair, exportPublicKey, exportPrivateKey } from "@/lib/crypto";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "pulse_token";
const USER_KEY = "pulse_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken) {
      setToken(storedToken);
      socket.connect(); // Pick up the phone if already logged in!
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const persist = (t: string, u: AuthUser | undefined) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    socket.connect(); // Pick up the phone!
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    }
  };

  const login = async (email: string, password: string) => {
    let pubKeyStr = localStorage.getItem(`PUBLIC_KEY_${email}`);
    let privKeyStr = localStorage.getItem(`PRIVATE_KEY_${email}`);

    // If logging in from a new device, generate new keys
    if (!pubKeyStr || !privKeyStr) {
      const keyPair = await generateKeyPair();
      pubKeyStr = await exportPublicKey(keyPair.publicKey);
      privKeyStr = await exportPrivateKey(keyPair.privateKey);
      localStorage.setItem(`PUBLIC_KEY_${email}`, pubKeyStr);
      localStorage.setItem(`PRIVATE_KEY_${email}`, privKeyStr);
    }

    const res = await loginRequest(email, password, pubKeyStr);
    persist(res.token, { _id: res._id, email: res.email, username: res.username } as any);
  };

  const register = async (username: string, email: string, password: string) => {
    const keyPair = await generateKeyPair();
    const pubKeyStr = await exportPublicKey(keyPair.publicKey);
    const privKeyStr = await exportPrivateKey(keyPair.privateKey);
    localStorage.setItem(`PUBLIC_KEY_${email}`, pubKeyStr);
    localStorage.setItem(`PRIVATE_KEY_${email}`, privKeyStr);

    const res = await registerRequest(username, email, password, pubKeyStr);
    persist(res.token, { _id: res._id, email: res.email, username: res.username } as any);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    socket.disconnect(); // Hang up the phone!
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
