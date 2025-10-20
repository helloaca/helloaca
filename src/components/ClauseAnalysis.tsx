import React, { useState } from 'react';

interface Clause {
  title: string;
  content: string;
  analysis: string;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  issues: string[];
  suggestions: string[];
}

interface ClauseAnalysisProps {
  clauses: Clause[];
}

export const ClauseAnalysis: React.FC<ClauseAnalysisProps> = ({ clauses }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!clauses || clauses.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">General Terms</h3>
        <p className="text-gray-600 text-sm">
          Contract analysis completed with basic review
        </p>
        <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          risk
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {clauses.map((clause, clauseIndex) => (
        <div key={clauseIndex} className="bg-white border rounded-lg overflow-hidden">
          {/* Clause Header */}
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{clause.title}</h3>
            {clause.riskLevel !== 'none' && (
              <span className={`px-3 py-1 text-xs rounded-full ${getRiskBadge(clause.riskLevel)}`}>
                {clause.riskLevel}
              </span>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* Original Clause */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original Clause:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                {clause.content}
              </p>
            </div>

            {/* Analysis */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis:</h4>
              <p className="text-sm text-gray-600">{clause.analysis}</p>
            </div>

            {/* Issues */}
            {clause.issues && clause.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Issues Identified:</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {clause.issues.map((issue, i) => (
                    <li key={i} className="text-sm text-gray-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions with Copy Button */}
            {clause.suggestions && clause.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Suggested Replacements:
                </h4>
                <div className="space-y-3">
                  {clause.suggestions.map((suggestion, suggestionIndex) => {
                    const uniqueIndex = `${clauseIndex}-${suggestionIndex}`;
                    return (
                      <div key={suggestionIndex} className="relative bg-green-50 border border-green-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 pr-20">{suggestion}</p>
                        <button
                          onClick={() => copyToClipboard(suggestion, parseInt(uniqueIndex))}
                          className="absolute top-3 right-3 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          {copiedIndex === parseInt(uniqueIndex) ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};