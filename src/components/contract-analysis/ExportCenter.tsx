import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
// import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Download, FileText, FileBarChart, AlertTriangle } from 'lucide-react'
import { ExportData } from '@/types/contractAnalysis'

interface ExportCenterProps {
  exportData: ExportData
  contractTitle: string
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ exportData, contractTitle }) => {



  // Error handling: Check if exportData is available
  if (!exportData || (!exportData.pdf_template && !exportData.word_template && !exportData.annotations && !exportData.charts_data)) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Responsive Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Export Center</h2>
          <Badge variant="default" className="text-xs sm:text-sm bg-red-100 text-red-800">
             No Data Available
           </Badge>
        </div>

        {/* Error Message - Responsive */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-red-900 mb-1">Export Data Unavailable</h3>
                <p className="text-xs sm:text-sm text-red-700">
                  Export functionality requires completed contract analysis. Please ensure the analysis is complete before attempting to export.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safe data access with fallbacks
  const safeExportData = {
    pdf_template: exportData.pdf_template || '',
    word_template: exportData.word_template || '',
    annotations: exportData.annotations || [],
    charts_data: exportData.charts_data || []
  }

  const safeContractTitle = contractTitle || 'Contract_Analysis'

  const handleExport = async (type: string) => {
    try {
      // Simulate export generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a mock download
      const mockContent = {
        pdf_template: `PDF Report for ${safeContractTitle}`,
        word_template: `Word Document for ${safeContractTitle}`,
        annotations: JSON.stringify(safeExportData.annotations, null, 2),
        charts_data: JSON.stringify(safeExportData.charts_data, null, 2)
      }
      
      const blob = new Blob([mockContent[type as keyof typeof mockContent]], {
        type: type === 'pdf_template' ? 'application/pdf' : 
              type === 'word_template' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeContractTitle}_${type}.${type === 'pdf_template' ? 'pdf' : 
                                                 type === 'word_template' ? 'docx' : 'json'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleDownload = (type: string) => {
    handleExport(type === 'pdf' ? 'pdf_template' : type === 'word' ? 'word_template' : type === 'annotated' ? 'annotations' : 'charts_data')
  }



  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Export Center</h2>
        <Badge variant="default" className="text-xs sm:text-sm">
           Ready to Download
         </Badge>
      </div>

      {/* Export Options - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleDownload('pdf')}>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
                PDF Report
              </CardTitle>
              <Download className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Comprehensive PDF report with all analysis sections, charts, and recommendations.
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Size: ~2.5MB</span>
              <Badge variant="default" className="text-xs">Professional</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleDownload('word')}>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Word Document
              </CardTitle>
              <Download className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Editable Word document with analysis results and formatted sections.
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Size: ~1.2MB</span>
              <Badge variant="default" className="text-xs">Editable</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleDownload('annotated')}>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                Annotated Contract
              </CardTitle>
              <Download className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Original contract with inline comments, highlights, and analysis notes.
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Size: ~800KB</span>
              <Badge variant="default" className="text-xs">Annotated</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleDownload('charts')}>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileBarChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                Charts & Data
              </CardTitle>
              <Download className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Excel file with risk data, charts, and analysis metrics for further processing.
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Size: ~500KB</span>
              <Badge variant="default" className="text-xs">Data</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section - Responsive */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-semibold">Preview</h3>
        
        {/* Chart Data Preview - Responsive Card */}
        {safeExportData.charts_data?.length > 0 && (
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileBarChart className="h-4 w-4 mr-2" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="space-y-2 sm:space-y-3">
                {safeExportData.charts_data.map((chart, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium truncate mr-2">{chart.chart_type}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(chart.data?.length || 0) * 10}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12 text-right">{(chart.data?.length || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Annotations Preview - Responsive Card */}
        {safeExportData.annotations && safeExportData.annotations.length > 0 && (
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileText className="h-4 w-4 mr-2" />
                Contract Annotations
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="space-y-2 sm:space-y-3">
                {safeExportData.annotations.map((annotation, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-2 sm:pl-3 py-1 sm:py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium truncate mr-2">Clause #{annotation.clause_id}</span>
                      <Badge variant="default" className="text-xs flex-shrink-0">{annotation.annotation_type}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{annotation.content}</p>
                    <span className="text-xs text-gray-500">Position: {annotation.position} • Risk: {annotation.risk_level ?? 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}