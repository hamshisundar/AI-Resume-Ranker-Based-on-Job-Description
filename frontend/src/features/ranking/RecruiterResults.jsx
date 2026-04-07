import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Download, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

const BREAKDOWN_LABELS = [
  ["semantic_similarity", "Text overlap"],
  ["skills", "Skills vs job ad"],
  ["keyword_alignment", "Job ad wording"],
];

const labelStyles = {
  "Strong match": "border-emerald-300 bg-emerald-50 text-emerald-950",
  "Good match": "border-slate-200 bg-slate-50 text-slate-800",
  "Worth review": "border-amber-300 bg-amber-50 text-amber-950",
  "Weak match": "border-slate-200 bg-white text-slate-600",
  "Excellent Fit": "border-emerald-300 bg-emerald-50 text-emerald-950",
  "Good Fit": "border-slate-200 bg-slate-50 text-slate-800",
  "Moderate Fit": "border-amber-300 bg-amber-50 text-amber-950",
  "Weak Fit": "border-slate-200 bg-white text-slate-600",
};

/** One line for collapsed row — avoids repeating the long executive paragraph. */
function collapsedPreview(c) {
  const notes = (c.model_notes || []).filter(Boolean);
  if (notes.length) return notes.join(" · ");
  const r = (c.recommendation || "").trim();
  if (r.length <= 140) return r || "Open for details.";
  return `${r.slice(0, 137)}…`;
}

/** Short bullet list for expanded view (no duplicate wall of text). */
function quickBullets(c) {
  const notes = (c.model_notes || []).filter(Boolean);
  if (notes.length) return notes;
  const exec = (c.executive_summary || "").trim();
  if (!exec) return [];
  const chunks = exec
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  return chunks.slice(0, 3);
}

function FitBadge({ label }) {
  const cls = labelStyles[label] || "border-slate-200 bg-white text-slate-700";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-sm border text-[11px] font-medium", cls)}>
      {label}
    </span>
  );
}

function MetricCompact({ label, value }) {
  return (
    <div className="text-center sm:text-left rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}%</p>
    </div>
  );
}

