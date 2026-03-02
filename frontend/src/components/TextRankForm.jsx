import React, { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { rankText } from "../api/client";

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

    // Create payload from resumes state
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
        jd_text: jdText,
        resumes: validResumes.map((r) => ({
          resume_id: r.id,
          resume_text: r.text,
        })),
        top_k: topK,
        explain: explain,
      };

      const data = await rankText(payload);
      onResults(data);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.error ||
        error.message ||
        "Failed to rank resumes.";
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label
          htmlFor="jd_text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="jd_text"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Paste the job description here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Resumes</h3>
          <button
            type="button"
            onClick={addResume}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Resume
          </button>
        </div>

        {resumes.map((resume, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative group"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 mr-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Resume ID
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={resume.id}
                  onChange={(e) => updateResume(index, "id", e.target.value)}
                  placeholder="e.g. Candidate A"
                />
              </div>
              {resumes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeResume(index)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Resume Text
              </label>
              <textarea
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-sm"
                placeholder="Paste resume content..."
                value={resume.text}
                onChange={(e) => updateResume(index, "text", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="top_k"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Top K Results
          </label>
          <input
            type="number"
            id="top_k"
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
          />
        </div>

        <div className="flex items-center h-full pt-6">
          <div className="flex items-center">
            <input
              id="explain"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={explain}
              onChange={(e) => setExplain(e.target.checked)}
            />
            <label
              htmlFor="explain"
              className="ml-2 block text-sm text-gray-900"
            >
              Include Explanations
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Rank Resumes
        </button>
      </div>
    </form>
  );
};

export default TextRankForm;
