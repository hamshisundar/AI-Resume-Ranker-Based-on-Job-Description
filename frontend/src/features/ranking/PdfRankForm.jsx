import React, { useState } from "react";
import { Upload, File, X, FileText } from "lucide-react";
import { rankPdf, apiErrorMessage } from "../../api/client";
import { cn } from "../../lib/utils";

const RESUME_EXT = /\.(pdf|docx|doc)$/i;

function isResumeFile(file) {
  return RESUME_EXT.test(file.name || "");
}

const JD_ACCEPT = ".pdf,application/pdf";

export default function PdfRankForm({ onResults, onError, setLoading }) {
  const [jdMode, setJdMode] = useState("paste");
  const [jdText, setJdText] = useState("");
  const [jdPdfFile, setJdPdfFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [topK, setTopK] = useState(10);
  const [explain, setExplain] = useState(true);

  const handleResumePick = (e) => {
    if (!e.target.files?.length) return;
    const picked = Array.from(e.target.files);
    const ok = picked.filter(isResumeFile);
    if (ok.length !== picked.length) {
      onError("Only PDF, DOC, and DOCX resumes are supported.");
    }
    setFiles((prev) => [...prev, ...ok]);
    e.target.value = "";
  };

  const handleJdPdfPick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      onError("Job description upload must be a PDF.");
      return;
    }
    setJdPdfFile(f);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (jdMode === "paste") {
      if (!jdText.trim()) {
        onError("Paste a job description or switch to “Upload JD (PDF)”.");
        return;
      }
    } else if (!jdPdfFile) {
      onError("Choose a PDF file for the job description.");
      return;
    }

    if (files.length === 0) {
      onError("Upload at least one resume (PDF, DOC, or DOCX).");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("top_k", topK);
      formData.append("explain", explain.toString());

      if (jdMode === "paste") {
        formData.append("jd_text", jdText);
      } else {
        formData.append("jd_pdf", jdPdfFile);
      }

      files.forEach((file) => {
        formData.append("files", file);
      });

      const data = await rankPdf(formData);
      const results = (data.results || []).slice(0, topK);
      onResults({ ...data, results });
    } catch (error) {
      console.error(error);
      onError(
        apiErrorMessage(error) || "Failed to rank resumes. Please check the backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm shadow-slate-900/5"
    >
      <div>
        <span className="block text-sm font-semibold text-slate-800 mb-2">
          Job Description <span className="text-red-600 font-semibold">*</span>
        </span>
        <div className="flex p-0.5 gap-0.5 bg-slate-100 rounded-lg border border-slate-200 w-full max-w-md mb-3">
          <button
            type="button"
            onClick={() => {
              setJdMode("paste");
              setJdPdfFile(null);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded transition-colors",
              jdMode === "paste"
                ? "bg-white text-blue-700 shadow-sm border border-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80",
            )}
          >
            <FileText className="w-4 h-4 opacity-70" aria-hidden />
            Paste
          </button>
          <button
            type="button"
            onClick={() => {
              setJdMode("pdf");
              setJdText("");
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded transition-colors",
              jdMode === "pdf"
                ? "bg-white text-blue-700 shadow-sm border border-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80",
            )}
          >
            <Upload className="w-4 h-4 opacity-70" aria-hidden />
            PDF
          </button>
        </div>

        {jdMode === "paste" ? (
          <>
            <label htmlFor="jd_text" className="sr-only">
              Job description text
            </label>
            <textarea
              id="jd_text"
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center px-6 py-8 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50/80 transition-colors relative">
              <input
                type="file"
                accept={JD_ACCEPT}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleJdPdfPick}
              />
              <div className="text-center text-sm text-slate-600 pointer-events-none">
                {jdPdfFile ? (
                  <span className="font-medium text-slate-900">{jdPdfFile.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-slate-800">Choose job PDF</span>
                    <p className="text-xs text-slate-500 mt-1">One file; text is extracted on the server.</p>
                  </>
                )}
              </div>
            </div>
            {jdPdfFile && (
              <button
                type="button"
                onClick={() => setJdPdfFile(null)}
                className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Remove file
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          Upload resumes <span className="text-red-600">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">PDF, Word (.docx), or legacy .doc (best effort).</p>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50/80 transition-colors cursor-pointer relative">
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleResumePick}
          />
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-10 w-10 text-blue-600" aria-hidden />
            <div className="flex flex-wrap justify-center gap-x-1 text-sm text-slate-600">
              <span className="font-medium text-blue-600">Upload files</span>
              <span>or drag and drop</span>
            </div>
            <p className="text-xs text-slate-500">Multiple PDFs; max size depends on your server.</p>
          </div>
        </div>

        {files.length > 0 && (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 text-sm bg-slate-50 rounded-md border border-slate-200"
              >
                <div className="flex items-center overflow-hidden min-w-0">
                  <File className="w-4 h-4 text-slate-400 mr-2 shrink-0" aria-hidden />
                  <span className="truncate text-slate-800">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-slate-400 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="top_k" className="block text-sm font-medium text-slate-800 mb-1">
            Top K results
          </label>
          <input
            type="number"
            id="top_k"
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10) || 10)}
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
            <label htmlFor="explain" className="ml-2 block text-sm text-slate-800">
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
}
