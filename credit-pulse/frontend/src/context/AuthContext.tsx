"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthUser = {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string | null;
  phone?: string | null;
  roleCode?: string;
  roleType?: string;
  roleName?: string;
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

  const checkAdminAccess = useCallback(async (accessToken: string): Promise<boolean> => {
    // Uses an existing admin-protected backend api to verify admin access
    try {
      const formData = new FormData();

      await axios.post("/api/users/upload-excel", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return true;
    } catch (error) {
      // Interprets backend response to detect admin access
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 400 &&
          typeof apiMessage === "string" &&
          apiMessage.toLowerCase().includes("excel file is required")
        ) {
          return true;
        }

        if (statusCode === 401 || statusCode === 403) {
          return false;
        }
      }

      return false;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      // Restores saved login session from local storage
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
        // Clears invalid saved data if parsing fails
        console.error("Failed to restore auth session:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setIsAdmin(false);
      } finally {
        // Ends loading state after restore is complete
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [checkAdminAccess]);

  const login = useCallback(
    async (newToken: string, newUser: AuthUser = null) => {
      // Saves token and user in state
      setToken(newToken);
      setUser(newUser);

      // Saves token and user in local storage
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);

      if (newUser) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }

      // Checks admin access after successful sign in
      const adminAccess = await checkAdminAccess(newToken);
      setIsAdmin(adminAccess);

      return adminAccess;
    },
    [checkAdminAccess]
  );

  const logout = useCallback(() => {
    // Clears saved login session
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

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
    [token, user, isAdmin, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  // Prevents use outside the auth provider
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}