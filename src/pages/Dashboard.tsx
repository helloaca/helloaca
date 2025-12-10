import React, { useState, useRef, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Upload, FileText, Clock, TrendingUp, Plus, AlertCircle, CheckCircle, Loader2, MessageCircle, Download, Shield, Star, LayoutDashboard, Folder, Users, BarChart3, CreditCard, GitCompare, FileSpreadsheet, BadgeCheck, Activity, Key, Plug, List, ShieldCheck, Fingerprint, Sliders } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Contract } from '@/lib/contractService'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { trackContracts } from '@/lib/analytics'
import { getUserCredits, consumeUserCredit, markContractCredited, getMonthlyFreeUsage, canUseFreeAnalysis, markFreeAnalysisUsed } from '@/lib/utils'
const ContractHistoryModal = React.lazy(() => import('@/components/ContractHistoryModal'))
import Modal from '@/components/ui/Modal'

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
  const [creditsCount, setCreditsCount] = useState(0)
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [freeEligible, setFreeEligible] = useState(false)

  // Contract history modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  type Section = 'dashboard'|'contracts'|'team'|'library'|'analytics'|'billing'|'approvals'|'versions'|'templates'|'branding'|'advanced_analytics'|'user_mgmt'|'api_keys'|'integrations'|'audit_log'|'sso'|'risk_framework'
  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  const [folders, setFolders] = useState<string[]>([])
  const [contractFolderMap, setContractFolderMap] = useState<Record<string, string>>({})
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [newFolderName, setNewFolderName] = useState('')
  const getFolderKey = () => `contract_folders_${user?.id || 'anon'}`
  const getMapKey = () => `contract_folder_map_${user?.id || 'anon'}`

  type ContractTemplate = { id: string, name: string, description?: string, content: string, created_at: string, updated_at: string }
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState<{ name: string, description: string, content: string }>({ name: '', description: '', content: '' })
  const getTemplatesKey = () => `contract_templates_${user?.id || 'anon'}`
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  const getCacheKey = () => `contracts_cache_${user?.id || 'anon'}`
  const readCachedContracts = (): Array<Contract & { analysis?: any }> => {
    try {
      const raw = localStorage.getItem(getCacheKey())
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }
  const writeCachedContracts = (items: Array<Contract & { analysis?: any }>) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(items))
    } catch { void 0 }
  }

  const writeFolderState = (fs: string[], map: Record<string, string>) => {
    try {
      localStorage.setItem(getFolderKey(), JSON.stringify(fs))
      localStorage.setItem(getMapKey(), JSON.stringify(map))
    } catch { void 0 }
  }

  const loadFolderState = () => {
    try {
      const rawFolders = localStorage.getItem(getFolderKey())
      const rawMap = localStorage.getItem(getMapKey())
      const fs = rawFolders ? JSON.parse(rawFolders) as string[] : []
      const mp = rawMap ? JSON.parse(rawMap) as Record<string, string> : {}
      setFolders(fs)
      setContractFolderMap(mp)
    } catch {
      setFolders([])
      setContractFolderMap({})
    }
  }

  const loadTemplates = () => {
    try {
      const raw = localStorage.getItem(getTemplatesKey())
      const list = raw ? JSON.parse(raw) as ContractTemplate[] : []
      setTemplates(list)
    } catch {
      setTemplates([])
    }
  }

  const writeTemplates = (list: ContractTemplate[]) => {
    try {
      localStorage.setItem(getTemplatesKey(), JSON.stringify(list))
    } catch { void 0 }
  }

  const openCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({ name: '', description: '', content: '' })
    setIsTemplateModalOpen(true)
  }

  const openEditTemplate = (t: ContractTemplate) => {
    setEditingTemplate(t)
    setTemplateForm({ name: t.name, description: t.description || '', content: t.content })
    setIsTemplateModalOpen(true)
  }

  const saveTemplate = () => {
    const name = templateForm.name.trim()
    const content = templateForm.content.trim()
    const description = templateForm.description.trim()
    if (!name || !content) {
      toast.error('Name and content are required')
      return
    }
    const now = new Date().toISOString()
    let list = [...templates]
    if (editingTemplate) {
      list = list.map(t => t.id === editingTemplate.id ? { ...t, name, description, content, updated_at: now } : t)
    } else {
      const id = `tpl_${Date.now()}`
      list.unshift({ id, name, description, content, created_at: now, updated_at: now })
    }
    setTemplates(list)
    writeTemplates(list)
    setIsTemplateModalOpen(false)
    setEditingTemplate(null)
  }

  const deleteTemplate = (id: string) => {
    const list = templates.filter(t => t.id !== id)
    setTemplates(list)
    writeTemplates(list)
  }

  const useTemplate = async (t: ContractTemplate) => {
    if (!user?.id) return
    try {
      const { ContractService } = await import('@/lib/contractService')
      const res = await ContractService.createContractFromTemplate(user.id, { name: t.name, content: t.content })
      toast.success('Contract created from template')
      loadUserContracts()
      navigate(`/analyze/${res.contractId}`)
    } catch {
      toast.error('Failed to use template')
    }
  }

  const handleInviteUsersClick = () => {
    if (isTeamPlan || isBusinessPlan || isEnterprisePlan) {
      setActiveSection('team')
      return
    }
    setIsUpgradeModalOpen(true)
  }

  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    if (folders.includes(name)) { setNewFolderName(''); return }
    const next = [...folders, name]
    setFolders(next)
    writeFolderState(next, contractFolderMap)
    setNewFolderName('')
    setSelectedFolder(name)
  }

  const handleDeleteFolder = (name: string) => {
    const nextFolders = folders.filter(f => f !== name)
    const nextMap: Record<string, string> = {}
    Object.entries(contractFolderMap).forEach(([cid, fname]) => {
      if (fname !== name) nextMap[cid] = fname
    })
    setFolders(nextFolders)
    setContractFolderMap(nextMap)
    writeFolderState(nextFolders, nextMap)
    setSelectedFolder('all')
  }

  const handleAssignContractFolder = (contractId: string, name: string) => {
    const next = { ...contractFolderMap }
    if (name === '' || name === 'uncategorized') {
      delete next[contractId]
    } else {
      next[contractId] = name
    }
    setContractFolderMap(next)
    writeFolderState(folders, next)
  }

  // Load user contracts on component mount or when user changes
  useEffect(() => {
    if (user?.id && !authLoading) {
      setCreditsCount(getUserCredits(user.id))
      const cached = readCachedContracts()
      if (cached && cached.length > 0) {
        setContracts(cached)
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        const thisMonthContracts = cached.filter(c => {
          const d = new Date(c.created_at)
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear
        })
        let totalRisks = 0
        cached.forEach(contract => {
          const sections = contract.analysis?.analysis_data?.sections
          if (sections) {
            const count = Object.values(sections).reduce((acc: number, section: any) => acc + (section.keyFindings?.length || 0), 0)
            totalRisks += count
          }
        })
        setStats({ totalContracts: cached.length, thisMonth: thisMonthContracts.length, avgAnalysisTime: '32s', risksSaved: totalRisks })
      }
      ;(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            await new Promise(r => setTimeout(r, 500))
          }
        } catch {}
        await loadUserContracts()
      })()
      loadFolderState()
      loadTemplates()
    }
  }, [user?.id, authLoading])

  const loadUserContracts = async (retryCount = 0) => {
    const maxRetries = 2
    const baseDelay = 1000 // 1 second base delay
    
    try {
      setIsLoadingContracts(true)
      
      console.log(`Starting contract load for user: ${user?.id} (retry: ${retryCount})`)
      
      const timeoutMs = 12000
      const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), timeoutMs))
      console.log('Loading contracts for user:', user?.id)
      
      // Try to load contracts with better error handling
      let userContracts: Array<Contract & { analysis?: any }> = []
      const fetchPromise = (async () => {
        try {
          const { ContractService } = await import('@/lib/contractService')
          const full = await ContractService.getUserContractsWithAnalysis(user!.id)
          return { data: full }
        } catch (serviceError) {
          console.error('ContractService error:', serviceError)
          try {
            const { ContractService } = await import('@/lib/contractService')
            const basic = await ContractService.getUserContracts(user!.id)
            return { data: basic.map(c => ({ ...c, analysis: undefined })) }
          } catch (fallbackError) {
            console.error('Fallback loading also failed:', fallbackError)
            return { error: fallbackError }
          }
        }
      })()

      const result = await Promise.race([fetchPromise, timeoutPromise])
      if ('timedOut' in result) {
        console.warn(`Contract loading timeout after ${timeoutMs/1000}s on retry ${retryCount} - using cache if available`)
        const cached = readCachedContracts()
        if (cached && cached.length > 0) {
          setContracts(cached)
        }
        setIsLoadingContracts(false)
        return
      }

      if (result && 'data' in result && Array.isArray(result.data)) {
        userContracts = result.data
      } else {
        throw (result as any).error || new Error('Failed to load contracts')
      }
      
      setContracts(userContracts)
      writeCachedContracts(userContracts)
      
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
  const handleFileSelect = async (file: File, skipCreditsModal?: boolean) => {
    if (!user?.id) {
      setUploadStatus('error')
      setUploadMessage('User not authenticated')
      return
    }

    const { FileProcessor } = await import('@/lib/fileProcessor')
    const validation = FileProcessor.validateFile(file)
    
    if (!validation.isValid) {
      setUploadStatus('error')
      setUploadMessage(validation.message)
      setSelectedFile(null)
      return
    }

    // Usage-based gating
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const thisMonthUsage = contracts.filter(c => {
      const d = new Date(c.created_at)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length
    const freeLimit = 1
    const credits = getUserCredits(user.id)
    const freeLedgerUsage = getMonthlyFreeUsage(user.id)
    const freeAvailable = (thisMonthUsage < freeLimit) && (freeLedgerUsage < freeLimit) && canUseFreeAnalysis(user.id, freeLimit)
    if (!skipCreditsModal && credits <= 0) {
      setFreeEligible(freeAvailable)
      setPendingFile(file)
      setIsCreditsModalOpen(true)
      return
    }
    const requiresCredit = credits > 0 ? true : !freeAvailable

    setSelectedFile(file)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setProgressStage('Starting upload...')

    try {
      const { ContractService } = await import('@/lib/contractService')
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
      if (requiresCredit) {
        consumeUserCredit(user.id)
        markContractCredited(user.id, result.contractId)
        try {
          const { ContractService } = await import('@/lib/contractService')
          await ContractService.markContractPaid(result.contractId, user.id)
        } catch { /* noop */ }
        setCreditsCount(getUserCredits(user.id))
      } else {
        markFreeAnalysisUsed(user.id)
      }
      
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
    
    if (contract.analysis?.analysis_data?.executive_summary?.summary) {
      const fullSummary = contract.analysis.analysis_data.executive_summary.summary
      console.log('✅ Found summary at root level:', fullSummary.substring(0, 100) + '...')
      // Extract first sentence or first 100 characters
      const firstSentence = fullSummary.split('.')[0] + '.'
      return firstSentence.length > 100 ? fullSummary.substring(0, 100) + '...' : firstSentence
    }

    if (contract.analysis?.analysis_data?.summary) {
      const fullSummary = contract.analysis.analysis_data.summary
      console.log('✅ Found legacy summary at root:', fullSummary.substring(0, 100) + '...')
      const firstSentence = fullSummary.split('.')[0] + '.'
      return firstSentence.length > 100 ? fullSummary.substring(0, 100) + '...' : firstSentence
    }

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

  const getDisplayTitle = (title: string): string => {
    const max = 40
    if (!title) return ''
    return title.length > max ? `${title.slice(0, max)}...` : title
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
      <React.Suspense fallback={null}>
        <ContractHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          contracts={contracts}
          onContractsUpdate={loadUserContracts}
          userId={user?.id || ''}
        />
      </React.Suspense>
    </div>
  )
}

  const isTeamPlan = ['team','business','enterprise'].includes(String(profile?.plan || user?.plan || 'free'))
  const isBusinessPlan = ['business','enterprise'].includes(String(profile?.plan || user?.plan || 'free'))
  const isEnterprisePlan = ['enterprise'].includes(String(profile?.plan || user?.plan || 'free'))

  if (isTeamPlan) {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const monthContracts = contracts.filter(c => {
      const d = new Date(c.created_at)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    const attention = contracts.filter(c => {
      const score = (c.analysis?.analysis_data?.executive_summary?.key_metrics?.risk_score ?? c.analysis?.analysis_data?.risk_assessment?.overall_score ?? 0)
      return score >= 60
    }).slice(0, 5)
    const riskLevels = ['Critical','High','Medium','Low']
    const riskSummaryCounts = riskLevels.reduce((acc: Record<string, number>, lvl) => ({ ...acc, [lvl]: 0 }), {})
    contracts.forEach(c => {
      const score = (c.analysis?.analysis_data?.executive_summary?.key_metrics?.risk_score ?? c.analysis?.analysis_data?.risk_assessment?.overall_score ?? 0)
      let lvl = 'Low'
      if (score >= 80) lvl = 'Critical'; else if (score >= 60) lvl = 'High'; else if (score >= 40) lvl = 'Medium'
      riskSummaryCounts[lvl] = (riskSummaryCounts[lvl] || 0) + 1
    })

    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAuth={true} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
          <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-12 md:col-span-4 lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="font-space-grotesk font-bold text-black mb-4">Team Workspace</div>
                <nav className="space-y-2">
                  <button onClick={() => setActiveSection('dashboard')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='dashboard'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><LayoutDashboard className="w-4 h-4" />Dashboard</button>
                  <button onClick={() => setActiveSection('contracts')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='contracts'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Folder className="w-4 h-4" />Contracts</button>
                  <button onClick={() => setActiveSection('team')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='team'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Users className="w-4 h-4" />Team members</button>
                  <button onClick={() => setActiveSection('library')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='library'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Folder className="w-4 h-4" />Library</button>
                  <button onClick={() => setActiveSection('analytics')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='analytics'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><BarChart3 className="w-4 h-4" />Analytics</button>
                  <button onClick={() => setActiveSection('billing')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='billing'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><CreditCard className="w-4 h-4" />Billing</button>
                  {isBusinessPlan && (
                    <>
                      <button onClick={() => setActiveSection('approvals')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='approvals'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Shield className="w-4 h-4" />Approval workflows</button>
                      <button onClick={() => setActiveSection('versions')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='versions'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><GitCompare className="w-4 h-4" />Version comparison</button>
                      <button onClick={() => setActiveSection('templates')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='templates'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><FileSpreadsheet className="w-4 h-4" />Templates</button>
                      <button onClick={() => setActiveSection('branding')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='branding'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><BadgeCheck className="w-4 h-4" />White‑label exports</button>
                      <button onClick={() => setActiveSection('advanced_analytics')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='advanced_analytics'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Activity className="w-4 h-4" />Advanced analytics</button>
                    </>
                  )}
                  {isEnterprisePlan && (
                    <>
                      <button onClick={() => setActiveSection('user_mgmt')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='user_mgmt'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><ShieldCheck className="w-4 h-4" />User management</button>
                      <button onClick={() => setActiveSection('api_keys')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='api_keys'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Key className="w-4 h-4" />API keys</button>
                      <button onClick={() => setActiveSection('integrations')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='integrations'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Plug className="w-4 h-4" />Integrations</button>
                      <button onClick={() => setActiveSection('audit_log')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='audit_log'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><List className="w-4 h-4" />Audit log</button>
                      <button onClick={() => setActiveSection('sso')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='sso'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Fingerprint className="w-4 h-4" />SSO settings</button>
                      <button onClick={() => setActiveSection('risk_framework')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${activeSection==='risk_framework'?'bg-gray-900 text-white':'text-gray-800 hover:bg-gray-100'}`}><Sliders className="w-4 h-4" />Custom risk framework</button>
                    </>
                  )}
                </nav>
              </div>
            </aside>

            <main className="col-span-12 md:col-span-8 lg:col-span-9">
              {activeSection === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="font-space-grotesk text-2xl sm:text-3xl font-bold text-black">{isEnterprisePlan ? 'Enterprise Dashboard' : isBusinessPlan ? 'Business Dashboard' : 'Team Dashboard'}</h1>
                      <p className="text-gray-600">Overview across the team</p>
                    </div>
                    <button onClick={handleInviteUsersClick} className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Invite users</button>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card><CardContent className="pt-4"><div className="flex items-center"><FileText className="w-6 h-6 text-primary" /><div className="ml-3"><p className="text-2xl font-bold">{monthContracts.length}</p><p className="text-sm text-gray-600">Contracts this month</p></div></div></CardContent></Card>
                    <Card><CardContent className="pt-4"><div className="flex items-center"><AlertCircle className="w-6 h-6 text-red-500" /><div className="ml-3"><p className="text-2xl font-bold">{attention.length}</p><p className="text-sm text-gray-600">Needs attention</p></div></div></CardContent></Card>
                    <Card><CardContent className="pt-4"><div className="flex items-center"><BarChart3 className="w-6 h-6 text-blue-600" /><div className="ml-3"><p className="text-2xl font-bold">{stats.totalContracts}</p><p className="text-sm text-gray-600">Total contracts</p></div></div></CardContent></Card>
                    <Card><CardContent className="pt-4"><div className="flex items-center"><Users className="w-6 h-6 text-green-600" /><div className="ml-3"><p className="text-2xl font-bold">1</p><p className="text-sm text-gray-600">Members</p></div></div></CardContent></Card>
                  </div>
                  {isEnterprisePlan && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader><CardTitle>Compliance status</CardTitle><CardDescription>Risk thresholds</CardDescription></CardHeader>
                        <CardContent>
                          {(() => {
                            const compliant = contracts.filter(c => {
                              const s = (c.analysis?.analysis_data?.executive_summary?.key_metrics?.risk_score ?? c.analysis?.analysis_data?.risk_assessment?.overall_score ?? 0)
                              return s < 40
                            }).length
                            const total = contracts.length || 1
                            const pct = Math.round((compliant/total)*100)
                            return <p className="text-gray-900"><span className="text-2xl font-bold">{pct}%</span> compliant • {compliant}/{total}</p>
                          })()}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Integration health</CardTitle><CardDescription>Slack • Drive • DocuSign</CardDescription></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Plug className="w-4 h-4 text-[#5ACEA8]" /><span>Slack</span></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Not connected</span></div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Plug className="w-4 h-4 text-[#5ACEA8]" /><span>Google Drive</span></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Not connected</span></div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Plug className="w-4 h-4 text-[#5ACEA8]" /><span>DocuSign</span></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Not connected</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {isBusinessPlan && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader><CardTitle>Contracts needing approval</CardTitle><CardDescription>Pending review</CardDescription></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {attention.map(c => (
                              <div key={c.id} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{getDisplayTitle(c.file_name || c.title)}</p>
                                  <p className="text-sm text-gray-600">Uploaded {new Date(c.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="min-w-[112px] bg-gray-900 text-white" onClick={() => handleContractView(c.id)}>Approve</Button>
                                  <Button size="sm" variant="outline" className="min-w-[112px]" onClick={() => handleContractView(c.id)}>Request</Button>
                                </div>
                              </div>
                            ))}
                            {attention.length === 0 && <p className="text-gray-600">None pending.</p>}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Bottlenecks</CardTitle><CardDescription>Slow reviewers</CardDescription></CardHeader>
                        <CardContent>
                          <p className="text-gray-600">Reviewer stats appear as the team grows.</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Top risks</CardTitle><CardDescription>Across all contracts</CardDescription></CardHeader>
                        <CardContent>
                          {(['Critical','High','Medium','Low'] as const).map(l => {
                            const count = riskSummaryCounts[l] || 0
                            const total = contracts.length || 1
                            const pct = Math.round((count/total)*100)
                            return (
                              <div key={`top-${l}`} className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">{l}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-40 bg-gray-200 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${l==='Critical'?'bg-red-500':l==='High'?'bg-orange-500':l==='Medium'?'bg-yellow-500':'bg-green-500'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-sm text-gray-600 w-10 text-right">{count}</span>
                                </div>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Month comparison</CardTitle><CardDescription>Trend vs previous</CardDescription></CardHeader>
                        <CardContent>
                          {(() => {
                            const prevMonth = (thisMonth - 1 + 12) % 12
                            const prevYear = prevMonth === 11 ? thisYear - 1 : thisYear
                            const prevCount = contracts.filter(c => {
                              const d = new Date(c.created_at)
                              return d.getMonth() === prevMonth && d.getFullYear() === prevYear
                            }).length
                            const diff = monthContracts.length - prevCount
                            const sign = diff >= 0 ? '+' : ''
                            return <p className="text-gray-900"><span className="text-2xl font-bold">{monthContracts.length}</span> this month • {sign}{diff} vs last month</p>
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle>Team activity</CardTitle><CardDescription>Recent uploads</CardDescription></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {contracts.slice(0,6).map(c => (
                            <div key={c.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{getDisplayTitle(c.file_name || c.title)}</p>
                                <p className="text-sm text-gray-600">Uploaded by you • {new Date(c.created_at).toLocaleDateString()}</p>
                              </div>
                              <button className="text-[#5ACEA8]" onClick={() => handleContractView(c.id)}>View</button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Risk summary</CardTitle><CardDescription>Across contracts</CardDescription></CardHeader>
                      <CardContent>
                        {(['Critical','High','Medium','Low'] as const).map(l => {
                          const count = riskSummaryCounts[l] || 0
                          const total = contracts.length || 1
                          const pct = Math.round((count/total)*100)
                          return (
                            <div key={l} className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">{l}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-40 bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${l==='Critical'?'bg-red-500':l==='High'?'bg-orange-500':l==='Medium'?'bg-yellow-500':'bg-green-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm text-gray-600 w-10 text-right">{count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader><CardTitle>Contracts requiring attention</CardTitle></CardHeader>
                    <CardContent>
                      {attention.length === 0 ? (
                        <p className="text-gray-600">No high‑risk contracts.</p>
                      ) : (
                        <div className="space-y-3">
                          {attention.map(c => (
                            <div key={c.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{getDisplayTitle(c.file_name || c.title)}</p>
                                <p className="text-sm text-gray-600">Risk score {(c.analysis?.analysis_data?.executive_summary?.key_metrics?.risk_score ?? c.analysis?.analysis_data?.risk_assessment?.overall_score ?? 0)}</p>
                              </div>
                              <button className="text-[#5ACEA8]" onClick={() => handleContractView(c.id)}>Review</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'contracts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Contracts</h2>
                    <button onClick={handleChooseFileClick} className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Upload</button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileInputChange} hidden />
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="divide-y">
                      {contracts.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium text-gray-900">{getDisplayTitle(c.file_name || c.title)}</p>
                            <p className="text-sm text-gray-600">Uploaded by you • {new Date(c.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="text-[#5ACEA8]" onClick={() => handleContractView(c.id)}>Open</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'team' && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Team members</h2>
                      <p className="text-gray-600">Manage seats and invites</p>
                    </div>
                    <button onClick={handleInviteUsersClick} className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Invite users</button>
                  </div>
                  <Card>
                    <CardContent>
                      <p className="text-gray-600">Team management connects seats and shared libraries. Invite users from Settings.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'library' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Shared library</h2>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <button onClick={() => setSelectedFolder('all')} className={`px-3 py-1 rounded-lg text-sm ${selectedFolder==='all'?'bg-gray-900 text-white':'border border-gray-300'}`}>All</button>
                      <button onClick={() => setSelectedFolder('uncategorized')} className={`px-3 py-1 rounded-lg text-sm ${selectedFolder==='uncategorized'?'bg-gray-900 text-white':'border border-gray-300'}`}>Uncategorized</button>
                      {folders.map(f => (
                        <div key={`f-${f}`} className="flex items-center gap-1">
                          <button onClick={() => setSelectedFolder(f)} className={`px-3 py-1 rounded-lg text-sm ${selectedFolder===f?'bg-gray-900 text-white':'border border-gray-300'}`}>{f}</button>
                          <button onClick={() => handleDeleteFolder(f)} className="px-2 py-1 rounded-lg border border-gray-300 text-xs">Delete</button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder" className="px-3 py-2 border rounded-lg text-sm" />
                        <button onClick={handleCreateFolder} className="px-3 py-2 rounded-lg bg-[#5ACEA8] text-white">Create</button>
                      </div>
                    </div>
                    <div className="divide-y">
                      {(() => {
                        const list = selectedFolder==='all'
                          ? contracts
                          : selectedFolder==='uncategorized'
                            ? contracts.filter(c => !contractFolderMap[c.id])
                            : contracts.filter(c => contractFolderMap[c.id] === selectedFolder)
                        return list.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-medium text-gray-900">{getDisplayTitle(c.file_name || c.title)}</p>
                              <p className="text-sm text-gray-600">Last updated {new Date(c.updated_at || c.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <select value={contractFolderMap[c.id] || 'uncategorized'} onChange={e => handleAssignContractFolder(c.id, e.target.value)} className="px-2 py-1 border rounded-lg text-sm">
                                <option value="uncategorized">Uncategorized</option>
                                {folders.map(f => (
                                  <option key={`opt-${f}`} value={f}>{f}</option>
                                ))}
                              </select>
                              <button className="text-[#5ACEA8]" onClick={() => handleContractView(c.id)}>View</button>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'analytics' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Analytics</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card><CardContent className="pt-4"><p className="text-sm text-gray-600">Total contracts</p><p className="text-2xl font-bold">{stats.totalContracts}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-sm text-gray-600">This month</p><p className="text-2xl font-bold">{monthContracts.length}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-sm text-gray-600">High risk</p><p className="text-2xl font-bold">{attention.length}</p></CardContent></Card>
                  </div>
                </div>
              )}

              {isBusinessPlan && activeSection === 'approvals' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Approval workflows</h2>
                  <Card>
                    <CardContent>
                      <div className="space-y-3">
                        {attention.map(c => (
                          <div key={`appr-${c.id}`} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{getDisplayTitle(c.file_name || c.title)}</p>
                              <p className="text-sm text-gray-600">Risk {(c.analysis?.analysis_data?.executive_summary?.key_metrics?.risk_score ?? c.analysis?.analysis_data?.risk_assessment?.overall_score ?? 0)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="min-w-[112px] bg-gray-900 text-white" onClick={() => handleContractView(c.id)}>Approve</Button>
                              <Button size="sm" variant="outline" className="min-w-[112px]" onClick={() => handleContractView(c.id)}>Reject</Button>
                            </div>
                          </div>
                        ))}
                        {attention.length === 0 && <p className="text-gray-600">Nothing pending right now.</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isBusinessPlan && activeSection === 'versions' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Version comparison</h2>
                  <Card>
                    <CardContent>
                      <p className="text-gray-600">Select two contracts to compare differences.</p>
                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <select className="border rounded-lg px-3 py-2">
                          {contracts.map(c => <option key={`v1-${c.id}`} value={c.id}>{getDisplayTitle(c.file_name || c.title)}</option>)}
                        </select>
                        <select className="border rounded-lg px-3 py-2">
                          {contracts.map(c => <option key={`v2-${c.id}`} value={c.id}>{getDisplayTitle(c.file_name || c.title)}</option>)}
                        </select>
                      </div>
                      <div className="mt-4">
                        <button className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Compare</button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isBusinessPlan && activeSection === 'templates' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Templates</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <button className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]" onClick={openCreateTemplate}>Create template</button>
                  </div>
                  {templates.length === 0 ? (
                    <Card>
                      <CardContent>
                        <p className="text-gray-600">No templates yet. Create one to get started.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {templates.map(t => (
                        <Card key={t.id}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{t.name}</span>
                              <span className="text-xs text-gray-500">Updated {new Date(t.updated_at).toLocaleString()}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {t.description && <p className="text-gray-700 mb-3">{t.description}</p>}
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-2 rounded-lg bg-gray-900 text-white" onClick={() => useTemplate(t)}>Use</button>
                              <button className="px-3 py-2 rounded-lg border border-gray-300" onClick={() => openEditTemplate(t)}>Edit</button>
                              <button className="px-3 py-2 rounded-lg border border-red-300 text-red-600" onClick={() => deleteTemplate(t.id)}>Delete</button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplate ? 'Edit template' : 'Create template'} size="lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Name</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Description</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Content</label>
                        <textarea className="w-full border rounded-lg px-3 py-2 h-48" value={templateForm.content} onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white" onClick={saveTemplate}>Save</button>
                        <button className="px-4 py-2 rounded-lg border border-gray-300" onClick={() => setIsTemplateModalOpen(false)}>Cancel</button>
                      </div>
                    </div>
                  </Modal>

                  <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title="Upgrade required" size="md">
                    <div className="space-y-4">
                      <p className="text-gray-700">Inviting team members is available on Team, Business, and Enterprise plans.</p>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white" onClick={() => { setIsUpgradeModalOpen(false); navigate('/pricing') }}>View plans</button>
                        <button className="px-4 py-2 rounded-lg border border-gray-300" onClick={() => setIsUpgradeModalOpen(false)}>Not now</button>
                      </div>
                    </div>
                  </Modal>
                </div>
              )}

              {isBusinessPlan && activeSection === 'branding' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">White‑label exports</h2>
                  <Card>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Brand name</label>
                          <input className="w-full border rounded-lg px-3 py-2" placeholder="Your agency" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Logo URL</label>
                          <input className="w-full border rounded-lg px-3 py-2" placeholder="https://..." />
                        </div>
                      </div>
                      <div className="mt-4">
                        <button className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Apply branding to exports</button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isBusinessPlan && activeSection === 'advanced_analytics' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Advanced analytics</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle>Top risks across contracts</CardTitle></CardHeader>
                      <CardContent>
                        {(['Critical','High','Medium','Low'] as const).map(l => {
                          const count = riskSummaryCounts[l] || 0
                          const total = contracts.length || 1
                          const pct = Math.round((count/total)*100)
                          return (
                            <div key={`adv-${l}`} className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">{l}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-40 bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${l==='Critical'?'bg-red-500':l==='High'?'bg-orange-500':l==='Medium'?'bg-yellow-500':'bg-green-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm text-gray-600 w-10 text-right">{count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Templates usage</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-gray-600">Usage data populates as templates are created.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {isEnterprisePlan && activeSection === 'user_mgmt' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">User management</h2>
                  <Card>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600">
                              <th className="p-2">Role</th>
                              <th className="p-2">Upload</th>
                              <th className="p-2">Review</th>
                              <th className="p-2">Approve</th>
                              <th className="p-2">Billing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {['Admin','Reviewer','Uploader'].map(r => (
                              <tr key={`role-${r}`}> 
                                <td className="p-2 font-medium text-gray-900">{r}</td>
                                {['Upload','Review','Approve','Billing'].map(k => (
                                  <td key={`perm-${r}-${k}`} className="p-2"><input type="checkbox" className="w-4 h-4" defaultChecked={r==='Admin'} disabled={r!=='Admin'} /></td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4"><button onClick={() => navigate('/settings')} className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Manage users</button></div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isEnterprisePlan && activeSection === 'api_keys' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">API keys</h2>
                  <Card>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-gray-900" />
                        <input className="flex-1 border rounded-lg px-3 py-2" value="sk_live_****************" readOnly />
                        <button className="px-3 py-2 rounded-lg border border-gray-300" onClick={() => navigator.clipboard.writeText('sk_live_****************')}>Copy</button>
                        <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">Regenerate</button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isEnterprisePlan && activeSection === 'integrations' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Integrations</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {['Slack','Google Drive','DocuSign'].map(name => (
                      <Card key={`int-${name}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Plug className="w-4 h-4" /><span>{name}</span></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Not connected</span></div>
                          <button onClick={() => navigate('/settings')} className="px-3 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A] w-full">Connect</button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {isEnterprisePlan && activeSection === 'audit_log' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Audit log</h2>
                  <Card>
                    <CardContent>
                      <div className="space-y-2">
                        {contracts.slice(0,10).map(c => (
                          <div key={`audit-${c.id}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><List className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-800">Uploaded {getDisplayTitle(c.file_name || c.title)}</span></div>
                            <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isEnterprisePlan && activeSection === 'sso' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">SSO settings</h2>
                  <Card>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Identity Provider</label>
                          <select className="w-full border rounded-lg px-3 py-2"><option>Okta</option><option>Auth0</option><option>Azure AD</option></select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">SAML metadata URL</label>
                          <input className="w-full border rounded-lg px-3 py-2" placeholder="https://idp.example.com/metadata.xml" />
                        </div>
                      </div>
                      <div className="mt-4"><button className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Save</button></div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isEnterprisePlan && activeSection === 'risk_framework' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Custom risk framework</h2>
                  <Card>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {['Critical','High','Medium','Low'].map(l => (
                          <div key={`rf-${l}`}> 
                            <label className="block text-sm text-gray-700 mb-1">{l} threshold</label>
                            <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue={l==='Critical'?80:l==='High'?60:l==='Medium'?40:20} min={0} max={100} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4"><button className="px-4 py-2 rounded-lg bg-[#5ACEA8] text-white hover:bg-[#49C89A]">Save framework</button></div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Billing</h2>
                  <Card><CardContent><p className="text-gray-600">Plan: {String(profile?.plan || user?.plan)}</p></CardContent></Card>
                </div>
              )}
            </main>
          </div>
        </div>
        <Footer />
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl">Upload New Contract</CardTitle>
                  {user && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      Credits: <span className="font-semibold">{creditsCount}</span>
                    </div>
                  )}
                </div>
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

                  {uploadStatus === 'error' && uploadMessage.toLowerCase().includes('free plan limit') && (
                    <div className="mt-2">
                      <Button 
                        onClick={(e) => { e.stopPropagation(); navigate('/pricing') }}
                        className="min-h-[44px]"
                      >
                        Buy Credits
                      </Button>
                    </div>
                  )}
                  
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
                    Supports PDF, DOCX up to 10MB. Free includes 1 analysis/month.
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
                      <div key={contract.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3 sm:gap-4 overflow-hidden">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{getDisplayTitle(contract.title)}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Uploaded on {new Date(contract.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {getContractSummary(contract)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3 sm:space-x-4 flex-shrink-0 ml-0 sm:ml-4 w-full sm:w-auto mt-2 sm:mt-0">
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
                            className="min-h-[40px] text-xs sm:text-sm flex-shrink-0"
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

      {isCreditsModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { if (!uploadStatus || uploadStatus === 'idle') setIsCreditsModalOpen(false) }}>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No credits available</h3>
            <p className="text-sm text-gray-600 mb-4">Buy credits to unlock full analysis and features, or continue with the free plan.</p>
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Full analysis access with no blurred sections</p>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Extended chat beyond free limit per contract</p>
              </div>
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Unlock all Export Center options (PDF, Word, data)</p>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">Analyze more contracts beyond monthly free</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={() => { setIsCreditsModalOpen(false); navigate('/pricing') }} className="min-h-[44px]">Get Credits</Button>
              <Button variant="outline" disabled={!freeEligible || !pendingFile} onClick={() => { const f = pendingFile; setIsCreditsModalOpen(false); if (f) handleFileSelect(f, true) }} className="min-h-[44px]">
                {freeEligible ? 'Continue Free' : 'Free Used This Month'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
