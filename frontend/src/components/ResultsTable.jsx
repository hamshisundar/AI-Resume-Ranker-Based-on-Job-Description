import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, AlertTriangle } from 'lucide-react';
import ExplanationPanel from './ExplanationPanel';
import { cn } from '../lib/utils';

const ResultsTable = ({ results = [], explanations = [], fileErrors = [] }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const explanationsMap = useMemo(() => {
    const map = {};
    if (explanations) {
      explanations.forEach(exp => {
        map[exp.resume_id] = exp.top_contributors || [];
      });
    }
    return map;
  }, [explanations]);

  const handleDownload = () => {
    if (!results || results.length === 0) return;

    // Convert results to CSV
    const csvHeader = "Rank,Resume ID,Score\n";
    const csvRows = results.map((res, index) => 
      `${index + 1},"${res.resume_id}",${res.score}`
    ).join("\n");
    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resume_rankings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!results || results.length === 0) {
    if (fileErrors && fileErrors.length > 0) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" /> Errors encountered:
          </h3>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {fileErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Ranking Results</h2>
        <button
          onClick={handleDownload}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </button>
      </div>

      {fileErrors && fileErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" /> File Errors:
          </h3>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {fileErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resume ID / File
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Score
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((result, index) => {
              const isExpanded = expandedRows.has(result.resume_id);
              const hasExplanation = !!explanationsMap[result.resume_id];
              
              return (
                <React.Fragment key={result.resume_id}>
                  <tr 
                    className={cn(
                      "hover:bg-gray-50 transition-colors cursor-pointer",
                      isExpanded ? "bg-blue-50/30" : ""
                    )}
                    onClick={() => hasExplanation && toggleRow(result.resume_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {result.resume_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {(result.score * 100).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasExplanation && (
                        <button className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && hasExplanation && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={4} className="px-6 py-4">
                        <ExplanationPanel contributors={explanationsMap[result.resume_id]} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
