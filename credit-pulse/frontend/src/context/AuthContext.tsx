"use client";

// This file provides shared authentication state for the frontend app.
import axios from "axios";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthUser = {
  id?: string;
  userId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
} | null;

type AuthContextType = {
  token: string | null;
  user: AuthUser;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string, user?: AuthUser) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "cp_access_token";
const AUTH_USER_KEY = "cp_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminAccess = useCallback(
    async (accessToken: string): Promise<boolean> => {
      try {
        const response = await axios.get("/auth/fetch-user-role", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const roleCode =
          response.data?.data?.roleCode ??
          response.data?.roleCode ??
          response.data?.data?.role_code ??
          response.data?.role_code;

        return typeof roleCode === "string" && roleCode === "ADMIN";
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;

          if (statusCode === 401 || statusCode === 403) {
            return false;
          }
        }

        return false;
      }
    },
    [],
  );

  useEffect(() => {
    // Restores the previous browser session after a refresh.
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const savedUser = localStorage.getItem(AUTH_USER_KEY);

        if (savedToken) {
          setToken(savedToken);
          const adminAccess = await checkAdminAccess(savedToken);
          setIsAdmin(adminAccess);
        }

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Failed to restore auth session:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [checkAdminAccess]);

  const login = useCallback(
    async (newToken: string, newUser: AuthUser = null) => {
      // Saves the new session in both React state and local storage.
      setToken(newToken);
      setUser(newUser);

      localStorage.setItem(AUTH_TOKEN_KEY, newToken);

      if (newUser) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }

      const adminAccess = await checkAdminAccess(newToken);
      setIsAdmin(adminAccess);
      return adminAccess;
    },
    [checkAdminAccess],
  );

  const logout = () => {
    // Clears the browser session and resets auth-related UI state.
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      isAdmin,
      isLoading,
      login,
      logout,
    }),
    [token, user, isAdmin, isLoading, login]
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
