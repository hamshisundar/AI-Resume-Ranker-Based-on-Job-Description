import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setCsrfTokenRef, fetchCsrfToken, fetchMe, loginRequest, logoutRequest, signupRequest } from "../api/client";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authDisabled, setAuthDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);
  const csrfRef = useRef(null);

  useEffect(() => {
    setCsrfTokenRef(csrfRef);
  }, []);

  const refreshCsrf = useCallback(async () => {
    const token = await fetchCsrfToken();
    csrfRef.current = token;
    return token;
  }, []);

  const refreshMe = useCallback(async () => {
    const data = await fetchMe();
    if (data.auth_disabled) {
      setAuthDisabled(true);
      setUser(null);
    } else if (data.authenticated && data.user) {
      setAuthDisabled(false);
      setUser(data.user);
    } else {
      setAuthDisabled(false);
      setUser(null);
    }
    return data;
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootstrapError(null);
    try {
      await refreshCsrf();
      await refreshMe();
    } catch (e) {
      setUser(null);
      setAuthDisabled(false);
      const msg =
        e?.code === "ECONNABORTED" || String(e?.message || "").includes("timeout")
          ? "Request timed out. Is the backend running on the port in frontend/.env.development (VITE_PROXY_TARGET)?"
          : e?.response
            ? `API returned ${e.response.status}. For the UI, use the Vite dev URL (npm run dev), not the Flask port in the browser.`
            : "Cannot reach the API. From backendNew run: python app.py (default port 5050 on macOS-friendly setup). Set VITE_PROXY_TARGET in frontend/.env.development to the same port and restart npm run dev.";
      setBootstrapError(msg);
    } finally {
      setLoading(false);
    }
  }, [refreshCsrf, refreshMe]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email, password) => {
      await refreshCsrf();
      await loginRequest({ email, password });
      await refreshCsrf();
      await refreshMe();
    },
    [refreshCsrf, refreshMe],
  );

  const signup = useCallback(
    async (email, password) => {
      await refreshCsrf();
      await signupRequest({ email, password });
      await refreshCsrf();
      await refreshMe();
    },
    [refreshCsrf, refreshMe],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    await refreshCsrf();
    await refreshMe();
  }, [refreshCsrf, refreshMe]);

  const value = useMemo(
    () => ({
      user,
      authDisabled,
      loading,
      bootstrapError,
      login,
      signup,
      logout,
      refreshMe,
      refreshCsrf,
    }),
    [user, authDisabled, loading, bootstrapError, login, signup, logout, refreshMe, refreshCsrf],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
