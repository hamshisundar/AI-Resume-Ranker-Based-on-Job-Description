import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import ProductShell from "../components/ProductShell";
import { getJob, apiErrorMessage } from "../api/client";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getJob(id);
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) setError(apiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <ProductShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          All roles
        </Link>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        ) : job ? (
          <>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{job.title}</h1>
            <div className="mt-6 border border-slate-200 rounded-lg bg-white p-4 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Job description</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{job.jd_text}</p>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-8 mb-3">Screenings for this role</h2>
            <ul className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
              {(job.runs || []).map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/history/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 text-sm"
                  >
                    <span className="text-slate-700 tabular-nums">#{r.id}</span>
                    <span className="text-slate-500 text-xs">{r.mode === "pdf" ? "Files" : "Text"}</span>
                    <span className="text-slate-500 text-xs">{r.resume_count} CVs</span>
                    <span className="text-slate-600 text-xs">top {r.top_score}</span>
                    <span className="text-slate-400 text-xs ml-auto">{formatWhen(r.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </main>
    </ProductShell>
  );
}
