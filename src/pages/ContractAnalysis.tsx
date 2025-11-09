import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Upload, FileText, AlertTriangle, Clock, MessageCircle, ArrowLeft, Download, Loader2, CheckCircle, XCircle, AlertCircle, Info, ChevronDown, ChevronRight, Users, FileCheck, Briefcase, CreditCard, Calendar, Shield, Lock, Scale, Gavel, FileSignature, PenTool } from 'lucide-react'
import { ContractService, Contract, ContractAnalysis as ContractAnalysisType } from '@/lib/contractService'


import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SectionAnalysis, RedFlag, CheckItem } from '@/types/contractAnalysis'

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

// Type guard to check if an object is a SectionAnalysis
const isSectionAnalysis = (obj: unknown): obj is SectionAnalysis => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'sectionName' in obj &&
    typeof (obj as any).sectionName === 'string'
  )
}

const ContractAnalysisResults: React.FC<ContractAnalysisResultsProps> = ({
  contract,
  analysis,
  getRiskLevelDisplay,

  onDownloadReport,
  onChatWithAI
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName)
    } else {
      newExpanded.add(sectionName)
    }
    setExpandedSections(newExpanded)
  }

  // Get sections from analysis data with proper typing
  const sections = analysis.analysis_data?.sections || {}
  const sectionsArray: SectionAnalysis[] = Object.values(sections).filter(isSectionAnalysis)

  return (
    <div className="space-y-8">
      {/* Executive Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{contract.title}</CardTitle>
              <CardDescription className="text-lg">
                Uploaded on {new Date(contract.created_at).toLocaleDateString()} • {contract.file_size ? `${Math.round(contract.file_size / 1024)} KB` : ''}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              {(() => {
                const riskScore = analysis.risk_score ?? 0
                const riskLevel = analysis.analysis_data?.overallRiskLevel || ''
                const display = getRiskLevelDisplay(riskLevel, riskScore)
                return (
                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${display.color}`}>
                      {display.label}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      Score: {riskScore}/100
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </CardHeader>
        {analysis.analysis_data?.executiveSummary && (
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Executive Summary</h4>
              <p className="text-blue-800">{analysis.analysis_data.executiveSummary}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 11-Section Analysis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Section-by-Section Analysis</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpandedSections(new Set(Object.keys(sections)))}
            >
              Expand All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpandedSections(new Set())}
            >
              Collapse All
            </Button>
          </div>
        </div>

        {sectionsArray.length > 0 ? (
          sectionsArray.map((section: SectionAnalysis, index: number) => {
            // Add defensive checks for section properties
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
                                  ) : check.status === 'Critical' ? (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  )}
                                  <span className={`ml-2 text-xs ${
                                    check.status === 'Pass' ? 'text-green-600' : 
                                    check.status === 'Critical' ? 'text-red-600' : 'text-yellow-600'
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

      {/* Critical Issues */}
      {analysis.analysis_data?.criticalIssues && analysis.analysis_data.criticalIssues.length > 0 && (
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

      {/* Missing Clauses */}
      {analysis.analysis_data?.missingClauses && analysis.analysis_data.missingClauses.length > 0 && (
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

      {/* Overall Recommendations */}
      {analysis.analysis_data?.overallRecommendations && analysis.analysis_data.overallRecommendations.length > 0 && (
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

      {/* Action Buttons */}
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
  
  useEffect(() => {
    const loadContractData = async () => {
      if (!contractId) {
        setError('No contract ID provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const contractData = await ContractService.getContract(contractId)
        if (!contractData) {
          setError('Contract not found')
          return
        }

        setContract(contractData)

        // Load analysis if contract is completed
        if (contractData.analysis_status === 'completed') {
          const analysisData = await ContractService.getContractAnalysis(contractId)
          setAnalysis(analysisData)
        }
      } catch (err) {
        console.error('Error loading contract:', err)
        setError('Failed to load contract data')
      } finally {
        setIsLoading(false)
      }
    }

    loadContractData()
  }, [contractId])

  const handleChatWithAI = () => {
    if (contractId) {
      navigate(`/chat/${contractId}`)
    } else {
      navigate('/chat')
    }
  }

  const handleDownloadReport = () => {
    // Simulate download
    alert('Report download would start here')
  }



  // Helper function to get risk level display
  const getRiskLevelDisplay = (riskLevel: string, riskScore: number) => {
    if (riskLevel?.includes('Critical') || riskScore >= 85) {
      return { color: 'bg-red-100 text-red-800', label: 'Critical Risk' }
    } else if (riskLevel?.includes('High') || riskScore >= 70) {
      return { color: 'bg-orange-100 text-orange-800', label: 'High Risk' }
    } else if (riskLevel?.includes('Medium') || riskScore >= 40) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk' }
    } else {
      return { color: 'bg-green-100 text-green-800', label: 'Low Risk' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-lg text-gray-600">Loading contract analysis...</span>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Contract</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="mb-8">
          <h1 className="font-space-grotesk text-3xl font-bold text-black mb-2">
            {contract ? contract.title : 'Contract Analysis'}
          </h1>
          <p className="text-gray-600">
            {contract 
              ? `Uploaded on ${new Date(contract.created_at).toLocaleDateString()}`
              : 'Upload your contract for instant AI-powered analysis and insights.'
            }
          </p>
        </div>

        {!contract && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Upload Contract</CardTitle>
                <CardDescription>
                  Select a PDF or DOCX file to begin analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-lg font-medium mb-2">Drop your contract here</h3>
                  <p className="text-gray-600 mb-6">
                    or click to browse your files
                  </p>
                  <Button onClick={() => navigate('/dashboard')} size="lg">
                    Go to Dashboard
                  </Button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supports PDF, DOCX files up to 10MB
                  </p>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">1. Upload</h4>
                    <p className="text-sm text-gray-600">Select your contract file</p>
                  </div>
                  <div className="p-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">2. Analyze</h4>
                    <p className="text-sm text-gray-600">AI processes in ~30 seconds</p>
                  </div>
                  <div className="p-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">3. Review</h4>
                    <p className="text-sm text-gray-600">Get insights &amp; chat with AI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {contract && contract.analysis_status === 'processing' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
                <h3 className="text-xl font-medium mb-2">Analyzing Contract...</h3>
                <p className="text-gray-600 mb-4">
                  Our AI is reading through your contract and identifying key clauses, risks, and opportunities.
                </p>
                <div className="bg-gray-100 rounded-full h-2 max-w-xs mx-auto">
                  <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Usually takes 20-40 seconds</p>
              </CardContent>
            </Card>
          </div>
        )}

        {contract && contract.analysis_status === 'completed' && analysis && (
          <ErrorBoundary>
            <ContractAnalysisResults 
              contract={contract}
              analysis={analysis}
              getRiskLevelDisplay={getRiskLevelDisplay}

              onDownloadReport={handleDownloadReport}
              onChatWithAI={handleChatWithAI}
            />
          </ErrorBoundary>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ContractAnalysis