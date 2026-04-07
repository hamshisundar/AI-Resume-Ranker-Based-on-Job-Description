import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProductShell from "../components/ProductShell";
import { listJobs, apiErrorMessage } from "../api/client";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listJobs();
        if (!cancelled) setJobs(data.jobs || []);
      } catch (e) {
        if (!cancelled) setError(apiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProductShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Roles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Job postings you have screened at least once. Open a role to see past runs.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        ) : jobs.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-lg bg-white px-5 py-10 text-center">
            <p className="text-sm text-slate-700 font-medium">No roles yet</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Run a screening from Screen — each distinct job description becomes a role here.
            </p>
            <Link
              to="/"
              className="inline-block mt-5 text-sm font-medium text-slate-800 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-600"
            >
              Start a screening
            </Link>
          </div>
        ) : (
          <ul className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  to={`/jobs/${j.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{j.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{j.jd_preview || "—"}</p>
                  </div>
                  <div className="shrink-0 flex sm:flex-col gap-3 sm:gap-0.5 text-xs text-slate-500 tabular-nums sm:text-right">
                    <span>{j.run_count} screening{j.run_count === 1 ? "" : "s"}</span>
                    <span className="text-slate-400">{formatWhen(j.last_screened_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </ProductShell>
  );
}
