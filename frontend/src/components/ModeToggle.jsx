import React from 'react';
import { cn } from '../lib/utils';
import { FileText, Upload } from 'lucide-react';

const ModeToggle = ({ mode, setMode }) => {
  return (
    <div className="flex p-1 space-x-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => setMode('upload')}
        className={cn(
          "flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md transition-all",
          mode === 'upload' 
            ? "bg-white text-blue-600 shadow-sm" 
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
        )}
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload PDFs
      </button>
      <button
        onClick={() => setMode('paste')}
        className={cn(
          "flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md transition-all",
          mode === 'paste' 
            ? "bg-white text-blue-600 shadow-sm" 
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
        )}
      >
        <FileText className="w-4 h-4 mr-2" />
        Paste Resume Text
      </button>
    </div>
  );
};

export default ModeToggle;
