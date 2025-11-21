import React, { useState, useRef, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Upload, FileText, Clock, TrendingUp, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ContractService, Contract } from '@/lib/contractService'
import { FileProcessor } from '@/lib/fileProcessor'
import { toast } from 'sonner'
import { trackContracts } from '@/lib/analytics'
import ContractHistoryModal from '@/components/ContractHistoryModal'

const Dashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // File upload state
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Real contract data
  const [contracts, setContracts] = useState<Array<Contract & { analysis?: any }>>([])
  const [isLoadingContracts, setIsLoadingContracts] = useState(false)
  const [stats, setStats] = useState({
    totalContracts: 0,
    thisMonth: 0,
    avgAnalysisTime: '32s',
    risksSaved: 0
  })

  // Contract history modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Load user contracts on component mount or when user changes
  useEffect(() => {
    if (user?.id && !authLoading) {
      loadUserContracts()
    }
  }, [user?.id, authLoading])

  const loadUserContracts = async (retryCount = 0) => {
    const maxRetries = 2
    const baseDelay = 1000 // 1 second base delay
    
    try {
      setIsLoadingContracts(true)
      
      console.log(`Starting contract load for user: ${user?.id} (retry: ${retryCount})`)
      
      // Add timeout protection for contract loading - increased to 30 seconds
      const loadTimeout = setTimeout(() => {
        console.warn(`Contract loading timeout after 30s on retry ${retryCount} - proceeding without contracts`)
        toast.error('Contract loading is taking longer than expected. Retrying...')
      }, 30000) // 30 second timeout - more reasonable for database operations
      
      console.log('Loading contracts for user:', user?.id)
      
      // Try to load contracts with better error handling
      let userContracts: Array<Contract & { analysis?: any }> = []
      
      try {
        userContracts = await ContractService.getUserContractsWithAnalysis(user!.id)
        console.log('Successfully loaded contracts:', userContracts.length)
      } catch (serviceError) {
        console.error('ContractService error:', serviceError)
        
        // Fallback: try loading just the basic contracts without analysis
        try {
          console.log('Falling back to basic contract loading...')
          const basicContracts = await ContractService.getUserContracts(user!.id)
          userContracts = basicContracts.map(contract => ({ ...contract, analysis: undefined }))
          console.log('Loaded basic contracts:', userContracts.length)
        } catch (fallbackError) {
          console.error('Fallback loading also failed:', fallbackError)
          throw fallbackError // Re-throw to be caught by outer catch
        }
      }
      
      clearTimeout(loadTimeout)
      
      setContracts(userContracts)
      
      // Calculate stats
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      
      const thisMonthContracts = userContracts.filter(contract => {
        const contractDate = new Date(contract.created_at)
        return contractDate.getMonth() === thisMonth && contractDate.getFullYear() === thisYear
      })

      // Calculate total risks from all completed contracts
      let totalRisks = 0
      userContracts.forEach(contract => {
        const sections = contract.analysis?.analysis_data?.sections
        if (sections) {
          const count = Object.values(sections).reduce((acc: number, section: any) => acc + (section.keyFindings?.length || 0), 0)
          totalRisks += count
        }
      })

      setStats({
        totalContracts: userContracts.length,
        thisMonth: thisMonthContracts.length,
        avgAnalysisTime: '32s',
        risksSaved: totalRisks
      })
      
      console.log('Contract loading completed successfully')
    } catch (error) {
      console.error('Error loading contracts:', error)
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
        console.log(`Retrying contract loading in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)
        
        toast.error(`Failed to load contracts. Retrying in ${delay/1000}s...`)
        
        setTimeout(() => {
          loadUserContracts(retryCount + 1)
        }, delay)
        
        return // Don't proceed to error state yet
      }
      
      // Final failure after all retries
      console.error('Contract loading failed after all retries')
      toast.error('Failed to load contracts after multiple attempts. Please refresh the page.')
      
      // Don't leave contracts empty on error - show empty state
      setContracts([])
      setStats({
        totalContracts: 0,
        thisMonth: 0,
        avgAnalysisTime: '32s',
        risksSaved: 0
      })
    } finally {
      setIsLoadingContracts(false)
      console.log('Contract loading process completed')
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAuth={true} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
        <Footer />
      
      {/* Contract History Modal */}
      <ContractHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        contracts={contracts}
        onContractsUpdate={loadUserContracts}
        userId={user?.id || ''}
      />
    </div>
  )
}

  // Handle case when user is not available (but auth loading is complete)
  if (!user && !authLoading) {
    // Use a small delay to prevent immediate redirect issues
    setTimeout(() => {
      navigate('/login')
    }, 100)
    return null
  }

  const handleContractView = (contractId: string) => {
    // Track contract view
    trackContracts.view(contractId)
    // Navigate to contract analysis page with the contract ID
    navigate(`/analyze/${contractId}`)
  }

  // Handle file selection and upload
  const handleFileSelect = async (file: File) => {
    if (!user?.id) {
      setUploadStatus('error')
      setUploadMessage('User not authenticated')
      return
    }

    const validation = FileProcessor.validateFile(file)
    
    if (!validation.isValid) {
      setUploadStatus('error')
      setUploadMessage(validation.message)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setProgressStage('Starting upload...')

    try {
      const result = await ContractService.uploadAndAnalyzeContract(
        file,
        user.id,
        (stage: string, progress: number) => {
          setProgressStage(stage)
          setUploadProgress(progress)
        }
      )

      setUploadStatus('success')
      setUploadMessage(`Contract "${file.name}" uploaded and analyzed successfully!`)
      
      // Reload contracts to show the new one
      await loadUserContracts()
      
      // Track successful contract upload
      trackContracts.upload(file.name, file.size)
      
      // Navigate to the analysis page after a short delay
      setTimeout(() => {
        navigate(`/analyze/${result.contractId}`)
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      setSelectedFile(null)
      // Reset status after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadMessage('')
        setUploadProgress(0)
        setProgressStage('')
      }, 5000)
    }
  }

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle drag events
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle click to open file dialog
  const handleChooseFileClick = () => {
    fileInputRef.current?.click()
  }

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Get display name with proper fallback
  const getDisplayName = () => {
    // Priority 1: Profile data (most reliable)
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    
    // Priority 2: User metadata
    if (user?.name) {
      return user.name
    }
    
    // Priority 3: Email fallback
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      // Capitalize first letter and handle common patterns
      return emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._-]/g, ' ')
    }
    
    return 'User'
  }

  // Helper function to get contract summary
  const getContractSummary = (contract: Contract & { analysis?: any }): string => {
    console.log('🔍 Getting summary for contract:', contract.title)
    console.log('📊 Analysis data structure:', {
      hasAnalysis: !!contract.analysis,
      hasAnalysisData: !!contract.analysis?.analysis_data,
      hasDirectSummary: !!contract.analysis?.analysis_data?.summary,
      hasStructuredAnalysis: !!contract.analysis?.analysis_data?.structuredAnalysis,
      hasStructuredSummary: !!contract.analysis?.analysis_data?.structuredAnalysis?.summary
    })
    
    // First check: Look for summary at the root level of analysis_data (correct location)
    if (contract.analysis?.analysis_data?.summary) {
      const fullSummary = contract.analysis.analysis_data.summary
      console.log('✅ Found summary at root level:', fullSummary.substring(0, 100) + '...')
      // Extract first sentence or first 100 characters
      const firstSentence = fullSummary.split('.')[0] + '.'
      return firstSentence.length > 100 ? fullSummary.substring(0, 100) + '...' : firstSentence
    }
    
    // Second check: Look for summary in structuredAnalysis (backward compatibility)
    if (contract.analysis?.analysis_data?.structuredAnalysis?.summary) {
      const fullSummary = contract.analysis.analysis_data.structuredAnalysis.summary
      console.log('✅ Found summary in structuredAnalysis (legacy):', fullSummary.substring(0, 100) + '...')
      // Extract first sentence or first 100 characters
      const firstSentence = fullSummary.split('.')[0] + '.'
      return firstSentence.length > 100 ? fullSummary.substring(0, 100) + '...' : firstSentence
    }
    
    console.log('❌ No summary found in analysis data, using fallback based on title')
    
    // Fallback: try to infer from title
    const title = contract.title.toLowerCase()
    if (title.includes('service') || title.includes('freelance')) {
      return 'Service agreement for professional services.'
    } else if (title.includes('employment') || title.includes('job')) {
      return 'Employment contract with terms and conditions.'
    } else if (title.includes('nda') || title.includes('confidential')) {
      return 'Non-disclosure agreement with confidentiality terms.'
    } else if (title.includes('lease') || title.includes('rental')) {
      return 'Lease agreement for property rental.'
    } else if (title.includes('purchase') || title.includes('sale')) {
      return 'Purchase agreement for goods or services.'
    }
    
    return 'Contract document with standard terms and conditions.'
  }

  // Show loading state only when absolutely necessary
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAuth={true} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
      </div>

      <Footer />
      
      {/* Contract History Modal */}
      <ContractHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        contracts={contracts}
        onContractsUpdate={loadUserContracts}
        userId={user?.id || ''}
      />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAuth={true} />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-space-grotesk text-2xl sm:text-3xl font-bold text-black mb-2">
            {getTimeBasedGreeting()}, {getDisplayName()}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Here's what's happening with your contracts today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalContracts}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xl sm:text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs sm:text-sm text-gray-600">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xl sm:text-2xl font-bold">{stats.avgAnalysisTime}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Avg Analysis Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs sm:text-sm">!</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xl sm:text-2xl font-bold">{stats.risksSaved}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Risks Identified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Upload Widget */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Upload New Contract</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Drag and drop your contract file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer min-h-[120px] sm:min-h-[140px] ${
                    isDragOver 
                      ? 'border-primary bg-primary-50 scale-105' 
                      : uploadStatus === 'error'
                      ? 'border-red-300 bg-red-50'
                      : uploadStatus === 'success'
                      ? 'border-green-300 bg-green-50'
                      : uploadStatus === 'uploading'
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleChooseFileClick}
                >
                  {uploadStatus === 'success' ? (
                    <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500 mx-auto mb-4" />
                  ) : uploadStatus === 'error' ? (
                    <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
                  ) : (
                    <Upload className={`h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
                  )}
                  
                  <p className={`text-sm mb-2 sm:mb-4 ${
                    uploadStatus === 'error' ? 'text-red-600' :
                    uploadStatus === 'success' ? 'text-green-600' :
                    uploadStatus === 'uploading' ? 'text-blue-600' :
                    isDragOver ? 'text-primary' : 'text-gray-600'
                  }`}>
                    {uploadMessage || (isDragOver ? 'Drop your file here!' : 'Drop files here or click to upload')}
                  </p>
                  
                  {uploadStatus === 'uploading' ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary mb-2" />
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">{progressStage}</p>
                    </div>
                  ) : (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleChooseFileClick()
                      }}
                      disabled={false}
                      className={`min-h-[44px] text-sm sm:text-base ${uploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PDF, DOCX up to 10MB
                  </p>
                  
                  {selectedFile && (
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Contracts */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Recent Contracts</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your latest contract analyses and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {isLoadingContracts ? (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary mb-3" />
                      <span className="text-sm sm:text-base text-gray-600 mb-4">Loading contracts...</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadUserContracts()}
                        className="min-h-[36px] text-xs"
                      >
                        Refresh
                      </Button>
                    </div>
                  ) : contracts.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm sm:text-base text-gray-600 mb-2">No contracts uploaded yet</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-4">Upload your first contract to get started</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadUserContracts()}
                        className="min-h-[36px] text-xs"
                      >
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    contracts.slice(0, 5).map((contract) => (
                      <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{contract.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Uploaded on {new Date(contract.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {getContractSummary(contract)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            contract.analysis_status === 'completed' ? 'bg-green-100 text-green-800' :
                            contract.analysis_status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            contract.analysis_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contract.analysis_status === 'completed' ? 'Analyzed' :
                             contract.analysis_status === 'processing' ? 'Processing' :
                             contract.analysis_status === 'failed' ? 'Failed' : 'Pending'}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="min-h-[40px] text-xs sm:text-sm"
                            onClick={() => handleContractView(contract.id)}
                            disabled={contract.analysis_status !== 'completed'}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                  <Button 
                    variant="outline" 
                    className="min-h-[44px] text-sm sm:text-base"
                    onClick={() => setIsHistoryModalOpen(true)}
                  >
                    View All Contracts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Contract History Modal */}
      <ContractHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        contracts={contracts}
        onContractsUpdate={loadUserContracts}
        userId={user?.id || ''}
      />
    </div>
  )
}

export default Dashboard