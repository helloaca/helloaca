import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Upload, FileText, AlertTriangle, Clock, MessageCircle, ArrowLeft, Download, Loader2 } from 'lucide-react'
import { ContractService, Contract, ContractAnalysis as ContractAnalysisType } from '@/lib/contractService'
import { KeyFindings } from '@/components/KeyFindings'
import { ClauseAnalysis } from '@/components/ClauseAnalysis'

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
          <div className="space-y-8">
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
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      analysis.analysis_data?.structuredAnalysis?.overallRiskLevel === 'High Risk Level' ? 'bg-red-100 text-red-800' :
                      analysis.analysis_data?.structuredAnalysis?.overallRiskLevel === 'Medium Risk' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {analysis.analysis_data?.structuredAnalysis?.overallRiskLevel || 
                       ((analysis.risk_score ?? 0) >= 7 ? 'High Risk Level' : (analysis.risk_score ?? 0) >= 4 ? 'Medium Risk' : 'Low Risk')}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Key Findings */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                  <CardDescription>
                    Important risks, opportunities, and obligations identified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KeyFindings 
                    findings={analysis.analysis_data?.structuredAnalysis?.keyFindings || []}
                  />
                </CardContent>
              </Card>

              {/* Clause Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Clause Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of contract clauses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClauseAnalysis 
                    clauses={analysis.analysis_data?.structuredAnalysis?.clauseAnalysis || []}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Button 
                variant="outline" 
                onClick={handleDownloadReport}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button 
                onClick={handleChatWithAI}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with AI
              </Button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ContractAnalysis