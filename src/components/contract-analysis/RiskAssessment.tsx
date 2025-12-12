import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { AlertTriangle, Shield } from 'lucide-react'
import { RiskAssessment } from '@/types/contractAnalysis'
import Button from '@/components/ui/Button'

interface RiskAssessmentProps {
  riskAssessment: RiskAssessment
  blurCategories?: boolean
  onUpgrade?: () => void
}

export const RiskAssessmentComponent: React.FC<RiskAssessmentProps> = ({ riskAssessment, blurCategories, onUpgrade }) => {
  if (!riskAssessment || Object.keys(riskAssessment).length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Risk Assessment Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No risk assessment data available for this contract.</p>
            <p className="text-sm text-gray-500 mt-2">This may be due to analysis not being completed or data corruption.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const safeRiskAssessment: Required<Pick<RiskAssessment, 'risk_level' | 'overall_risk_score' | 'mitigation_summary' | 'risk_categories' | 'critical_risks'>> = {
    risk_level: riskAssessment.risk_level ?? 'medium',
    overall_risk_score: riskAssessment.overall_risk_score ?? 0,
    mitigation_summary: riskAssessment.mitigation_summary ?? 'Review contract and address identified issues to mitigate risk.',
    risk_categories: riskAssessment.risk_categories ?? [],
    critical_risks: riskAssessment.critical_risks ?? []
  }

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center text-base sm:text-lg">
            Overall Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge className={`text-base sm:text-lg px-2 sm:px-3 py-1 ${getRiskColor(safeRiskAssessment.risk_level)}`}>
              {safeRiskAssessment.overall_risk_score}
            </Badge>
            <span className="text-sm sm:text-base text-gray-600">{safeRiskAssessment.risk_level || 'unknown'}</span>
          </div>
          {safeRiskAssessment.mitigation_summary && (
            <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-4">{safeRiskAssessment.mitigation_summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Risk Categories */}
      {safeRiskAssessment.risk_categories && safeRiskAssessment.risk_categories.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              Risk Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4 relative">
            <div className={blurCategories ? 'pointer-events-none select-none filter blur-sm' : ''}>
              <div className="space-y-3 sm:space-y-4">
                {safeRiskAssessment.risk_categories.map((cat: NonNullable<RiskAssessment['risk_categories']>[number], index: number) => (
                  <div key={index} className="p-2 sm:p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs sm:text-sm">{cat.category}</Badge>
                        <span className="text-xs sm:text-sm text-gray-600">Score: {cat.score}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">Risk Level:</span>
                        <Badge variant={cat.risk_level === 'Critical' ? 'danger' : cat.risk_level === 'High' ? 'warning' : cat.risk_level === 'Medium' ? 'info' : 'success'} className="text-xs sm:text-sm">
                          {cat.risk_level}
                        </Badge>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-xs sm:text-sm text-gray-700 mt-2">{cat.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {blurCategories ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/85 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-700">Upgrade to view risk category details</p>
                  <div className="mt-3 flex justify-center">
                    <Button onClick={onUpgrade} className="min-h-[36px]">Upgrade</Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Critical Risks */}
      {safeRiskAssessment.critical_risks && safeRiskAssessment.critical_risks.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Critical Risks
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {safeRiskAssessment.critical_risks.map((risk, index) => (
              <Card key={index} className="border-red-200 bg-red-50">
                <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base">{risk.title}</CardTitle>
                    <Badge variant="danger" className="text-xs">{risk.severity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                  <p className="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">{risk.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                    <div className="flex items-center">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Impact:</span>
                      <Badge variant="info" className="ml-2 text-xs">{risk.impact}</Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Likelihood:</span>
                      <Badge variant="info" className="ml-2 text-xs">{risk.likelihood}</Badge>
                    </div>
                  </div>
                  {risk.mitigation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium text-blue-900">Mitigation:</span>
                      <span className="text-blue-800 ml-1">{risk.mitigation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}