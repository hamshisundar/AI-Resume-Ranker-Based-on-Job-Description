import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  apiErrorMessage,
  fetchMe,
  loginRequest,
  logoutRequest,
  setAccessToken,
  signupRequest,
  getAccessToken,
} from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return { authenticated: false, user: null };
    }
    const data = await fetchMe();
    if (data.authenticated && data.user) {
      setUser(data.user);
    } else {
      setUser(null);
      setAccessToken(null);
    }
    return data;
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootstrapError(null);
    try {
      await refreshMe();
    } catch (e) {
      setUser(null);
      const status = e?.response?.status;
      const detail = e?.response ? apiErrorMessage(e) : null;
      const isServerError = typeof status === "number" && status >= 500;
      const msg =
        e?.code === "ECONNABORTED" || String(e?.message || "").includes("timeout")
          ? "Request timed out. Check that the API is running and VITE_PROXY_TARGET in frontend/.env.development matches your Uvicorn port."
          : e?.response
            ? isServerError
              ? `API error (${status})${detail && detail !== e?.message ? `: ${detail}` : ""}. If you use Vite, ensure VITE_PROXY_TARGET matches the backend (default http://127.0.0.1:8000) and restart npm run dev.`
              : `API error (${status}). Open the app via the Vite dev URL (npm run dev), not the API port only.${detail && detail !== e?.message ? ` ${detail}` : ""}`
            : "Cannot reach the API. Start the backend (e.g. uvicorn on port 8000) and match VITE_PROXY_TARGET; see the project README.";
      setBootstrapError(msg);
    } finally {
      setLoading(false);
    }
  }, [refreshMe]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email, password) => {
      const data = await loginRequest({ email, password });
      setAccessToken(data.access_token);
      setUser(data.user);
    },
    [],
  );

  const signup = useCallback(
    async (email, password) => {
      const data = await signupRequest({ email, password });
      setAccessToken(data.access_token);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    try {
      await logoutRequest();
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      bootstrapError,
      login,
      signup,
      logout,
      refreshMe,
    }),
    [user, loading, bootstrapError, login, signup, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
