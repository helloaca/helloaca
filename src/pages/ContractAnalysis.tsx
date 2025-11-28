import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { FileText, AlertTriangle, MessageCircle, Download, CheckCircle, XCircle, AlertCircle, Info, ChevronDown, ChevronRight, ChevronLeft, Users, FileCheck, Briefcase, CreditCard, Calendar, Shield, Lock, Scale, Gavel, FileSignature, PenTool } from 'lucide-react'
import { ContractService, Contract, ContractAnalysis as ContractAnalysisType } from '@/lib/contractService'
import { EnhancedContractAnalysis } from '@/types/contractAnalysis'
import { ExecutiveSummary } from '@/components/contract-analysis/ExecutiveSummary'
import { RiskAssessmentComponent } from '@/components/contract-analysis/RiskAssessment'
import { LegalInsightsComponent } from '@/components/contract-analysis/LegalInsights'
import { ExportCenter } from '@/components/contract-analysis/ExportCenter'
import { SectionAnalysis, RedFlag, CheckItem } from '@/types/contractAnalysis'
import { useAuth } from '@/contexts/AuthContext'
import { isContractCredited } from '@/lib/utils'

// Section icons mapping
const sectionIcons = {
  'Title & Parties': Users,
  'Recitals': FileCheck,
  'Scope of Work': Briefcase,
  'Payment Terms': CreditCard,
  'Term & Termination': Calendar,
  'Intellectual Property': Shield,
  'Confidentiality': Lock,
  'Liability': Scale,
  'Dispute Resolution': Gavel,
  'Boilerplate': FileSignature,
  'Signature Page': PenTool
}

interface ContractAnalysisResultsProps {
  contract: Contract
  analysis: ContractAnalysisType
  getRiskLevelDisplay: (riskLevel: string, riskScore: number) => { color: string; label: string }
  onDownloadReport: () => void
  onChatWithAI: () => void
}



