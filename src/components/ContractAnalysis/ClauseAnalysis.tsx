import React, { useState } from 'react';
import { 
  // FileText, 
  Search, 
  Filter, 
  AlertTriangle, 
  Shield, 
  Info,
  ChevronDown,
  ChevronUp,
  // Eye, // removed unused
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { EnhancedContractAnalysis, AnalyzedClause } from '../../types/contractAnalysis';

interface ClauseAnalysisProps {
  analysis: EnhancedContractAnalysis;
}

const ClauseAnalysis: React.FC<ClauseAnalysisProps> = ({ analysis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());



  const handleExpandSection = (sectionName: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionName)) newSet.delete(sectionName); else newSet.add(sectionName);
    setExpandedSections(newSet);
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'safe': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Shield className="h-4 w-4 text-green-600" />;
      case 'safe': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCopyClause = (clause: AnalyzedClause) => {
    const text = `Clause ID: ${clause.clause_id}\n\nOriginal Text:\n${clause.original_text}\n\nAI Summary:\n${clause.ai_summary}`;
    navigator.clipboard.writeText(text).catch(() => {/* noop */});
  };

  const handleDownloadClause = (clause: AnalyzedClause) => {
    const blob = new Blob([JSON.stringify(clause, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clause-${clause.clause_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewWindow = (clause: AnalyzedClause) => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;
    newWindow.document.write(`<!DOCTYPE html><html><head><title>Clause ${clause.clause_id}</title></head><body>`);
    newWindow.document.write(`<h1>Clause ${clause.clause_id}</h1>`);
    newWindow.document.write(`<h2>Original Text</h2><pre>${clause.original_text}</pre>`);
    newWindow.document.write(`<h2>AI Summary</h2><p>${clause.ai_summary}</p>`);
    newWindow.document.write(`</body></html>`);
    newWindow.document.close();
  };

  const filteredSections = analysis.clause_analysis.clauses_by_section.map(sec => ({
    ...sec,
    clauses: sec.clauses
      .filter(clause => {
        const matchesSearch = searchTerm
          ? clause.original_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clause.ai_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (clause.section?.toLowerCase() || '').includes(searchTerm.toLowerCase())
          : true
        const matchesRisk = selectedRiskLevel === 'all'
          ? true
          : clause.risk_level.toLowerCase() === selectedRiskLevel
        const matchesSection = selectedSection === 'all'
          ? true
          : (clause.section?.toLowerCase() || '') === selectedSection.toLowerCase()
        return matchesSearch && matchesRisk && matchesSection
      })
  }))

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search clauses"
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select value={selectedRiskLevel} onChange={e => setSelectedRiskLevel(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="safe">Safe</option>
          </select>
          <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="all">All Sections</option>
            {analysis.clause_analysis.clauses_by_section.map((s, i) => (
              <option key={i} value={(s.section_name || '').toLowerCase()}> {s.section_name} </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clauses List */}
      {filteredSections.map((section, sIndex) => (
        <Card key={sIndex}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRiskIcon(section.section_type)}
                <CardTitle className="text-base sm:text-lg">{section.section_name}</CardTitle>
              </div>
              <button className="text-sm" onClick={() => handleExpandSection(section.section_name)}>
                {expandedSections.has(section.section_name) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </CardHeader>
          {expandedSections.has(section.section_name) && (
            <CardContent>
              <div className="space-y-3">
                {section.clauses.map((clause, cIndex) => (
                  <div key={cIndex} className={`border rounded p-2 ${getRiskColor(clause.risk_level)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRiskIcon(clause.risk_level)}
                        <Badge variant="default" className="text-xs">{clause.risk_level}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-xs" onClick={() => handleCopyClause(clause)}><Copy className="h-4 w-4" /></button>
                        <button className="text-xs" onClick={() => handleDownloadClause(clause)}><Download className="h-4 w-4" /></button>
                        <button className="text-xs" onClick={() => handleOpenInNewWindow(clause)}><ExternalLink className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">Original Text</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{clause.original_text}</p>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">AI Summary</h4>
                      <p className="text-sm text-gray-700">{clause.ai_summary}</p>
                    </div>
                    {clause.issues && clause.issues.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-semibold text-sm">Issues</h4>
                        <ul className="list-disc ml-5 text-sm text-red-800">
                          {clause.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {clause.recommendations && clause.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-semibold text-sm">Recommendations</h4>
                        {Array.isArray(clause.recommendations) ? (
                          <ul className="list-disc ml-5 text-sm text-blue-800">
                            {clause.recommendations.map((rec, i) => (
                              <li key={i}>{typeof rec === 'string' ? rec : rec.description}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ClauseAnalysis;