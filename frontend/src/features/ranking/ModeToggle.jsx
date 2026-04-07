import React from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "../../lib/utils";

const ModeToggle = ({ mode, setMode }) => {
  return (
    <div className="flex p-1 gap-1 rounded-lg bg-slate-100 border border-slate-200">
      <button
        type="button"
        onClick={() => setMode("upload")}
        className={cn(
          "flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
          mode === "upload"
            ? "bg-white text-blue-700 border border-blue-600 shadow-sm"
            : "text-slate-600 hover:text-slate-900",
        )}
      >
        <Upload className="w-4 h-4 shrink-0" aria-hidden />
        Upload PDFs
      </button>
      <button
        type="button"
        onClick={() => setMode("paste")}
        className={cn(
          "flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
          mode === "paste"
            ? "bg-white text-blue-700 border border-blue-600 shadow-sm"
            : "text-slate-600 hover:text-slate-900",
        )}
      >
        <FileText className="w-4 h-4 shrink-0" aria-hidden />
        Paste text
      </button>
    </div>
  );
};

export default ModeToggle;
