import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { listRankingHistory, deleteRankingHistory, fetchCsrfToken } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { ToastContainer } from "../components/Toast";
import { cn } from "../lib/utils";

function formatWhen(iso) {
  try {
    const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso) {
  try {
    const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (864e5));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return formatWhen(iso);
  } catch {
    return formatWhen(iso);
  }
}

export default function History() {
  const navigate = useNavigate();
  const { user, authDisabled } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [historyDisabled, setHistoryDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRankingHistory();
      setSessions(data.sessions || []);
      setHistoryDisabled(!!data.history_disabled);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summaryLine = useMemo(() => {
    if (!sessions.length) return null;
    const pdf = sessions.filter((s) => s.mode === "pdf").length;
    const text = sessions.length - pdf;
    const avgTop = Math.round(
      sessions.reduce((a, s) => a + (Number(s.top_score) || 0), 0) / sessions.length,
    );
    return `${sessions.length} saved · ${pdf} PDF · ${text} text · avg top score ${avgTop}%`;
  }, [sessions]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this saved ranking?")) return;
    try {
      await fetchCsrfToken();
      await deleteRankingHistory(id);
      addToast("Deleted", "success");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      addToast(err.response?.data?.error || "Delete failed", "error");
    }
  };

  const showDisabledBanner = authDisabled || historyDisabled;
  const showSignInBanner = !authDisabled && !user;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            Back
          </button>
          {user && (
            <span className="text-xs text-gray-500 truncate max-w-[min(200px,45vw)] tabular-nums">{user.email}</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-[1.65rem] font-semibold text-gray-900 tracking-tight">Saved rankings</h1>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-lg">
              Signed-in runs are kept here so you can reopen the job text and shortlist without uploading again.
            </p>
            {!loading && summaryLine && (
              <p className="mt-3 text-xs text-gray-500 tabular-nums">{summaryLine}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} strokeWidth={1.75} />
            Refresh
          </button>
        </div>

        {showDisabledBanner && (
          <div className="mb-6 text-sm border border-amber-200 bg-amber-50/80 text-amber-950 px-4 py-3 rounded-md">
            <p className="font-medium">Saving is off</p>
            <p className="mt-1 text-amber-900/90 leading-relaxed">
              Enable authentication and sign in to store rankings here.
            </p>
          </div>
        )}

        {showSignInBanner && (
          <div className="mb-6 text-sm border border-gray-200 bg-white px-4 py-3 rounded-md">
            <p className="font-medium text-gray-900">Sign in first</p>
            <p className="mt-1 text-gray-600">Saved lists are tied to your account.</p>
            <Link to="/login" className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
              Log in
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 text-sm border border-red-200 bg-red-50 text-red-900 px-4 py-3 rounded-md">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-16 text-gray-500">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" strokeWidth={1.75} />
            <span className="text-sm">Loading…</span>
          </div>
        ) : sessions.length === 0 && !showDisabledBanner ? (
          <div className="border border-dashed border-blue-200 rounded-lg bg-white/60 px-6 py-12 text-center">
            <p className="text-gray-800 font-medium">Nothing saved yet</p>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Run a ranking from the home page while logged in. It will show up in this list.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Go to dashboard
            </Link>
          </div>
        ) : sessions.length > 0 ? (
          <ul className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 overflow-hidden shadow-sm">
            {sessions.map((s) => (
              <li key={s.id} className="group">
                <div className="flex items-stretch min-h-[4.5rem]">
                  <Link
                    to={`/history/${s.id}`}
                    className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 hover:bg-blue-50/70 transition-colors min-w-0 text-left"
                  >
                    <div className="shrink-0 w-28">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">#{s.id}</span>
                      <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                        <span className="text-gray-600">{formatRelative(s.created_at)}</span>
                        <span className="hidden sm:block text-gray-400 mt-0.5">{formatWhen(s.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                        {s.mode === "pdf" ? "PDF" : "Text"}
                      </span>
                      <p className="text-sm text-gray-800 leading-snug line-clamp-2 mt-0.5">{s.jd_preview || "—"}</p>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs text-gray-500 tabular-nums">
                      <span>{s.resume_count} CVs</span>
                      <span className="text-gray-700">top {s.top_score}%</span>
                      <span className="text-blue-600 font-medium text-sm sm:hidden">Open →</span>
                      <span className="text-blue-600 font-medium text-sm hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                        View →
                      </span>
                    </div>
                  </Link>
                  {!authDisabled && user && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, s.id)}
                      className="px-3 border-l border-gray-100 text-gray-400 hover:text-red-700 hover:bg-red-50/50 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-center text-xs text-gray-400 mt-10">Stored locally in your project database.</p>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
