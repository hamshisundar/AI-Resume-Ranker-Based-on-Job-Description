function scoreToLabel(score) {
  const s = Number(score) || 0;
  if (s >= 80) return "Strong match";
  if (s >= 60) return "Good match";
  if (s >= 40) return "Worth review";
  return "Weak match";
}

/**
 * Maps FastAPI ranking payload into recruiter UI rows.
 * Supports enriched ML responses and legacy `candidates` payloads.
 */
export function normalizeRankingResponse(data) {
  if (!data) return null;

  if (Array.isArray(data.candidates) && data.candidates.length > 0) {
    return {
      jd_preview: data.jd_preview || "",
      candidates: data.candidates,
      comparison: data.comparison ?? null,
      explanations: data.explanations,
      file_errors: data.file_errors,
    };
  }

  const results = data.results || [];
  const jdPreview = data.jd_preview || "";

  const candidates = results.map((r, idx) => {
    const label = r.name || `Candidate ${r.candidate_id}`;
    const ex = Array.isArray(r.explanation) ? r.explanation : [];
    const rec =
      ex.filter(Boolean).join(" · ") ||
      "Ranked with the trained model — read the narrative below for context.";
    const exec = (r.executive_summary || "").trim() || rec;
    const kwTotal = Number(r.jd_keyword_total) || 0;
    const kwHits = Array.isArray(r.jd_keyword_hits) ? r.jd_keyword_hits : [];
    const kwPct =
      kwTotal > 0 ? Math.round((kwHits.length / kwTotal) * 100) : 0;

    const gapNotes = Array.isArray(r.gap_notes) ? r.gap_notes : [];
    const missing = Array.isArray(r.missing_skills) ? r.missing_skills : [];

    return {
      rank: idx + 1,
      resume_id: label,
      name: label,
      display_name: label,
      score: Math.round(Number(r.score) || 0),
      label: scoreToLabel(r.score),
      recommendation: rec,
      executive_summary: exec,
      explanation: exec,
      model_notes: ex,
      matched_skills: Array.isArray(r.matched_skills) ? r.matched_skills : [],
      missing_skills: missing,
      missing_skill_gaps: missing.map((s) => `JD asks for “${s}” (tracked list) — confirm in full CV text.`),
      extra_skills_in_cv: Array.isArray(r.extra_skills_in_cv) ? r.extra_skills_in_cv : [],
      extra_gap_phrases: gapNotes,
      experience_one_liner: r.experience_hint || null,
      education_display: r.education_hint || null,
      role_relevance: r.role_focus_line || null,
      lexical_overlap_100: Number(r.lexical_overlap_100) || 0,
      skills_coverage_100: Number(r.skills_coverage_100) || 0,
      jd_keyword_hits: kwHits,
      jd_keyword_total: kwTotal,
      jd_keyword_coverage_pct: kwPct,
      score_breakdown: r.score_breakdown && typeof r.score_breakdown === "object" ? r.score_breakdown : null,
    };
  });

  let comparison = null;
  if (candidates.length >= 2) {
    const a0 = candidates[0];
    const a1 = candidates[1];
    comparison = {
      summary: "Quick comparison of #1 vs #2 for this run only.",
      factors: [
        {
          factor: "Rank score",
          candidate_1: `${a0.score}`,
          candidate_2: `${a1.score}`,
        },
        {
          factor: "Text overlap with job ad",
          candidate_1: `${a0.lexical_overlap_100}%`,
          candidate_2: `${a1.lexical_overlap_100}%`,
        },
        {
          factor: "Listed skills vs job ad",
          candidate_1: `${a0.skills_coverage_100}%`,
          candidate_2: `${a1.skills_coverage_100}%`,
        },
        {
          factor: "Job ad wording in CV",
          candidate_1: `${a0.jd_keyword_coverage_pct}%`,
          candidate_2: `${a1.jd_keyword_coverage_pct}%`,
        },
      ],
    };
  }

  return {
    jd_preview: jdPreview,
    candidates,
    comparison,
    explanations: data.explanations,
    file_errors: data.file_errors,
  };
}
