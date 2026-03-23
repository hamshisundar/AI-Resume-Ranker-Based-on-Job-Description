import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "../components/Toast";
import BackendStatus from "../components/BackendStatus";
import ModeToggle from "../components/ModeToggle";
import PdfRankForm from "../components/PdfRankForm";
import TextRankForm from "../components/TextRankForm";
import ResultsTable from "../components/ResultsTable";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, authDisabled, logout } = useAuth();
  const [mode, setMode] = useState("upload");
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResults = (data) => {
    setResultsData(data);
    addToast("Resumes ranked successfully!", "success");
  };

  const handleError = (message) => {
    addToast(message, "error");
  };

  const handleLogout = async () => {
    try {
      await logout();
      addToast("Signed out", "info");
    } catch {
      addToast("Could not sign out", "error");
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Resume Ranking Dashboard</h1>
            {user && (
              <span className="text-sm text-gray-500 hidden sm:inline truncate max-w-[200px]" title={user.email}>
                {user.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <BackendStatus />
            {!authDisabled && user && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          <div className="w-full md:w-1/3 lg:w-1/4 space-y-6 sticky top-24">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Input Mode</h2>
              <ModeToggle
                mode={mode}
                setMode={(m) => {
                  setMode(m);
                  setResultsData(null);
                }}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <p>
                {mode === "upload"
                  ? "Upload multiple PDF resumes to rank them against a job description."
                  : "Paste resume text directly to rank candidates quickly."}
              </p>
            </div>
          </div>

          <div className="w-full md:w-2/3 lg:w-3/4 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {mode === "upload" ? "Upload & Rank PDFs" : "Paste & Rank Text"}
              </h2>

              {mode === "upload" ? (
                <PdfRankForm onResults={handleResults} onError={handleError} setLoading={setLoading} />
              ) : (
                <TextRankForm onResults={handleResults} onError={handleError} setLoading={setLoading} />
              )}
            </section>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Ranking resumes... this may take a moment.</p>
              </div>
            )}

            {!loading && resultsData && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ResultsTable
                  results={resultsData.results}
                  explanations={resultsData.explanations}
                  fileErrors={resultsData.file_errors}
                />
              </section>
            )}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
