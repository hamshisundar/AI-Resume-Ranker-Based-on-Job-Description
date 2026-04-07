import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Mail, Lock, CheckCircle2, BarChart3 } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { PRODUCT_NAME, PRODUCT_SHORT } from "../lib/branding";

const FEATURES = [
  "AI-assisted resume scoring & ranking",
  "Skill and keyword alignment vs the job",
  "Structured shortlist you can export and revisit",
];

export default function Login() {
  const { user, login, signup, loading, bootstrapError } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100">
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900" aria-hidden />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-12 shadow-lg shadow-slate-900/5 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" aria-hidden />
            <p className="mt-4 text-sm font-medium text-slate-800">Checking session…</p>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Open this app from{" "}
              <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">npm run dev</span>
              , not the API port.
            </p>
          </div>
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
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        (mode === "login" ? "Sign in failed" : "Could not create account");
      setError(typeof msg === "string" ? msg : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const setAuthMode = (next) => {
    setMode(next);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100 text-slate-900">
      {/* Left — narrative (hidden on small screens, shown lg+) */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between px-12 xl:px-16 py-14 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{PRODUCT_SHORT}</p>
          <h1 className="mt-3 text-2xl xl:text-[1.75rem] font-semibold leading-snug tracking-tight text-white">
            {PRODUCT_NAME}
          </h1>
          <p className="mt-8 text-xl xl:text-2xl font-semibold leading-snug text-white/95">
            Great hiring starts with understanding people — not just resumes.
          </p>
          <p className="mt-5 text-sm text-slate-300 leading-relaxed">
            Surface real signals from CVs and job posts, rank candidates with your model, and keep every screening tied to a role—so decisions stay traceable.
          </p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" strokeWidth={2} aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 mt-12 max-w-lg">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your workspace</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">Private data</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shortlist</p>
            <p className="mt-1 text-lg font-semibold text-white">Ranked & exportable</p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hiring insight</p>
              <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                Compare top candidates side by side and reopen past runs when the panel asks “why them?”
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right — auth */}
      <section className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <header className="shrink-0 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-200/80 bg-white lg:hidden">
          <span className="text-sm font-semibold text-slate-900">{PRODUCT_SHORT}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Sign in</span>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 lg:py-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 lg:mb-8 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 lg:hidden">{PRODUCT_NAME}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 lg:hidden">Welcome</h2>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/[0.06]">
              <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-all ${
                    mode === "login"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-all ${
                    mode === "signup"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create account
                </button>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  {mode === "login"
                    ? "Sign in to continue to your hiring dashboard."
                    : "Register to save screenings, roles, and shortlists to your workspace."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {bootstrapError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                    {bootstrapError}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900" role="alert">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400"
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
                      className="w-full h-11 rounded-lg border border-slate-300 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    {mode === "login" && (
                      <span className="text-xs text-slate-400" title="Reset flows are managed by your deployment.">
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400"
                      aria-hidden
                    />
                    <input
                      id="password"
                      type="password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === "signup" ? 8 : 1}
                      placeholder="••••••••"
                      className="w-full h-11 rounded-lg border border-slate-300 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  {mode === "signup" && (
                    <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                      <span>{mode === "login" ? "Signing in…" : "Creating account…"}</span>
                    </>
                  ) : mode === "login" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                {mode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="font-semibold text-slate-900 hover:underline underline-offset-2"
                    >
                      Create account
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="font-semibold text-slate-900 hover:underline underline-offset-2"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed px-2">
              Sessions use secure tokens stored in your browser. Use HTTPS when exposing this app beyond localhost.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
