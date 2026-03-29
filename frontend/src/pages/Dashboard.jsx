import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "../components/Toast";
import BackendStatus from "../components/BackendStatus";
import ModeToggle from "../components/ModeToggle";
import PdfRankForm from "../components/PdfRankForm";
import TextRankForm from "../components/TextRankForm";
import RecruiterResults from "../components/RecruiterResults";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { listRankingHistory } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, authDisabled, logout } = useAuth();
  const [mode, setMode] = useState("upload");
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [historyCount, setHistoryCount] = useState(null);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshHistoryCount = useCallback(async () => {
    if (authDisabled || !user) {
      setHistoryCount(null);
      return;
    }
    try {
      const data = await listRankingHistory();
      if (data.history_disabled) {
        setHistoryCount(null);
        return;
      }
      setHistoryCount((data.sessions || []).length);
    } catch {
      setHistoryCount(null);
    }
  }, [authDisabled, user]);

  useEffect(() => {
    refreshHistoryCount();
  }, [refreshHistoryCount]);

  const handleResults = (data) => {
    setResultsData(data);
    addToast(
      data.history_id ? "Ranked successfully — saved to your archive." : "Resumes ranked successfully!",
      "success",
    );
    if (data.history_id) {
      refreshHistoryCount();
    }
  };

  const handleError = (message) => {
    addToast(message, "error");
  };

  const handleLogout = async () => {
    try {
      await logout();
      addToast("Signed out", "info");
    } catch {
      addToast("Could not sign out", "error");
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3.25rem] flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 tracking-tight truncate">CV ranker</h1>
            {user && (
              <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[200px] tabular-nums" title={user.email}>
                {user.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            <BackendStatus />
            <Link
              to="/history"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-600 pb-0.5 -mb-0.5 transition-colors tabular-nums"
            >
              Saved
              {historyCount != null && historyCount > 0 && (
                <span className="text-blue-500 font-normal"> ({historyCount > 99 ? "99+" : historyCount})</span>
              )}
            </Link>
            {!authDisabled && user && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-10">
          <div className="w-full md:w-1/3 lg:w-[260px] shrink-0 space-y-5 sticky top-20">
            {!authDisabled && user && (
              <Link
                to="/history"
                className="block border border-gray-200 border-l-[3px] border-l-blue-600 bg-white pl-4 pr-3 py-3 rounded-r-md shadow-sm hover:bg-blue-50/40 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Saved rankings</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Open past job posts and shortlists.
                </p>
                <p className="text-xs text-blue-700 mt-2 tabular-nums font-medium">
                  {historyCount != null
                    ? historyCount === 0
                      ? "None yet"
                      : `${historyCount} on file`
                    : "…"}
                </p>
              </Link>
            )}

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">How to input</h2>
              <ModeToggle
                mode={mode}
                setMode={(m) => {
                  setMode(m);
                  setResultsData(null);
                }}
              />
            </div>

            <p className="text-xs text-gray-500 leading-relaxed px-0.5">
              {mode === "upload"
                ? "Paste or upload a JD PDF, then add resumes as PDF, DOCX, or DOC."
                : "Paste plain text resumes if you do not have files handy."}
            </p>

            {!authDisabled && !user && (
              <div className="text-sm border border-gray-200 bg-white rounded-md p-4 shadow-sm">
                <p className="font-medium text-gray-900">Log in to save</p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">Your last runs stay in a list on this machine.</p>
                <Link to="/login" className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                  Log in
                </Link>
              </div>
            )}
          </div>

          <div className="w-full md:flex-1 min-w-0 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">
                {mode === "upload" ? "Rank resume files" : "Rank from text"}
              </h2>

              {mode === "upload" ? (
                <PdfRankForm onResults={handleResults} onError={handleError} setLoading={setLoading} />
              ) : (
                <TextRankForm onResults={handleResults} onError={handleError} setLoading={setLoading} />
              )}
            </section>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm">Working…</p>
              </div>
            )}

            {!loading && resultsData && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <RecruiterResults
                  candidates={resultsData.candidates}
                  comparison={resultsData.comparison}
                  explanations={resultsData.explanations}
                  fileErrors={resultsData.file_errors}
                />
              </section>
            )}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
