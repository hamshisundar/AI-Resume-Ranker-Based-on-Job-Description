import React, { useState } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { rankPdf } from "../api/client";
import { cn } from "../lib/utils";

const PdfRankForm = ({ onResults, onError, setLoading }) => {
  const [jdText, setJdText] = useState("");
  const [files, setFiles] = useState([]);
  const [topK, setTopK] = useState(10);
  const [explain, setExplain] = useState(true);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf",
      );
      if (newFiles.length !== e.target.files.length) {
        onError("Only PDF files are allowed.");
      }
      setFiles((prev) => [...prev, ...newFiles]);
      // Reset input value to allow selecting the same file again if needed
      e.target.value = "";
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      onError("Please enter a job description.");
      return;
    }
    if (files.length === 0) {
      onError("Please upload at least one PDF resume.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("jd_text", jdText);
      formData.append("top_k", topK);
      formData.append("explain", explain.toString());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const data = await rankPdf(formData);
      onResults(data);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.error ||
        error.message ||
        "Failed to rank resumes. Please check the backend.";
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <div>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload Resumes (PDF only) <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors cursor-pointer relative">
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Upload files
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF up to 10MB</p>
          </div>
        </div>

        {files.length > 0 && (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 text-sm bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex items-center overflow-hidden">
                  <File className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="truncate text-gray-700">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
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

export default PdfRankForm;
