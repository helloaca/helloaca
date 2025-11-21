import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Globe, Users, Lightbulb, AlertCircle, CheckCircle, Clock, Circle } from 'lucide-react'
import { EnhancedContractAnalysis } from '@/types/contractAnalysis'

type LegalInsightsData = EnhancedContractAnalysis['legal_insights']

interface LegalInsightsProps {
  legalInsights: LegalInsightsData
}

export const LegalInsightsComponent: React.FC<LegalInsightsProps> = ({ legalInsights }) => {
  if (!legalInsights || Object.keys(legalInsights).length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
            Legal Insights Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No legal insights available for this contract.</p>
            <p className="text-sm text-gray-500 mt-2">This may be due to analysis not being completed or data corruption.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const safeLegalInsights = {
    contextual_recommendations: legalInsights.contextual_recommendations || [],
    jurisdiction_specific: legalInsights.jurisdiction_specific || [],
    role_based_advice: legalInsights.role_based_advice || [],
    action_items: legalInsights.action_items || []
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Contextual Recommendations */}
      {safeLegalInsights.contextual_recommendations && safeLegalInsights.contextual_recommendations.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Contextual Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {safeLegalInsights.contextual_recommendations.map((rec, index) => (
                <div key={index} className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">{rec.title}</h4>
                    <Badge variant="default" className="text-xs">{rec.priority}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700">{rec.description}</p>
                  {rec.implementation_steps && rec.implementation_steps.length > 0 && (
                    <ul className="text-xs text-gray-600 space-y-1 mt-2">
                      {rec.implementation_steps.map((step, idx) => (
                        <li key={idx}>• {step}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jurisdiction-Specific Advice */}
      {safeLegalInsights.jurisdiction_specific && safeLegalInsights.jurisdiction_specific.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
              Jurisdiction-Specific Advice
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {safeLegalInsights.jurisdiction_specific.map((jurisdiction, index) => (
                <div key={index} className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">{jurisdiction.jurisdiction}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700">Requirements</h5>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        {jurisdiction.legal_requirements.map((req, idx) => (
                          <li key={idx}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700">Compliance Notes</h5>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        {jurisdiction.compliance_notes.map((note, idx) => (
                          <li key={idx}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-Based Advice - Responsive Card */}
      {safeLegalInsights.role_based_advice && safeLegalInsights.role_based_advice.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
              Role-Based Advice
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {safeLegalInsights.role_based_advice.map((advice, index) => (
                <div key={index} className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">{advice.role}</h4>
                  {advice.specific_guidance && advice.specific_guidance.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700">Guidance</h5>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        {advice.specific_guidance.map((g, idx) => (
                          <li key={idx}>• {g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {advice.common_pitfalls && advice.common_pitfalls.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700">Common Pitfalls</h5>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        {advice.common_pitfalls.map((p, idx) => (
                          <li key={idx}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {advice.negotiation_tips && advice.negotiation_tips.length > 0 && (
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium text-gray-700">Negotiation Tips</h5>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        {advice.negotiation_tips.map((t, idx) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items - Responsive Card */}
      {safeLegalInsights.action_items && safeLegalInsights.action_items.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
              Action Items ({safeLegalInsights.action_items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-2 sm:space-y-3">
              {safeLegalInsights.action_items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5 flex-shrink-0">
                    {item.status === 'Completed' ? (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : item.status === 'In Progress' ? (
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                    ) : (
                      <Circle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1 sm:gap-2">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</h4>
                      <Badge variant="default" className="text-xs">{item.priority}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">{item.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                      {item.assigned_to && <span>Assignee: {item.assigned_to}</span>}
                      {item.due_date && <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}