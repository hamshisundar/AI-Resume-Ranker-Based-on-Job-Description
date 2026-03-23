import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Mail, Lock, CheckCircle2, BarChart3 } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export default function Login() {
  const { user, authDisabled, login, signup, loading, bootstrapError } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && (authDisabled || user)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <Loader2
            className="h-7 w-7 animate-spin text-slate-700"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-700">Connecting to server…</p>
          <p className="text-xs text-slate-500 text-center max-w-xs">
            Open this app from the URL printed by{" "}
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">npm run dev</span>
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        (mode === "login" ? "Login failed" : "Signup failed");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200/50">
      <div className="min-h-screen grid lg:grid-cols-[55%_45%]">
        <section className="relative overflow-hidden bg-slate-900 text-slate-100 px-6 sm:px-10 lg:px-14 py-12 lg:py-16 flex items-center">
          <div className="absolute right-0 top-0 h-56 w-56 translate-x-16 -translate-y-16 rounded-full bg-slate-700/30" />
          <div className="absolute left-0 bottom-0 h-48 w-48 -translate-x-14 translate-y-14 rounded-full bg-slate-800/40" />

          <div className="relative max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
              Great hiring starts with understanding people — not just resumes.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              Discover real skills, identify the right candidates, and make confident hiring decisions with intelligent insights.
            </p>

            <ul className="mt-8 space-y-4 text-sm sm:text-base text-slate-200">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" aria-hidden />
                <span>AI Resume Scoring</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" aria-hidden />
                <span>Skill Gap Detection</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" aria-hidden />
                <span>Smart Candidate Ranking</span>
              </li>
            </ul>

            <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
              <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Resumes analyzed</p>
                <p className="mt-2 text-2xl font-semibold text-white">1,284</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Avg. match score</p>
                <p className="mt-2 text-2xl font-semibold text-white">86%</p>
              </div>
              <div className="col-span-2 rounded-lg border border-slate-700 bg-slate-800/70 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Hiring insight</p>
                  <p className="mt-2 text-sm text-slate-200">Top candidates found in under 2 minutes</p>
                </div>
                <BarChart3 className="h-5 w-5 text-cyan-300" aria-hidden />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-6 py-10 sm:py-14 flex items-center justify-center">
          <div
            className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            role="region"
            aria-labelledby="login-title"
          >
            <header className="mb-7">
              <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    mode === "login"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    mode === "signup"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Create account
                </button>
              </div>
              <h2 id="login-title" className="text-[1.75rem] font-semibold text-slate-900 tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {mode === "login"
                  ? "Sign in to continue to your hiring dashboard"
                  : "Set up your account to start ranking candidates"}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              {bootstrapError && (
                <div
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
                  role="status"
                >
                  {bootstrapError}
                </div>
              )}
              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full h-11 rounded-lg border border-slate-300 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/60 focus:border-slate-400 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-sm text-slate-600 hover:text-slate-900"
                      onClick={() => {}}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden
                  />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-11 rounded-lg border border-slate-300 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/60 focus:border-slate-400 transition-shadow"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
                  </>
                ) : (
                  mode === "login" ? "Sign in" : "Create account"
                )}
              </button>
            </form>

            <p className="mt-7 text-sm text-slate-500 text-center">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                }}
                className="text-slate-900 font-semibold hover:underline"
              >
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
