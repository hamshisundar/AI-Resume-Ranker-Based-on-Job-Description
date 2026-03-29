import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  FileText,
  Briefcase,
  GraduationCap,
  Target,
  ArrowRight,
} from "lucide-react";
import { cn } from "../lib/utils";

const SCORE_BREAKDOWN_ROWS = [
  ["skills", "Skills match"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["semantic_similarity", "Semantic overlap"],
  ["keyword_alignment", "Keywords & extras"],
];

const labelStyles = {
  "Excellent Fit": "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  "Good Fit": "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
  "Moderate Fit": "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
  "Weak Fit": "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80",
};

function FitBadge({ label }) {
  const cls = labelStyles[label] || "bg-gray-50 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold", cls)}>
      {label}
    </span>
  );
}

function MatchScoreBar({ score, compact }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  return (
    <div className={cn("w-full", compact ? "max-w-[140px]" : "max-w-xs")}>
      {!compact && (
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Match</span>
          <span className="text-lg font-bold text-gray-900 tabular-nums">{pct}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ Icon, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={2} />}
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, isBonus }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center gap-3 text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900 tabular-nums shrink-0">
          {isBonus && v > 0 ? "+" : ""}
          {v}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function parseGapLine(line) {
  const s = String(line);
  if (s.startsWith("Missing: ")) return { kind: "skill", text: s.slice("Missing: ".length) };
  return { kind: "note", text: s };
}

function CandidateCard({ c, expanded, onToggle, showMl, mlContributors }) {
  const hasMl = showMl && mlContributors?.length > 0;
  const titleName = c.display_name || c.name;
  const gapItems = [
    ...((c.missing_skill_gaps || []).length
      ? c.missing_skill_gaps
      : (c.missing_skills || []).map((s) => `Missing: ${s}`)),
    ...(c.extra_gap_phrases || []),
  ];

  const expText = c.experience_one_liner || c.experience_match?.summary;
  const eduText = c.education_display || c.education_match;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/90 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-900 text-white flex flex-col items-center justify-center leading-none">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/70">Rank</span>
            <span className="text-lg font-bold">{c.rank}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <h3 className="font-semibold text-gray-900 truncate text-base" title={c.name}>
                {titleName}
              </h3>
              <FitBadge label={c.label} />
            </div>
            {c.name !== titleName && (
              <p className="text-xs text-gray-400 truncate mt-0.5 font-mono" title={c.name}>
                {c.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{c.recommendation}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 flex-shrink-0 sm:pl-4 sm:border-l sm:border-gray-100">
          <MatchScoreBar score={c.score} compact />
          <span className="text-gray-400 p-1" aria-hidden>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-[#fafbfc] px-4 sm:px-5 pb-6 pt-5 space-y-6">
          {/* Spec strip */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-gray-200/80">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Candidate</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">{titleName}</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-blue-700 tabular-nums">{c.score}%</span>
                <span className="text-gray-400 mx-2">·</span>
                {c.label}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 lg:gap-8">
              <MatchScoreBar score={c.score} />
              <div className="rounded-lg bg-white border border-gray-200 px-4 py-2.5 shadow-sm max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Next step</p>
                <p className="text-sm font-medium text-gray-900 mt-1 flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  {c.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Two-column: strengths vs gaps */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-sm">
              <SectionHeader
                Icon={CheckCircle2}
                title="Strengths & alignment"
                subtitle="Against the job description"
              />
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 mb-1.5">Skills</dt>
                  <dd>
                    {(c.matched_skills || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {c.matched_skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-100/80"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs leading-relaxed">
                        No hits on the standard skill list — scan the resume for JD terms.
                      </span>
                    )}
                  </dd>
                </div>
                <div className="grid sm:grid-cols-1 gap-3 pt-1 border-t border-gray-100">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      Experience
                    </dt>
                    <dd className="text-gray-800 leading-snug">{expText}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                      <Target className="w-3.5 h-3.5" />
                      Role focus
                    </dt>
                    <dd className="text-gray-800 leading-snug">{c.role_relevance}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Education
                    </dt>
                    <dd className="text-gray-800 leading-snug">{eduText}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-sm">
              <SectionHeader
                Icon={XCircle}
                title="Gaps to verify"
                subtitle="Before moving forward"
              />
              {gapItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {gapItems.map((line, i) => {
                      const p = parseGapLine(line);
                      if (p.kind === "skill") {
                        return (
                          <span
                            key={i}
                            className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-900 border border-rose-100/80"
                          >
                            {p.text}
                          </span>
                        );
                      }
                      return (
                        <p key={i} className="text-xs text-gray-600 w-full leading-relaxed border-l-2 border-amber-200 pl-2.5">
                          {p.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nothing major flagged — still spot-check against the JD.</p>
              )}
            </div>
          </div>

          {c.score_breakdown && (
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-sm">
              <SectionHeader Icon={BarChart3} title="Score composition" subtitle="How this match score is distributed" />
              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                {SCORE_BREAKDOWN_ROWS.map(([key, label]) => {
                  const v = c.score_breakdown[key];
                  if (v == null) return null;
                  return (
                    <BreakdownRow
                      key={key}
                      label={label}
                      value={v}
                      isBonus={key === "keyword_alignment"}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-sm">
            <SectionHeader Icon={FileText} title="Screening summary" subtitle="For the hiring record" />
            <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">{c.explanation}</p>
          </div>

          {hasMl && (
            <details className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3 text-xs">
              <summary className="font-medium text-gray-600 cursor-pointer select-none">
                Technical model details
              </summary>
              <ul className="mt-2 font-mono text-gray-500 space-y-0.5 pl-1">
                {mlContributors.map((x, i) => (
                  <li key={i}>
                    {x.feature}:{" "}
                    {typeof x.contribution === "number" ? x.contribution.toFixed(4) : x.contribution}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecruiterResults({
  candidates = [],
  comparison = null,
  fileErrors = [],
  explanations = [],
  hidePageChrome = false,
}) {
  const [expanded, setExpanded] = useState(() => new Set());

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
    const header =
      "Rank,Name,Match Score,Fit Label,Recommendation,Matched Skills,Missing Skills\n";
    const rows = candidates
      .map((c) => {
        const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
        return [
          c.rank,
          esc(c.display_name || c.name),
          c.score,
          esc(c.label),
          esc(c.recommendation),
          esc((c.matched_skills || []).join("; ")),
          esc((c.missing_skills || []).join("; ")),
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hiring_rankings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!candidates.length) {
    if (fileErrors?.length > 0) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-2 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" /> Issues
          </h3>
          <ul className="text-sm text-red-700 space-y-1 list-inside list-disc">
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
    <div className={cn("space-y-6", !hidePageChrome && "mt-8")}>
      {!hidePageChrome ? (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Shortlist overview</h2>
            <p className="text-sm text-gray-500 mt-1">Ranked for this job · expand a row for full detail</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      )}

      {fileErrors?.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-sm text-amber-950">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /> Some files were skipped
          </h3>
          <ul className="list-disc list-inside space-y-1 text-amber-900/90">
            {fileErrors.map((err, idx) => (
              <li key={idx}>
                {typeof err === "string" ? err : `${err.file}: ${err.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {comparison?.factors && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Top two compared</h3>
          <p className="text-xs text-gray-500 mb-4">{comparison.summary}</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Factor</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-900">#1</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">#2</th>
                </tr>
              </thead>
              <tbody>
                {comparison.factors.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap">{row.factor}</td>
                    <td className="px-4 py-2.5 text-gray-900">{row.candidate_1}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.candidate_2}</td>
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
            key={c.resume_id}
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
