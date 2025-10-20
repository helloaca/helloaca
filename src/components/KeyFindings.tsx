import React from 'react';

interface Finding {
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  category: 'risk' | 'opportunity' | 'obligation';
}

interface KeyFindingsProps {
  findings: Finding[];
}

export const KeyFindings: React.FC<KeyFindingsProps> = ({ findings }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk': return '⚠️';
      case 'opportunity': return '💡';
      case 'obligation': return '📋';
      default: return '📄';
    }
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900">Analysis incomplete</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Perform manual review of contract terms
            </p>
            <span className="inline-block mt-2 px-3 py-1 bg-yellow-200 text-yellow-900 text-xs rounded-full">
              Medium Severity
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((finding, index) => (
        <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-start">
            <span className="text-2xl mr-3">{getCategoryIcon(finding.category)}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{finding.title}</h3>
              <p className="text-gray-700 text-sm mb-3">{finding.description}</p>
              <span className={`inline-block px-3 py-1 text-xs rounded-full ${getSeverityColor(finding.severity)}`}>
                {finding.severity} Severity
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};