const ContractAnalysisResults: React.FC<ContractAnalysisResultsProps> = ({
  contract,
  analysis,
  getRiskLevelDisplay,
  onDownloadReport,
  onChatWithAI
}) => {
  const nav = useNavigate()
  const { user } = useAuth()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'executive' | 'clauses' | 'risk' | 'legal' | 'export'>('executive')
  const tabs: Array<{ id: 'executive' | 'clauses' | 'risk' | 'legal' | 'export'; label: string; icon: any }> = [
    { id: 'executive', label: 'Executive Summary', icon: FileText },
    { id: 'clauses', label: 'Clause Analysis', icon: Scale },
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
    { id: 'legal', label: 'Legal Insights', icon: Gavel },
    { id: 'export', label: 'Export Center', icon: Download }
  ]
  const currentIndex = tabs.findIndex(t => t.id === activeTab)
  const handlePrev = () => { if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id) }
  const handleNext = () => { if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id) }

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName)
    } else {
      newExpanded.add(sectionName)
    }
    setExpandedSections(newExpanded)
  }

  // Get enhanced analysis data
  const enhancedData = analysis.analysis_data as EnhancedContractAnalysis
  
  // Get sections from clause analysis
  const sections = enhancedData?.clause_analysis?.clauses_by_section || []
  const sectionsArray = sections.map((clauseSection: any, index: number) => ({
    sectionName: clauseSection.section_name || `Section ${index + 1}`,
    goal: clauseSection.summary,
    riskLevel: 'Low Risk',
    status: 'Pass' as const,
    keyFindings: [],
    redFlags: [],
    recommendations: [],
    checkItems: []
  }))

  const credited = user?.id ? isContractCredited(user.id, contract.id) : false
  const isLocked = !credited

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="py-2">
          <Button variant="outline" size="sm" onClick={() => nav('/dashboard')} className="min-h-[36px]">
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
        <div className="sm:hidden flex items-center gap-2 py-2">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {tabs.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIndex <= 0} className="min-h-[36px]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} disabled={currentIndex >= tabs.length - 1} className="min-h-[36px]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <nav className="hidden sm:flex -mb-px space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Executive Summary Tab */}
      {activeTab === 'executive' && enhancedData?.executive_summary && (
        <ExecutiveSummary
          summary={enhancedData.executive_summary}
          contractTitle={contract.title}
          uploadDate={new Date(contract.created_at).toLocaleDateString()}
          fileSize={contract.file_size}
          getRiskLevelDisplay={getRiskLevelDisplay}
        />
      )}

      {/* Clause Analysis Tab */}
      {activeTab === 'clauses' && (
        <div className="relative">
          <div className={isLocked ? 'pointer-events-none select-none filter blur-sm space-y-4' : 'space-y-4'}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Section-by-Section Analysis</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                onClick={() => setExpandedSections(new Set(sectionsArray.map(s => s.sectionName)))}
              >
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                onClick={() => setExpandedSections(new Set())}
              >
                Collapse All
              </Button>
            </div>
          </div>

          {sectionsArray.length > 0 ? (
            sectionsArray.map((section: SectionAnalysis, index: number) => {
              const sectionName = section.sectionName || `Section ${index + 1}`
              const riskLevel = section.riskLevel || 'Low Risk'
              const status = section.status || 'Unknown'
              
              const isExpanded = expandedSections.has(sectionName)
              const IconComponent = sectionIcons[sectionName as keyof typeof sectionIcons] || FileText
              const riskColor = riskLevel.includes('Critical') || riskLevel.includes('High') ? 'text-red-600' :
                               riskLevel.includes('Medium') ? 'text-yellow-600' : 'text-green-600'
              const riskBg = riskLevel.includes('Critical') || riskLevel.includes('High') ? 'bg-red-50 border-red-200' :
                            riskLevel.includes('Medium') ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'

              return (
                <Card key={sectionName} className={`transition-all duration-200 ${riskBg}`}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleSection(sectionName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-6 w-6 ${riskColor}`} />
                        <div>
                          <CardTitle className="text-lg">{sectionName}</CardTitle>
                          <CardDescription className="text-sm">
                            {section.goal || 'Section analysis'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${riskColor.replace('text-', 'bg-').replace('600', '100')} ${riskColor.replace('600', '800')}`}>
                          {riskLevel}
                        </Badge>
                        <Badge variant={
                          status === 'Pass' ? 'success' : 
                          status === 'Warning' ? 'warning' : 
                          status === 'Critical' ? 'danger' : 
                          'default'
                        }>
                          {status}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Key Findings */}
                      {section.keyFindings && section.keyFindings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Key Findings
                          </h4>
                          <div className="space-y-2">
                            {section.keyFindings.map((finding: string, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-gray-700">{finding}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Red Flags */}
                      {section.redFlags && section.redFlags.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                            Red Flags ({section.redFlags.length})
                          </h4>
                          <div className="space-y-3">
                            {section.redFlags.map((flag: RedFlag, idx: number) => (
                              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-red-900 mb-1">{flag.type}</h5>
                                    <p className="text-red-800 text-sm mb-2">{flag.description}</p>
                                    <div className="flex items-center justify-between">
                                      <Badge className="bg-red-100 text-red-800">
                                        {flag.severity} Risk
                                      </Badge>
                                      <span className="text-xs text-red-600">
                                        Impact: {flag.impact}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {section.recommendations && section.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                            <Info className="h-4 w-4 mr-2 text-blue-600" />
                            Recommendations
                          </h4>
                          <div className="space-y-2">
                            {section.recommendations.map((rec: string, idx: number) => (
                              <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-blue-800 text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compliance Checks */}
                      {section.checkItems && section.checkItems.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Scale className="h-4 w-4 mr-2 text-gray-600" />
                            Compliance Checks
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {section.checkItems.map((check: CheckItem, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">{check.item}</span>
                                <div className="flex items-center">
                                  {check.status === 'Pass' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : check.status === 'Fail' ? (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  )}
                                  <span className={`ml-2 text-xs ${
                                    check.status === 'Pass' ? 'text-green-600' : 
                                    check.status === 'Fail' ? 'text-red-600' : 'text-yellow-600'
                                  }`}>
                                    {check.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Analysis Available</h3>
                <p className="text-gray-600">
                  The contract analysis is using the legacy format. Please re-upload the contract for the new section-by-section analysis.
                </p>
              </CardContent>
            </Card>
          )}
          </div>
          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/85 backdrop-blur-sm rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Upgrade to unlock Clause Analysis</h3>
                <p className="text-sm text-gray-600 mt-2">Buy credits to view detailed clause analysis.</p>
                <div className="mt-4 flex justify-center">
                  <Button onClick={() => nav('/pricing')} className="min-h-[44px] px-6">Upgrade</Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'clauses' && analysis.analysis_data?.criticalIssues && analysis.analysis_data.criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Critical Issues ({analysis.analysis_data.criticalIssues.length})
            </CardTitle>
            <CardDescription>
              High-priority issues that require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.analysis_data.criticalIssues.map((issue: any, index: number) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h5 className="font-medium text-red-900 mb-1">{issue.category}</h5>
                      <p className="text-red-800 text-sm mb-2">{issue.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-red-100 text-red-800">
                          {issue.severity} Risk
                        </Badge>
                        <span className="text-xs text-red-600">
                          Impact: {issue.impact}
                        </span>
                      </div>
                      <div className="bg-red-100 rounded p-2">
                        <p className="text-red-800 text-sm font-medium">Recommendation:</p>
                        <p className="text-red-700 text-sm">{issue.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'clauses' && analysis.analysis_data?.missingClauses && analysis.analysis_data.missingClauses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="h-5 w-5 text-orange-600 mr-2" />
              Missing Clauses ({analysis.analysis_data.missingClauses.length})
            </CardTitle>
            <CardDescription>
              Important clauses that should be considered for inclusion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.analysis_data.missingClauses.map((clause: any, index: number) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h5 className="font-medium text-orange-900 mb-1">{clause.clauseType}</h5>
                      <p className="text-orange-800 text-sm mb-2">{clause.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-orange-100 text-orange-800">
                          {clause.importance} Priority
                        </Badge>
                        <span className="text-xs text-orange-600">
                          Risk: {clause.riskIfMissing}
                        </span>
                      </div>
                      <div className="bg-orange-100 rounded p-2">
                        <p className="text-orange-800 text-sm font-medium">Suggested Addition:</p>
                        <p className="text-orange-700 text-sm">{clause.suggestedLanguage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'clauses' && analysis.analysis_data?.overallRecommendations && analysis.analysis_data.overallRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              Overall Recommendations
            </CardTitle>
            <CardDescription>
              Key actions to improve your contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.analysis_data.overallRecommendations.map((rec: string, index: number) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'risk' && enhancedData?.risk_assessment && (
        <RiskAssessmentComponent 
          riskAssessment={enhancedData.risk_assessment} 
          blurCategories={isLocked}
          onUpgrade={() => nav('/pricing')}
        />
      )}

      {activeTab === 'legal' && enhancedData?.legal_insights && (
        <LegalInsightsComponent legalInsights={enhancedData.legal_insights} />
      )}

      {activeTab === 'export' && enhancedData?.export_data && contract && (
        <ExportCenter 
          exportData={enhancedData.export_data} 
          contractTitle={contract.title}
          analysis={enhancedData}
          locked={isLocked}
          onUpgrade={() => nav('/pricing')}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
        <Button 
          variant="outline" 
          onClick={onDownloadReport}
          className="w-full sm:w-auto min-h-[44px] px-6 py-3"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button 
          onClick={onChatWithAI}
          className="w-full sm:w-auto min-h-[44px] px-6 py-3"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat with AI
        </Button>
      </div>
    </div>
  )
}

const ContractAnalysis: React.FC = () => {
  const navigate = useNavigate()
  const { contractId } = useParams<{ contractId: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [analysis, setAnalysis] = useState<ContractAnalysisType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const getContractCacheKey = (id: string) => `contract_cache_${id}`
  const getAnalysisCacheKey = (id: string) => `analysis_cache_${id}`
  const readCachedContract = (id: string): Contract | null => {
    try {
      const raw = localStorage.getItem(getContractCacheKey(id))
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }
  const writeCachedContract = (id: string, data: Contract) => {
    try { localStorage.setItem(getContractCacheKey(id), JSON.stringify(data)) } catch { void 0 }
  }
  const readCachedAnalysis = (id: string): ContractAnalysisType | null => {
    try {
      const raw = localStorage.getItem(getAnalysisCacheKey(id))
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }
  const writeCachedAnalysis = (id: string, data: ContractAnalysisType) => {
    try { localStorage.setItem(getAnalysisCacheKey(id), JSON.stringify(data)) } catch { void 0 }
  }
  
  useEffect(() => {
    const loadContractData = async () => {
      if (!contractId) {
        setError('No contract ID provided')
        setIsLoading(false)
        return
      }
      const cachedContract = readCachedContract(contractId)
      const cachedAnalysis = readCachedAnalysis(contractId)
      if (cachedContract) {
        setContract(cachedContract)
        if (cachedAnalysis) setAnalysis(cachedAnalysis)
        setIsLoading(false)
      }
      const timeoutMs = 12000
      const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), timeoutMs))
      const fetchPromise = (async () => {
        try {
          const c = await ContractService.getContract(contractId)
          if (!c) return { error: new Error('Contract not found') }
          let a: ContractAnalysisType | null = null
          if (c.analysis_status === 'completed') {
            a = await ContractService.getContractAnalysis(contractId)
          }
          return { contract: c, analysis: a }
        } catch (e) {
          return { error: e }
        }
      })()
      const result = await Promise.race([fetchPromise, timeoutPromise])
      if ('timedOut' in result) {
        setIsLoading(false)
        return
      }
      if ('error' in result && result.error) {
        setError('Failed to load contract data')
        setIsLoading(false)
        return
      }
      const finalContract = (result as any).contract as Contract
      const finalAnalysis = (result as any).analysis as ContractAnalysisType | null
      setContract(finalContract)
      writeCachedContract(contractId, finalContract)
      if (finalAnalysis) {
        setAnalysis(finalAnalysis)
        writeCachedAnalysis(contractId, finalAnalysis)
      }
      setIsLoading(false)
    }
    loadContractData()
  }, [contractId])

  const handleChatWithAI = () => {
    if (contractId) {
      navigate(`/chat/${contractId}`)
    }
  }

  const getRiskLevelDisplay = (riskLevel: string, _riskScore?: number) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return { color: 'text-red-700', label: 'Critical Risk' }
      case 'high':
        return { color: 'text-red-600', label: 'High Risk' }
      case 'medium':
        return { color: 'text-yellow-600', label: 'Medium Risk' }
      case 'low':
        return { color: 'text-green-600', label: 'Low Risk' }
      default:
        return { color: 'text-gray-600', label: riskLevel }
    }
  }

  const handleDownloadReport = () => {
    if (contractId) {
      ContractService.downloadAnalysisReport(contractId)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Contract</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-4">The requested contract could not be found.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contract Analysis</h1>
            <p className="text-gray-600">Contract: {contract.title}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Not Available</h2>
            <p className="text-gray-600 mb-6">This contract has not been analyzed yet.</p>
            <Button onClick={() => navigate(`/upload/${contract.id}`)}>
              Start Analysis
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        <ContractAnalysisResults 
          contract={contract}
          analysis={analysis}
          getRiskLevelDisplay={getRiskLevelDisplay}
          onChatWithAI={handleChatWithAI}
          onDownloadReport={handleDownloadReport}
        />
      </div>
    </div>
  )
}

export default ContractAnalysis