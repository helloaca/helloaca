import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { ExecutiveSummary as ExecutiveSummaryType } from '@/types/contractAnalysis'
import { AlertTriangle, FileText } from 'lucide-react'

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType
  contractTitle: string
  uploadDate: string
  fileSize?: number
  getRiskLevelDisplay: (riskLevel: string, riskScore: number) => { color: string; label: string }
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summary,
  contractTitle,
  uploadDate,
  fileSize,
  getRiskLevelDisplay
}) => {
  // Error handling and validation
  if (!summary) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Executive Summary Unavailable
          </CardTitle>
          <CardDescription>No summary data available for this contract</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Unable to load executive summary. Please try refreshing the page.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback values for missing data
  const safeSummary = {
    overall_risk_level: summary.overall_risk_level || 'Unknown',
    risk_score: summary.risk_score ?? 0,
    summary: summary.summary || 'No summary available',
    key_findings: summary.key_findings || [],
    immediate_actions: summary.immediate_actions || []
  }

  const safeContractTitle = contractTitle || 'Untitled Contract'
  const safeUploadDate = uploadDate || 'Unknown date'
  const safeFileSize = fileSize ? `${Math.round(fileSize / 1024)} KB` : 'Unknown size'

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
        <CardDescription>High-level overview of contract analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Contract Info - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Contract Title</h3>
              <p className="text-gray-600 text-sm sm:text-base">{safeContractTitle}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Upload Date</h3>
              <p className="text-gray-600 text-sm sm:text-base">{safeUploadDate}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">File Size</h3>
              <p className="text-gray-600 text-sm sm:text-base">{safeFileSize}</p>
            </div>
          </div>

          {/* Risk Assessment - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Overall Risk Level</h3>
              <Badge className={`text-xs sm:text-sm ${getRiskLevelDisplay(safeSummary.overall_risk_level, safeSummary.risk_score).color}`}>
                {getRiskLevelDisplay(safeSummary.overall_risk_level, safeSummary.risk_score).label}
              </Badge>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Risk Score</h3>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{safeSummary.risk_score}/100</div>
            </div>
          </div>

          {/* Summary - Responsive Text */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Summary</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{safeSummary.summary}</p>
          </div>

          {/* Key Findings - Responsive Layout */}
          {safeSummary.key_findings && safeSummary.key_findings.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Key Findings</h3>
              <div className="space-y-2 sm:space-y-3">
                {safeSummary.key_findings.map((finding, index) => (
                  <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                    <span className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0">•</span>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{finding}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Immediate Actions - Responsive Layout */}
          {safeSummary.immediate_actions && safeSummary.immediate_actions.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Immediate Actions</h3>
              <div className="space-y-2 sm:space-y-3">
                {safeSummary.immediate_actions.map((action, index) => (
                  <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                    <span className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0">•</span>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}