"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthUser = Record<string, unknown> | null;

type AuthContextType = {
  token: string | null;
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user?: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "cp_access_token";
const AUTH_USER_KEY = "cp_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedUser = localStorage.getItem(AUTH_USER_KEY);

      if (savedToken) {
        setToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: AuthUser = null) => {
    setToken(newToken);
    setUser(newUser);

    localStorage.setItem(AUTH_TOKEN_KEY, newToken);

    if (newUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}