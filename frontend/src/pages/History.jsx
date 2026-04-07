import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { listRankingHistory, deleteRankingHistory, apiErrorMessage } from "../api/client";
import { ToastContainer } from "../components/Toast";
import ProductShell from "../components/ProductShell";

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
    const days = Math.floor(diff / 864e5);
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
  const [sessions, setSessions] = useState([]);
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
    } catch (e) {
      setError(apiErrorMessage(e));
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
    return `${sessions.length} screenings · ${pdf} file upload · ${text} text · avg top score ${avgTop}`;
  }, [sessions]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this screening?")) return;
    try {
      await deleteRankingHistory(id);
      addToast("Deleted", "success");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      addToast(apiErrorMessage(err) || "Delete failed", "error");
    }
  };

  return (
    <ProductShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Screenings</h1>
            {summaryLine && <p className="text-sm text-slate-500 mt-1">{summaryLine}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-800 hover:text-slate-950"
            >
              New screening
            </button>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-12">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        ) : sessions.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-lg bg-white px-6 py-12 text-center">
            <p className="text-slate-800 font-medium text-sm">Nothing here yet</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Complete a screening from Screen while signed in; it will show up in this list.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 text-sm font-medium text-slate-800 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-600"
            >
              Go to Screen
            </Link>
          </div>
        ) : (
          <ul className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="group">
                <div className="flex items-stretch min-h-[4rem]">
                  <Link
                    to={`/history/${s.id}`}
                    className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 hover:bg-slate-50 transition-colors min-w-0 text-left"
                  >
                    <div className="shrink-0 w-24">
                      <span className="text-sm font-medium text-slate-900 tabular-nums">#{s.id}</span>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        <span className="text-slate-600">{formatRelative(s.created_at)}</span>
                        <span className="hidden sm:block text-slate-400 mt-0.5">{formatWhen(s.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                        {s.mode === "pdf" ? "Files" : "Text"}
                      </span>
                      <p className="text-sm text-slate-800 leading-snug line-clamp-2 mt-0.5">
                        {s.jd_preview || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0.5 text-xs text-slate-500 tabular-nums">
                      <span>{s.resume_count} CVs</span>
                      <span className="text-slate-700">top {s.top_score}</span>
                      {s.job_id && (
                        <Link
                          to={`/jobs/${s.job_id}`}
                          className="text-slate-600 hover:text-slate-900 hidden sm:inline text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Role →
                        </Link>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, s.id)}
                    className="px-3 border-l border-slate-100 text-slate-400 hover:text-red-700 hover:bg-red-50/40 flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-xs text-slate-400 mt-10">Stored in your workspace database.</p>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ProductShell>
  );
}
