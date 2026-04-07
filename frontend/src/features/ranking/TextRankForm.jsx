import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { rankText, apiErrorMessage } from "../../api/client";

const TextRankForm = ({ onResults, onError, setLoading }) => {
  const [jdText, setJdText] = useState("");
  const [resumes, setResumes] = useState([{ id: "Resume 1", text: "" }]);
  const [topK, setTopK] = useState(10);
  const [explain, setExplain] = useState(true);

  const addResume = () => {
    setResumes([...resumes, { id: `Resume ${resumes.length + 1}`, text: "" }]);
  };

  const removeResume = (index) => {
    if (resumes.length > 1) {
      const newResumes = resumes.filter((_, i) => i !== index);
      setResumes(newResumes);
    }
  };

  const updateResume = (index, field, value) => {
    setResumes((prev) => {
      const newResumes = [...prev];
      newResumes[index] = { ...newResumes[index], [field]: value };
      return newResumes;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      onError("Please enter a job description.");
      return;
    }

    const validResumes = resumes.filter(
      (r) => r.text && r.text.trim().length > 0,
    );

    if (validResumes.length === 0) {
      onError("Please provide at least one resume text.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        jd: jdText.trim(),
        cvs: validResumes.map((r) => r.text.trim()),
        resume_labels: validResumes.map((r) => r.id),
      };

      const data = await rankText(payload);
      const results = (data.results || []).slice(0, topK);
      onResults({ ...data, results });
    } catch (error) {
      console.error(error);
      onError(apiErrorMessage(error) || "Failed to rank resumes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm shadow-slate-900/5">
        <label
          htmlFor="jd_text"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          Job Description <span className="text-red-600 font-semibold">*</span>
        </label>
        <textarea
          id="jd_text"
          rows={6}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          placeholder="Paste the job description here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Candidates</h3>
          <button
            type="button"
            onClick={addResume}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4 mr-1.5 opacity-70" aria-hidden />
            Add row
          </button>
        </div>

        {resumes.map((resume, index) => (
          <div
            key={index}
            className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm shadow-slate-900/5 relative group"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 mr-4 min-w-0">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  value={resume.id}
                  onChange={(e) => updateResume(index, "id", e.target.value)}
                  placeholder="e.g. Candidate A"
                />
              </div>
              {resumes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeResume(index)}
                  className="text-slate-400 hover:text-red-600 p-2 rounded-md hover:bg-slate-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                CV text
              </label>
              <textarea
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                placeholder="Paste plain text from the CV…"
                value={resume.text}
                onChange={(e) => updateResume(index, "text", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm shadow-slate-900/5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="top_k"
            className="block text-sm font-medium text-slate-800 mb-1"
          >
            Top K results
          </label>
          <input
            type="number"
            id="top_k"
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
          />
        </div>

        <div className="flex items-center h-full pt-6">
          <div className="flex items-center">
            <input
              id="explain"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-400/40"
              checked={explain}
              onChange={(e) => setExplain(e.target.checked)}
            />
            <label
              htmlFor="explain"
              className="ml-2 block text-sm text-slate-800"
            >
              Include explanations
            </label>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Rank resumes
        </button>
      </div>
    </form>
  );
};

export default TextRankForm;