function BreakdownRow({ label, value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900 tabular-nums shrink-0">{v}%</span>
      </div>
      <div className="h-1 rounded-sm bg-slate-200/70 overflow-hidden">
        <div className="h-full rounded-sm bg-blue-600" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Chip({ children, tone = "neutral" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50/80 text-slate-900"
      : "border-slate-200 bg-white text-slate-700";
  return <span className={cn("inline-flex px-2 py-0.5 rounded-sm border text-xs", cls)}>{children}</span>;
}

function CandidateCard({ c, expanded, onToggle, showMl, mlContributors }) {
  const hasMl = showMl && mlContributors?.length > 0;
  const titleName = c.display_name || c.name;
  const bd = c.score_breakdown || {};

  const gapItems = [
    ...((c.missing_skill_gaps || []).length ? c.missing_skill_gaps : []),
    ...((c.extra_gap_phrases || []).length ? c.extra_gap_phrases : []),
  ];

  const expText = c.experience_one_liner || c.experience_match?.summary;
  const eduText = c.education_display || c.education_match;
  const hasExtras = expText || eduText || c.role_relevance || (c.extra_skills_in_cv || []).length > 0;

  const bullets = quickBullets(c);

  return (
    <article className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-9 h-9 rounded-md border border-slate-200 bg-slate-50 text-slate-900 flex items-center justify-center text-sm font-semibold tabular-nums">
            {c.rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate text-[15px]" title={c.name}>
                {titleName}
              </h3>
              <FitBadge label={c.label} />
            </div>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-snug">{collapsedPreview(c)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 sm:pl-3 sm:border-l sm:border-slate-200">
          <div className="text-right">
            <p className="text-xs text-slate-500">Score</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900 leading-tight">{c.score}</p>
          </div>
          <span className="text-slate-400" aria-hidden>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <MetricCompact label="Text overlap" value={c.lexical_overlap_100 ?? 0} />
            <MetricCompact label="Skills" value={c.skills_coverage_100 ?? 0} />
            <MetricCompact label="Job wording" value={c.jd_keyword_coverage_pct ?? 0} />
          </div>

          {bullets.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick read</p>
              <ul className="text-sm text-slate-800 space-y-1.5 list-disc list-inside leading-relaxed">
                {bullets.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border border-slate-200 bg-white p-3 space-y-3">
            {(c.matched_skills || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5">Skills also in the job ad</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.matched_skills.map((s) => (
                    <Chip key={s} tone="ok">
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {(c.jd_keyword_hits || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5">Words from the job ad found in this CV</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.jd_keyword_hits.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
            )}
            {(c.matched_skills || []).length === 0 && (c.jd_keyword_hits || []).length === 0 && (
              <p className="text-sm text-slate-500">No automatic skill or word matches — review the CV manually.</p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Before you shortlist</p>
            {gapItems.length > 0 ? (
              <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                {gapItems.map((line, i) => (
                  <li key={i}>{typeof line === "string" ? line : line?.text || String(line)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nothing obvious flagged — still read the full CV.</p>
            )}
            {(c.extra_skills_in_cv || []).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1.5">Also on CV (not in our short skill list)</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.extra_skills_in_cv.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasExtras && (
            <div className="rounded-md border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-600 space-y-2">
              {expText && (
                <p>
                  <span className="font-medium text-slate-700">Experience: </span>
                  {expText}
                </p>
              )}
              {eduText && (
                <p>
                  <span className="font-medium text-slate-700">Education: </span>
                  {eduText}
                </p>
              )}
              {c.role_relevance && (
                <p>
                  <span className="font-medium text-slate-700">Focus: </span>
                  {c.role_relevance}
                </p>
              )}
            </div>
          )}

          {(bd && Object.keys(bd).length > 0) || hasMl ? (
            <details className="rounded-md border border-slate-200 bg-white text-sm">
              <summary className="cursor-pointer select-none px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
                More detail (how the score breaks down)
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-3">
                {bd && Object.keys(bd).length > 0 && (
                  <div className="grid gap-3">
                    {BREAKDOWN_LABELS.map(([key, label]) => {
                      const v = bd[key];
                      if (v == null) return null;
                      return <BreakdownRow key={key} label={label} value={v} />;
                    })}
                  </div>
                )}
                {hasMl && (
                  <ul className="font-mono text-xs text-slate-500 space-y-0.5">
                    {mlContributors.map((x, i) => (
                      <li key={i}>
                        {x.feature}: {typeof x.contribution === "number" ? x.contribution.toFixed(4) : x.contribution}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default function RecruiterResults({
  candidates = [],
  comparison = null,
  fileErrors = [],
  explanations = [],
  hidePageChrome = false,
  jdPreview = "",
}) {
  const [expanded, setExpanded] = useState(() => {
    const first = candidates[0]?.resume_id;
    return first != null ? new Set([first]) : new Set();
  });

  useEffect(() => {
    const first = candidates[0]?.resume_id;
    if (first != null) setExpanded(new Set([first]));
  }, [candidates.length, candidates[0]?.resume_id]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mlMap = {};
  (explanations || []).forEach((e) => {
    mlMap[e.resume_id] = e.top_contributors || [];
  });

  const handleDownload = () => {
    if (!candidates.length) return;
    const header = "Rank,Name,Score,Label,Summary,Matched skills,Notes\n";
    const rows = candidates
      .map((c) => {
        const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
        const gaps = [...(c.missing_skills || []), ...(c.extra_gap_phrases || [])].join("; ");
        return [
          c.rank,
          esc(c.display_name || c.name),
          c.score,
          esc(c.label),
          esc(c.executive_summary || c.recommendation),
          esc((c.matched_skills || []).join("; ")),
          esc(gaps),
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shortlist_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!candidates.length) {
    if (fileErrors?.length > 0) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-2 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" /> Issues
          </h3>
          <ul className="text-sm text-red-800 space-y-1 list-inside list-disc">
            {fileErrors.map((err, idx) => (
              <li key={idx}>
                {typeof err === "string" ? err : `${err.file || "file"}: ${err.error || err.message || "error"}`}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn("space-y-5", !hidePageChrome && "mt-6")}>
      {!hidePageChrome ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Shortlist</h2>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 shadow-sm shadow-slate-900/10"
          >
            <Download className="w-4 h-4 mr-2 opacity-70" aria-hidden />
            Export CSV
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      )}

      {jdPreview?.trim() && (
        <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm group">
          <summary className="font-medium text-slate-800 cursor-pointer select-none list-none flex justify-between gap-2">
            <span>Job posting (excerpt)</span>
            <span className="text-slate-400 font-normal text-xs group-open:hidden">Show</span>
            <span className="text-slate-400 font-normal text-xs hidden group-open:inline">Hide</span>
          </summary>
          <p className="mt-2 pt-2 border-t border-slate-100 text-slate-600 whitespace-pre-wrap leading-relaxed">{jdPreview}</p>
        </details>
      )}

      {fileErrors?.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-950">
          <p className="font-medium flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Some files were skipped
          </p>
          <ul className="list-disc list-inside text-amber-900/90">
            {fileErrors.map((err, idx) => (
              <li key={idx}>{typeof err === "string" ? err : `${err.file}: ${err.error}`}</li>
            ))}
          </ul>
        </div>
      )}

      {comparison?.factors && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">#1 vs #2</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-3">{comparison.summary}</p>
          <div className="overflow-x-auto rounded-md border border-slate-200 text-sm">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-3 py-2 font-medium text-slate-600"> </th>
                  <th className="px-3 py-2 font-medium text-slate-900">#1</th>
                  <th className="px-3 py-2 font-medium text-slate-600">#2</th>
                </tr>
              </thead>
              <tbody>
                {comparison.factors.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{row.factor}</td>
                    <td className="px-3 py-2 text-slate-900">{row.candidate_1}</td>
                    <td className="px-3 py-2 text-slate-600">{row.candidate_2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((c) => (
          <CandidateCard
            key={`${c.rank}-${c.resume_id}`}
            c={c}
            expanded={expanded.has(c.resume_id)}
            onToggle={() => toggle(c.resume_id)}
            showMl={!!explanations?.length}
            mlContributors={mlMap[c.resume_id]}
          />
        ))}
      </div>
    </div>
  );
}
