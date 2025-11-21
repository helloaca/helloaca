import React, { useState, useMemo } from 'react'
import { X, Search, Trash2, FileText, Clock, Calendar, ChevronRight, Plus } from 'lucide-react'
import { Contract, ContractAnalysis } from '@/lib/contractService'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { trackContracts } from '@/lib/analytics'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface ContractHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  contracts: Array<Contract & { analysis?: ContractAnalysis }>
  onContractsUpdate: () => void
  userId: string
}

interface ExtendedContract extends Contract {
  analysis?: ContractAnalysis
  lastVisited?: string
}

const ContractHistoryModal: React.FC<ContractHistoryModalProps> = ({
  isOpen,
  onClose,
  contracts,
  onContractsUpdate,
  userId
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<'lastVisited' | 'newest' | 'oldest' | 'title'>('lastVisited')
  const navigate = useNavigate()

  // Get last visited timestamps from localStorage
  const getLastVisitedTime = (contractId: string): string => {
    const timestamps = JSON.parse(localStorage.getItem('contract_visit_timestamps') || '{}')
    return timestamps[contractId] || new Date().toISOString()
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 604800)}w ago`
    return `${Math.floor(diffInSeconds / 31536000)}y ago`
  }

  // Enhanced contracts with last visited data
  const enhancedContracts = useMemo(() => {
    return contracts.map(contract => ({
      ...contract,
      lastVisited: getLastVisitedTime(contract.id)
    }))
  }, [contracts])

  // Filter and sort contracts
  const filteredAndSortedContracts = useMemo(() => {
    let filtered = enhancedContracts.filter(contract => {
      const searchLower = searchTerm.toLowerCase()
      const titleMatch = contract.title.toLowerCase().includes(searchLower)
      const fileNameMatch = contract.file_name.toLowerCase().includes(searchLower)
      
      // Search in analysis data if available
      const analysisMatch = contract.analysis?.analysis_data && (
        JSON.stringify(contract.analysis.analysis_data).toLowerCase().includes(searchLower) ||
        (contract.analysis.analysis_data as any).summary?.toLowerCase().includes(searchLower) ||
        (contract.analysis.analysis_data as any).structuredAnalysis?.summary?.toLowerCase().includes(searchLower)
      )
      
      return titleMatch || fileNameMatch || analysisMatch
    })

    // Sort contracts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'lastVisited':
          return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [enhancedContracts, searchTerm, sortBy])

  const handleContractSelect = (contractId: string) => {
    const newSelected = new Set(selectedContracts)
    if (newSelected.has(contractId)) {
      newSelected.delete(contractId)
    } else {
      newSelected.add(contractId)
    }
    setSelectedContracts(newSelected)
  }

  const handleContractView = (contract: ExtendedContract) => {
    // Track contract view
    trackContracts.view(contract.id)
    
    // Update last visited timestamp
    const timestamps = JSON.parse(localStorage.getItem('contract_visit_timestamps') || '{}')
    timestamps[contract.id] = new Date().toISOString()
    localStorage.setItem('contract_visit_timestamps', JSON.stringify(timestamps))
    
    // Close modal and navigate
    onClose()
    navigate(`/analyze/${contract.id}`)
  }

  const handleDeleteSelected = async () => {
    if (selectedContracts.size === 0) return
    
    setIsDeleting(true)
    try {
      const contractIds = Array.from(selectedContracts)
      
      // Delete contracts from database
      const { error } = await supabase
        .from('contracts')
        .delete()
        .in('id', contractIds)
        .eq('user_id', userId)

      if (error) {
        throw new Error('Failed to delete contracts')
      }

      // Clean up localStorage timestamps
      const timestamps = JSON.parse(localStorage.getItem('contract_visit_timestamps') || '{}')
      contractIds.forEach(id => delete timestamps[id])
      localStorage.setItem('contract_visit_timestamps', JSON.stringify(timestamps))

      // Clear selection
      setSelectedContracts(new Set())
      
      // Refresh contracts list
      onContractsUpdate()
      
      toast.success(`${contractIds.length} contract${contractIds.length > 1 ? 's' : ''} deleted successfully`)
    } catch (error) {
      console.error('Error deleting contracts:', error)
      toast.error('Failed to delete contracts')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleNewContract = () => {
    onClose()
    navigate('/dashboard')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contract History</h2>
            <p className="text-gray-600 mt-1">Manage and search through your contracts</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contracts by name, title, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="lastVisited">Last Visited</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedContracts.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedContracts.size})
                </Button>
              )}
            </div>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewContract}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Contracts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAndSortedContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first contract to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedContracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    selectedContracts.has(contract.id)
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedContracts.has(contract.id)}
                        onChange={() => handleContractSelect(contract.id)}
                        className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {contract.title}
                          </h3>
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
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {contract.file_name}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatTimeAgo(contract.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Last visited {formatTimeAgo(contract.lastVisited)}</span>
                          </div>
                        </div>
                        
                        {(contract.analysis?.analysis_data as any)?.summary && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                            {(contract.analysis?.analysis_data as any).summary.substring(0, 150)}
                            {(contract.analysis?.analysis_data as any).summary.length > 150 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContractView(contract)}
                        disabled={contract.analysis_status !== 'completed'}
                        className="flex items-center gap-1"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredAndSortedContracts.length} contract{filteredAndSortedContracts.length !== 1 ? 's' : ''}</span>
            <span>{selectedContracts.size} selected</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractHistoryModal