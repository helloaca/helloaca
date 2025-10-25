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

const Dashboard: React.FC = () => {
  const { user, profile, loading: authLoading, isRehydrating } = useAuth()
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
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoadingContracts, setIsLoadingContracts] = useState(false)
  const [stats, setStats] = useState({
    totalContracts: 0,
    thisMonth: 0,
    avgAnalysisTime: '32s',
    risksSaved: 0
  })

  // Load user contracts on component mount or when user changes
  useEffect(() => {
    if (user?.id && !isRehydrating) {
      loadUserContracts()
    }
  }, [user?.id, isRehydrating])

  const loadUserContracts = async () => {
    try {
      setIsLoadingContracts(true)
      const userContracts = await ContractService.getUserContracts(user!.id)
      setContracts(userContracts)
      
      // Calculate stats
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      
      const thisMonthContracts = userContracts.filter(contract => {
        const contractDate = new Date(contract.created_at)
        return contractDate.getMonth() === thisMonth && contractDate.getFullYear() === thisYear
      })

      setStats({
        totalContracts: userContracts.length,
        thisMonth: thisMonthContracts.length,
        avgAnalysisTime: '32s',
        risksSaved: userContracts.filter(c => c.analysis_status === 'completed').length
      })
    } catch (error) {
      console.error('Error loading contracts:', error)
      toast.error('Failed to load contracts. Please try refreshing the page.')
    } finally {
      setIsLoadingContracts(false)
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAuth={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Show auth check if no user
  if (!user) {
    navigate('/login')
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

  // Show loading state while data is being rehydrated or initially loaded
  if (isLoadingContracts || isRehydrating || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAuth={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAuth={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-space-grotesk text-3xl font-bold text-black mb-2">
            {getTimeBasedGreeting()}, {getDisplayName()}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your contracts today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.totalContracts}</p>
                  <p className="text-sm text-gray-600">Total Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.avgAnalysisTime}</p>
                  <p className="text-sm text-gray-600">Avg Analysis Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">!</span>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.risksSaved}</p>
                  <p className="text-sm text-gray-600">Risks Identified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Widget */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Contract</CardTitle>
                <CardDescription>
                  Drag and drop your contract file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
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
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  ) : uploadStatus === 'error' ? (
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  ) : (
                    <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
                  )}
                  
                  <p className={`text-sm mb-4 ${
                    uploadStatus === 'error' ? 'text-red-600' :
                    uploadStatus === 'success' ? 'text-green-600' :
                    uploadStatus === 'uploading' ? 'text-blue-600' :
                    isDragOver ? 'text-primary' : 'text-gray-600'
                  }`}>
                    {uploadMessage || (isDragOver ? 'Drop your file here!' : 'Drop files here or click to upload')}
                  </p>
                  
                  {uploadStatus === 'uploading' ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
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
                      className={uploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
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
              <CardHeader>
                <CardTitle>Recent Contracts</CardTitle>
                <CardDescription>
                  Your latest contract analyses and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingContracts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-gray-600">Loading contracts...</span>
                    </div>
                  ) : contracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No contracts uploaded yet</p>
                      <p className="text-sm text-gray-500">Upload your first contract to get started</p>
                    </div>
                  ) : (
                    contracts.slice(0, 5).map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{contract.title}</h4>
                            <p className="text-sm text-gray-600">
                              Uploaded on {new Date(contract.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                <div className="mt-6 text-center">
                  <Button variant="outline">
                    View All Contracts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Dashboard