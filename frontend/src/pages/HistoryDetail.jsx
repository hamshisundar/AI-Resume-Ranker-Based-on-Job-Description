import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getRankingHistory } from "../api/client";
import RecruiterResults from "../components/RecruiterResults";

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

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRankingHistory(id);
        if (cancelled) return;
        const { history_meta, ...rest } = data;
        setMeta(history_meta || null);
        setPayload(rest);
      } catch (e) {
        if (!cancelled) {
          const st = e.response?.status;
          if (st === 403) {
            setError("You need to be signed in to open saved analyses.");
          } else if (st === 404) {
            setError("Not found.");
          } else {
            setError(e.response?.data?.error || e.message || "Could not load");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const candidateCount = payload?.candidates?.length ?? 0;
  const topScore =
    candidateCount > 0
      ? Math.max(...payload.candidates.map((c) => Number(c.score) || 0))
      : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/history")}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            All saved
          </button>
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-8">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" strokeWidth={1.75} />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="text-sm border border-red-200 bg-red-50 text-red-900 px-4 py-3 rounded-md">
            {error}
            <div className="mt-3">
              <Link to="/history" className="font-medium text-blue-700 hover:text-blue-900">
                Back to list
              </Link>
            </div>
          </div>
        ) : meta ? (
          <>
            <p className="text-xs text-gray-500 mb-2">
              <Link to="/" className="text-blue-600 hover:text-blue-800">
                Home
              </Link>
              <span className="mx-1.5 text-gray-300">/</span>
              <Link to="/history" className="text-blue-600 hover:text-blue-800">
                Saved
              </Link>
              <span className="mx-1.5 text-gray-300">/</span>
              <span className="text-gray-700 tabular-nums">#{meta.id}</span>
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight tabular-nums">Ranking #{meta.id}</h1>
            <p className="mt-2 text-sm text-gray-600 tabular-nums">
              {formatWhen(meta.created_at)}
              <span className="text-gray-400 mx-2">·</span>
              {meta.mode === "pdf" ? "PDF upload" : "Pasted text"}
              {topScore != null && (
                <>
                  <span className="text-gray-400 mx-2">·</span>
                  highest match {topScore}%
                </>
              )}
              {candidateCount > 0 && (
                <>
                  <span className="text-gray-400 mx-2">·</span>
                  {candidateCount} people
                </>
              )}
            </p>

            <section className="mt-8 border border-gray-200 border-l-4 border-l-blue-500 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-blue-50/50">
                <h2 className="text-xs font-medium text-blue-900 uppercase tracking-wide">Job description</h2>
              </div>
              <div className="px-4 py-4 max-h-[min(22rem,45vh)] overflow-y-auto">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{meta.jd_text || "—"}</p>
              </div>
            </section>

            <section className="mt-6 border border-gray-200 border-l-4 border-l-blue-500 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-blue-50/50">
                <h2 className="text-xs font-medium text-blue-900 uppercase tracking-wide">Results</h2>
              </div>
              <div className="p-4 sm:p-5">
                <RecruiterResults
                  candidates={payload?.candidates || []}
                  comparison={payload?.comparison}
                  fileErrors={payload?.file_errors || []}
                  explanations={payload?.explanations || []}
                  hidePageChrome
                />
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
