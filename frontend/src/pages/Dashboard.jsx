import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ToastContainer } from "../components/Toast";
import ProductShell from "../components/ProductShell";
import ModeToggle from "../features/ranking/ModeToggle";
import PdfRankForm from "../features/ranking/PdfRankForm";
import TextRankForm from "../features/ranking/TextRankForm";
import RecruiterResults from "../features/ranking/RecruiterResults";
import { Loader2 } from "lucide-react";
import { listRankingHistory } from "../api/client";
import { normalizeRankingResponse } from "../lib/normalizeRankingResponse";

export default function Dashboard() {
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
    try {
      const data = await listRankingHistory();
      setHistoryCount((data.sessions || []).length);
    } catch {
      setHistoryCount(null);
    }
  }, []);

  useEffect(() => {
    refreshHistoryCount();
  }, [refreshHistoryCount]);

  const handleResults = (data) => {
    setResultsData(normalizeRankingResponse(data));
    addToast(
      data.history_id ? "Screening saved to your account." : "Ranking complete.",
      "success",
    );
    if (data.history_id) {
      refreshHistoryCount();
    }
  };

  const handleError = (message) => {
    addToast(message, "error");
  };

  return (
    <ProductShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-10">
          <div className="w-full md:w-1/3 lg:w-[260px] shrink-0 space-y-4 md:sticky md:top-24">
            <Link
              to="/history"
              className="block border border-slate-200 border-l-[3px] border-l-slate-800 bg-white pl-4 pr-3 py-3 rounded-lg shadow-sm shadow-slate-900/5 hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-medium text-slate-900">Past screenings</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Every run you save is listed here.
              </p>
              <p className="text-xs text-slate-700 mt-2 tabular-nums font-medium">
                {historyCount != null
                  ? historyCount === 0
                    ? "None yet"
                    : `${historyCount} saved`
                  : "…"}
              </p>
            </Link>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm shadow-slate-900/5">
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Input</h2>
              <ModeToggle
                mode={mode}
                setMode={(m) => {
                  setMode(m);
                  setResultsData(null);
                }}
              />
            </div>

            <div
              className={
                mode === "upload"
                  ? "rounded-lg border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs text-sky-950 leading-relaxed"
                  : "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 leading-relaxed"
              }
            >
              {mode === "upload"
                ? "Upload multiple resumes to rank them against a job description."
                : "Paste plain-text resumes when you do not have PDF or Word files."}
            </div>
          </div>

          <div className="w-full md:flex-1 min-w-0 space-y-8">
            <section>
              <h1 className="text-lg font-semibold text-slate-900 mb-1 tracking-tight">Rank resumes</h1>
              <p className="text-sm text-slate-500 mb-4">
                {mode === "upload"
                  ? "Add a job description and upload candidate files."
                  : "Add a job description and paste candidate text."}
              </p>

              {mode === "upload" ? (
                <PdfRankForm onResults={handleResults} onError={handleError} setLoading={setLoading} />
              ) : (
                <TextRankForm onResults={handleResults} onError={handleError} setLoading={setLoading} />
              )}
            </section>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm">Working…</p>
              </div>
            )}

            {!loading && resultsData && (
              <section>
                <RecruiterResults
                  jdPreview={resultsData.jd_preview}
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
    </ProductShell>
  );
}
