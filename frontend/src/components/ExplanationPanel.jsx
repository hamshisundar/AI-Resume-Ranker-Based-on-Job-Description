import React from 'react';

const ExplanationPanel = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return <div className="text-sm text-gray-500 italic">No explanation available.</div>;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Contributors</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contributors.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 py-1">
            <span className="font-medium text-gray-600">{item.feature}</span>
            <span className="text-blue-600 font-bold">{(item.contribution * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplanationPanel;
