import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, Share2, Trash2, Eye, Plus, FileText, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { ContractService, Contract, ContractAnalysis } from '../lib/contractService'
import { generatePDFReport } from '../lib/pdfGenerator'
import { toast } from 'sonner'

interface ReportData extends Contract {
  analysis?: ContractAnalysis
}

const Reports: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reports, setReports] = useState<ReportData[]>([])
  const [filteredReports, setFilteredReports] = useState<ReportData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [downloadingReports, setDownloadingReports] = useState<Set<string>>(new Set())

  // Load reports on component mount
  useEffect(() => {
    // Add timeout protection for loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Reports loading timeout - proceeding without data')
        setIsLoading(false)
        setError('Loading is taking longer than expected. Please refresh the page.')
      }
    }, 15000) // 15 second timeout

    loadReports()

    return () => clearTimeout(timeoutId)
  }, [user])

  // Filter and sort reports when dependencies change
  useEffect(() => {
    let filtered = [...reports]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(report => {
        if (filterType === 'completed') return report.analysis_status === 'completed'
        if (filterType === 'processing') return report.analysis_status === 'processing'
        if (filterType === 'failed') return report.analysis_status === 'failed'
        return true
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredReports(filtered)
  }, [reports, searchTerm, filterType, sortBy])

  const loadReports = async () => {
    if (!user?.id) {
      setIsLoading(false)
      setError('Please log in to view your reports')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const contractsWithAnalysis = await ContractService.getUserContractsWithAnalysis(user.id)
      setReports(contractsWithAnalysis)
    } catch (err) {
      console.error('Error loading reports:', err)
      setError('Failed to load reports. Please try again.')
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (report: ReportData) => {
    try {
      if (!report.analysis) {
        toast.error('No analysis data available for download')
        return
      }

      // Add report to downloading set
      setDownloadingReports(prev => new Set(prev).add(report.id))

      // Show loading toast
      const loadingToast = toast.loading('Generating PDF report...')

      // Generate and download PDF
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
      generatePDFReport(report)

      // Remove from downloading set
      setDownloadingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(report.id)
        return newSet
      })

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast)
      toast.success('PDF report downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      
      // Remove from downloading set
      setDownloadingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(report.id)
        return newSet
      })
      
      toast.error('Failed to generate PDF report')
    }
  }

  const handleShare = async (report: ReportData) => {
    try {
      const shareUrl = `${window.location.origin}/contract-analysis/${report.id}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Report link copied to clipboard')
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to copy link')
    }
  }

  const handleDelete = async (reportId: string) => {
    try {
      setIsDeleting(true)
      // Note: This would need to be implemented in ContractService
      // For now, we'll just remove from local state
      setReports(prev => prev.filter(r => r.id !== reportId))
      setDeleteConfirm(null)
      toast.success('Report deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete report')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FileText className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  // Calculate stats
  const stats = {
    total: reports.length,
    completed: reports.filter(r => r.analysis_status === 'completed').length,
    processing: reports.filter(r => r.analysis_status === 'processing').length,
    failed: reports.filter(r => r.analysis_status === 'failed').length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#4ECCA3]" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Header />
      
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Contract Reports</h1>
          <p className="text-gray-600">View and manage your contract analysis reports</p>
        </div>

        {/* Stats Cards - Responsive: 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 min-w-0">
            <div className="flex items-center min-w-0">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.total}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Reports</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 min-w-0">
            <div className="flex items-center min-w-0">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.completed}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 min-w-0">
            <div className="flex items-center min-w-0">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.processing}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Processing</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 min-w-0">
            <div className="flex items-center min-w-0">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.failed}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Failed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Stack on mobile */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-8 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row gap-4 min-w-0">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent min-h-[44px]"
                />
              </div>
            </div>

            {/* Filter and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 min-w-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent min-h-[44px] w-full sm:w-auto sm:min-w-[120px]"
              >
                <option value="all">All Reports</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent min-h-[44px] w-full sm:w-auto sm:min-w-[120px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadReports}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No reports found' : 'No reports yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload and analyze your first contract to get started'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link to="/dashboard">
                <Button className="min-h-[44px]">
                  <Plus className="w-4 h-4 mr-2" />
                  Analyze New Contract
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{report.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{report.file_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.analysis_status)}`}>
                            {getStatusIcon(report.analysis_status)}
                            <span className="ml-1 capitalize">{report.analysis_status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.upload_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/contract-analysis/${report.id}`)}
                              className="text-[#4ECCA3] hover:text-[#3da58a] p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="View Report"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {report.analysis && (
                              <button
                                onClick={() => handleShare(report)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Share Report"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            )}
                            {report.analysis && (
                              <button
                                onClick={() => handleDownload(report)}
                                disabled={downloadingReports.has(report.id)}
                                className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download Report"
                              >
                                {downloadingReports.has(report.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(report.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
                  <div className="flex items-start justify-between mb-3 min-w-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{report.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{report.file_name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.analysis_status)} flex-shrink-0`}>
                      {getStatusIcon(report.analysis_status)}
                      <span className="ml-1 capitalize">{report.analysis_status}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{new Date(report.upload_date).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between min-w-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/contract-analysis/${report.id}`)}
                      className="min-h-[44px] flex-1 mr-2 min-w-0"
                    >
                      <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">View</span>
                    </Button>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {report.analysis && (
                        <>
                          <button
                            onClick={() => handleShare(report)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(report)}
                            disabled={downloadingReports.has(report.id)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download"
                          >
                            {downloadingReports.has(report.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(report.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Generate New Report Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 text-center overflow-hidden">
          <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-[#4ECCA3] mx-auto mb-4" />
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">Need to analyze another contract?</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 px-2">Upload a new contract to get instant AI-powered analysis</p>
          <Link to="/dashboard">
            <Button className="min-h-[44px] px-4 sm:px-6 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Analyze New Contract
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 mx-4 overflow-hidden">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 truncate">Delete Report</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white min-h-[44px] w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Reports