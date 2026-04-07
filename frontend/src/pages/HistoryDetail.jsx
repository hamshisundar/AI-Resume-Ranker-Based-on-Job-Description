import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { getRankingHistory, apiErrorMessage } from "../api/client";
import RecruiterResults from "../features/ranking/RecruiterResults";
import ProductShell from "../components/ProductShell";
import { normalizeRankingResponse } from "../lib/normalizeRankingResponse";

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
        const normalized = normalizeRankingResponse({
          results: rest.results,
          jd_preview: rest.jd_preview || (history_meta?.jd_text || "").slice(0, 560),
          file_errors: rest.file_errors || [],
        });
        setPayload(normalized);
      } catch (e) {
        if (!cancelled) {
          const st = e.response?.status;
          if (st === 403) {
            setError("Sign in to open this screening.");
          } else if (st === 404) {
            setError("Not found.");
          } else {
            setError(apiErrorMessage(e));
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

  const runLabel = meta?.id ?? id;

  return (
    <ProductShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          All screenings
        </button>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-8">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" strokeWidth={1.75} />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="text-sm border border-red-200 bg-red-50 text-red-900 px-4 py-3 rounded-md">
            {error}
            <div className="mt-3">
              <Link to="/history" className="font-medium text-slate-800 underline underline-offset-2">
                Back to list
              </Link>
            </div>
          </div>
        ) : meta ? (
          <>
            <p className="text-xs text-slate-500 mb-2">
              <Link to="/" className="text-slate-700 hover:text-slate-900">
                Screen
              </Link>
              <span className="mx-1.5 text-slate-300">/</span>
              <Link to="/history" className="text-slate-700 hover:text-slate-900">
                Screenings
              </Link>
              <span className="mx-1.5 text-slate-300">/</span>
              <span className="text-slate-600 tabular-nums">#{runLabel}</span>
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">
              Screening #{runLabel}
            </h1>
            <p className="mt-2 text-sm text-slate-600 tabular-nums">
              {formatWhen(meta.created_at)}
              <span className="text-slate-300 mx-2">·</span>
              {meta.mode === "pdf" ? "File upload" : "Pasted text"}
              {topScore != null && (
                <>
                  <span className="text-slate-300 mx-2">·</span>
                  top score {topScore}
                </>
              )}
              {candidateCount > 0 && (
                <>
                  <span className="text-slate-300 mx-2">·</span>
                  {candidateCount} candidates
                </>
              )}
            </p>
            {meta.job_id && (
              <p className="mt-2 text-sm">
                <Link to={`/jobs/${meta.job_id}`} className="text-slate-700 hover:text-slate-900 underline underline-offset-2">
                  View role & all runs
                </Link>
              </p>
            )}

            <section className="mt-8 border border-slate-200 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xs font-medium text-slate-600 uppercase tracking-wide">Job description</h2>
              </div>
              <div className="px-4 py-4 max-h-[min(22rem,45vh)] overflow-y-auto">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{meta.jd_text || "—"}</p>
              </div>
            </section>

            <section className="mt-6 border border-slate-200 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xs font-medium text-slate-600 uppercase tracking-wide">Results</h2>
              </div>
              <div className="p-4 sm:p-5">
                <RecruiterResults
                  jdPreview={payload?.jd_preview || meta?.jd_text || ""}
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
    </ProductShell>
  );
}
