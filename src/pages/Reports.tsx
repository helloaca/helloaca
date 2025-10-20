import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileText, Calendar, Filter, Search, Eye, Trash2, Share2, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'

interface Report {
  id: string
  contractName: string
  reportType: 'standard' | 'white-label'
  createdAt: Date
  fileSize: string
  downloadUrl: string
  status: 'ready' | 'generating' | 'failed'
}

const Reports: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'white-label'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date')

  // Mock reports data
  const [reports] = useState<Report[]>([
    {
      id: '1',
      contractName: 'Service Agreement - ABC Corp.pdf',
      reportType: 'standard',
      createdAt: new Date('2024-01-15'),
      fileSize: '2.4 MB',
      downloadUrl: '/reports/report-1.pdf',
      status: 'ready'
    },
    {
      id: '2',
      contractName: 'Employment Contract - John Doe.pdf',
      reportType: 'white-label',
      createdAt: new Date('2024-01-14'),
      fileSize: '1.8 MB',
      downloadUrl: '/reports/report-2.pdf',
      status: 'ready'
    },
    {
      id: '3',
      contractName: 'NDA - Tech Startup.pdf',
      reportType: 'standard',
      createdAt: new Date('2024-01-13'),
      fileSize: '1.2 MB',
      downloadUrl: '/reports/report-3.pdf',
      status: 'generating'
    },
    {
      id: '4',
      contractName: 'Lease Agreement - Office Space.pdf',
      reportType: 'standard',
      createdAt: new Date('2024-01-12'),
      fileSize: '3.1 MB',
      downloadUrl: '/reports/report-4.pdf',
      status: 'ready'
    }
  ])

  const filteredReports = reports
    .filter(report => {
      const matchesSearch = report.contractName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === 'all' || report.reportType === filterType
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'name':
          return a.contractName.localeCompare(b.contractName)
        case 'type':
          return a.reportType.localeCompare(b.reportType)
        default:
          return 0
      }
    })

  const handleDownload = (report: Report) => {
    // In a real app, this would trigger the actual download
    console.log('Downloading report:', report.id)
  }

  const handleDelete = (reportId: string) => {
    // In a real app, this would delete the report
    console.log('Deleting report:', reportId)
  }

  const handleShare = (report: Report) => {
    // In a real app, this would open a share dialog
    console.log('Sharing report:', report.id)
  }

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Ready</span>
      case 'generating':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Generating</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Failed</span>
    }
  }

  const getReportTypeBadge = (type: Report['reportType']) => {
    return type === 'white-label' ? (
      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">White Label</span>
    ) : (
      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Standard</span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Download and manage your contract analysis reports</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-[#4ECCA3]" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                <p className="text-gray-600">Total Reports</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'ready').length}
                </p>
                <p className="text-gray-600">Ready to Download</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.createdAt.getMonth() === new Date().getMonth()).length}
                </p>
                <p className="text-gray-600">This Month</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Share2 className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.reportType === 'white-label').length}
                </p>
                <p className="text-gray-600">White Label</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter by Type */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="white-label">White Label</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reports List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.contractName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Report ID: {report.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getReportTypeBadge(report.reportType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.fileSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(report)}
                          disabled={report.status !== 'ready'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(report)}
                          disabled={report.status !== 'ready'}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(report)}
                          disabled={report.status !== 'ready'}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Generate your first report by analyzing a contract.'}
              </p>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Analyze Contract
              </Button>
            </div>
          )}
        </Card>

        {/* Generate New Report */}
        <Card className="mt-6 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate New Report</h3>
            <p className="text-gray-600 mb-4">
              Create a comprehensive analysis report for any of your uploaded contracts
            </p>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Reports