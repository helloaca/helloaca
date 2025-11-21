import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { EnhancedContractAnalysis, AnalyzedClause } from '@/types/contractAnalysis'

interface ClauseAnalysisProps {
  analysis: EnhancedContractAnalysis
}

const ClauseAnalysis: React.FC<ClauseAnalysisProps> = ({ analysis }) => {
  const sections = analysis?.clause_analysis?.clauses_by_section || []

  if (!sections || sections.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-500" />
            Clause Analysis Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No clause analysis data available for this contract.</p>
            <p className="text-sm text-gray-500 mt-2">This may be due to analysis not being completed or no clauses detected.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

  const toggleSection = (sectionName: string) => {
    const next = new Set(expandedSections)
    if (next.has(sectionName)) next.delete(sectionName); else next.add(sectionName)
    setExpandedSections(next)
  }

  const getSectionRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="danger" className="text-xs">High Risk</Badge>
    if (score >= 60) return <Badge variant="warning" className="text-xs">Medium Risk</Badge>
    if (score >= 30) return <Badge variant="info" className="text-xs">Moderate</Badge>
    return <Badge variant="success" className="text-xs">Low Risk</Badge>
  }

  const getClauseRiskBadge = (level: string) => {
    const v = (level || '').toLowerCase()
    if (v === 'critical' || v === 'high') return <Badge variant="danger" className="text-xs">{level}</Badge>
    if (v === "medium") return <Badge variant="warning" className="text-xs">{level}</Badge>
    if (v === 'low' || v === 'safe') return <Badge variant="success" className="text-xs">{level}</Badge>
    return <Badge variant="default" className="text-xs">Unknown</Badge>
  }

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const sectionName = section.section_name
        const isExpanded = expandedSections.has(sectionName)
        return (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <CardTitle className="text-base sm:text-lg">{sectionName}</CardTitle>
                  {getSectionRiskBadge(section.section_risk_score || 0)}
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleSection(sectionName)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                {section.summary && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Summary</h4>
                    <p className="text-gray-700 text-sm sm:text-base">{section.summary}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {section.clauses.map((clause: AnalyzedClause, i: number) => (
                    <div key={i} className="border rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getClauseRiskBadge(String(clause.risk_level))}
                          <Badge variant="info" className="text-xs">ID: {clause.clause_id}</Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <h5 className="font-semibold text-sm">AI Summary</h5>
                        <p className="text-sm text-gray-700">{clause.ai_summary}</p>
                      </div>
                      {clause.issues && clause.issues.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-semibold text-sm">Issues</h5>
                          <ul className="list-disc ml-5 text-sm text-red-800">
                            {clause.issues.map((issue, j) => (
                              <li key={j}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {clause.recommendations && clause.recommendations.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-semibold text-sm">Recommendations</h5>
                          {Array.isArray(clause.recommendations) ? (
                            <ul className="list-disc ml-5 text-sm text-blue-800">
                              {clause.recommendations.map((rec, k) => (
                                <li key={k}>{typeof rec === 'string' ? rec : rec.description}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-blue-800">{String(clause.recommendations)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

export default ClauseAnalysis