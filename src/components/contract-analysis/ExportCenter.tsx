import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Download, FileText, FileBarChart, AlertTriangle } from 'lucide-react'
import { ExportData, EnhancedContractAnalysis } from '@/types/contractAnalysis'
import jsPDF from 'jspdf'
import Button from '@/components/ui/Button'

interface ExportCenterProps {
  exportData: ExportData
  contractTitle: string
  analysis?: EnhancedContractAnalysis
  locked?: boolean
  onUpgrade?: () => void
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ exportData, contractTitle, analysis, locked, onUpgrade }) => {



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
  const displayCharts = (safeExportData.charts_data && safeExportData.charts_data.length > 0)
    ? safeExportData.charts_data
    : (analysis?.risk_assessment?.risk_distribution
        ? [{ chart_type: 'risk_distribution', data: Object.entries(analysis.risk_assessment.risk_distribution), configuration: {} }]
        : [])

  const addPdfHeader = (doc: jsPDF, subtitle: string) => {
    doc.setFillColor('#4ECCA3')
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 48, 'F')
    doc.setTextColor('#000000')
    doc.setFontSize(20)
    doc.text('HelloACA', 40, 30)
    doc.setFontSize(12)
    doc.text(subtitle, 160, 30)
    doc.setTextColor('#111827')
  }

  const addPdfFooter = (doc: jsPDF) => {
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setFontSize(10)
    doc.setTextColor('#6B7280')
    doc.text('© 2025 HelloACA • helloaca.xyz', 40, h - 24)
    doc.setDrawColor('#E5E7EB')
    doc.line(40, h - 36, w - 40, h - 36)
    doc.setTextColor('#111827')
  }

  const ensurePage = (doc: jsPDF, y: number, subtitle: string) => {
    if (y > 780) {
      doc.addPage()
      addPdfHeader(doc, subtitle)
      return 96
    }
    return y
  }

  const addSectionHeading = (doc: jsPDF, y: number, text: string) => {
    doc.setFillColor('#4ECCA3')
    doc.rect(40, y - 12, 6, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(text, 60, y)
    doc.setFont('helvetica', 'normal')
    return y + 30
  }

  const addItalicParagraph = (doc: jsPDF, y: number, text: string, subtitle: string) => {
    const lines = doc.splitTextToSize(text, 515)
    doc.setFont('times', 'italic')
    doc.setFontSize(12)
    lines.forEach((t: string) => {
      y = ensurePage(doc, y, subtitle)
      doc.text(t, 40, y)
      y += 18
    })
    doc.setFont('helvetica', 'normal')
    return y + 8
  }

  const addLabelValueRows = (doc: jsPDF, y: number, rows: Array<{ label: string; value: string }>, subtitle: string) => {
    rows.forEach(row => {
      y = ensurePage(doc, y, subtitle)
      doc.setFont('helvetica', 'bold')
      doc.text(`${row.label}:`, 40, y)
      doc.setFont('helvetica', 'normal')
      doc.text(row.value, 120, y)
      y += 18
    })
    return y + 8
  }

  const addBulletList = (doc: jsPDF, y: number, items: string[], subtitle: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    items.forEach(it => {
      const wrapped = doc.splitTextToSize(`• ${it}`, 515)
      wrapped.forEach((t: string) => {
        y = ensurePage(doc, y, subtitle)
        doc.text(t, 40, y)
        y += 18
      })
    })
    return y + 8
  }

  const downloadPdfReport = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    addPdfHeader(doc, `Contract Report: ${safeContractTitle}`)
    let y = 96
    y = addSectionHeading(doc, y, 'Executive Summary')
    if (analysis?.executive_summary?.contract_overview?.purpose_summary) {
      y = addItalicParagraph(doc, y, analysis.executive_summary.contract_overview.purpose_summary, `Contract Report: ${safeContractTitle}`)
    }
    const score = analysis?.executive_summary?.key_metrics?.risk_score
    const dist = analysis?.risk_assessment?.risk_distribution
    const stats: Array<{ label: string; value: string }> = []
    if (typeof score === 'number') stats.push({ label: 'Risk Score', value: String(score) })
    if (dist) stats.push({ label: 'Risk Distribution', value: `Critical ${dist.critical}, High ${dist.high}, Medium ${dist.medium}, Low ${dist.low}, Safe ${dist.safe}` })
    if (stats.length) {
      y = addSectionHeading(doc, y, 'Key Metrics')
      y = addLabelValueRows(doc, y, stats, `Contract Report: ${safeContractTitle}`)
    }
    const missing = analysis?.clause_analysis?.missing_clauses || []
    if (missing.length > 0) {
      y = addSectionHeading(doc, y, 'Missing Clauses')
      y = addBulletList(doc, y, missing.map(m => m.clauseType), `Contract Report: ${safeContractTitle}`)
    }
    const recs = [
      ...(analysis?.legal_insights?.contextual_recommendations || []).map(r => `${r.title}: ${r.description}`),
      ...(analysis?.legal_insights?.action_items || []).map(a => `${a.title}: ${a.description}`)
    ]
    if (recs.length > 0) {
      y = addSectionHeading(doc, y, 'Recommendations')
      y = addBulletList(doc, y, recs, `Contract Report: ${safeContractTitle}`)
    }
    addPdfFooter(doc)
    doc.save(`${safeContractTitle}_Report.pdf`)
  }

  const downloadWordDoc = () => {
    const overview = analysis?.executive_summary?.contract_overview?.purpose_summary || ''
    const score = analysis?.executive_summary?.key_metrics?.risk_score
    const dist = analysis?.risk_assessment?.risk_distribution
    const missing = analysis?.clause_analysis?.missing_clauses || []
    const recs = [
      ...(analysis?.legal_insights?.contextual_recommendations || []).map(r => `- ${r.title}: ${r.description}`),
      ...(analysis?.legal_insights?.action_items || []).map(a => `- ${a.title}: ${a.description}`)
    ].join('\n')
    const distRow = dist ? `<tr><td>${dist.critical}</td><td>${dist.high}</td><td>${dist.medium}</td><td>${dist.low}</td><td>${dist.safe}</td></tr>` : ''
    const missingList = missing.length ? `<ul class="list">${missing.map(m => `<li>${m.clauseType}</li>`).join('')}</ul>` : ''
    const recList = recs ? `<ul class="list">${recs.split('\n').map(line => `<li>${line}</li>`).join('')}</ul>` : ''
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contract Report</title><style>body{font-family:Inter,Arial,sans-serif;color:#111827} .header{background:#4ECCA3;color:#000;padding:16px 24px;border-bottom:1px solid #E5E7EB} .title{margin:0;font-size:22px;font-weight:700} .subtitle{margin:4px 0 0;font-size:13px} .footer{border-top:1px solid #E5E7EB;color:#6B7280;font-size:12px;padding:12px 24px;margin-top:24px} h1{font-size:20px;margin:20px 24px} h2{font-size:16px;margin:18px 24px} p{margin:10px 24px;font-size:14px;line-height:1.6} em{font-style:italic} .list{margin:10px 24px;font-size:14px;line-height:1.6} .list li{margin:6px 0} table{border-collapse:collapse;margin:12px 24px} th,td{border:1px solid #E5E7EB;padding:10px 14px;text-align:center}</style></head><body><div class="header"><div class="title">HelloACA</div><div class="subtitle">Contract Report: ${safeContractTitle}</div></div><h1>Executive Summary</h1>${overview ? `<h2>Overview</h2><p><em>${overview}</em></p>` : ''}${typeof score === 'number' ? `<h2>Risk Score</h2><p><strong>${score}</strong></p>` : ''}${dist ? `<h2>Risk Distribution</h2><table><thead><tr><th>Critical</th><th>High</th><th>Medium</th><th>Low</th><th>Safe</th></tr></thead><tbody>${distRow}</tbody></table>` : ''}${missing.length > 0 ? `<h2>Missing Clauses</h2>${missingList}` : ''}${recs ? `<h2>Recommendations</h2>${recList}` : ''}<div class="footer">© 2025 HelloACA • helloaca.xyz</div></body></html>`
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeContractTitle}_Report.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAnnotatedPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    addPdfHeader(doc, `Annotated Contract: ${safeContractTitle}`)
    let y = 96
    y = addSectionHeading(doc, y, 'Annotations')
    const ann = safeExportData.annotations || []
    if (ann.length === 0) {
      const wrapped = doc.splitTextToSize('No annotations available.', 515)
      wrapped.forEach((t: string) => { if (y > 780) { doc.addPage(); y = 60 } doc.text(t, 40, y); y += 16 })
      doc.save(`${safeContractTitle}_Annotated.pdf`)
      return
    }
    ann.forEach(a => {
      y = addSectionHeading(doc, y, `Clause ${a.clause_id}`)
      const rows = [
        { label: 'Type', value: a.annotation_type },
        { label: 'Risk', value: a.risk_level ?? 'Unknown' },
        { label: 'Position', value: String(a.position) }
      ]
      y = addLabelValueRows(doc, y, rows, `Annotated Contract: ${safeContractTitle}`)
      y = addItalicParagraph(doc, y, a.content, `Annotated Contract: ${safeContractTitle}`)
      if (y > 760) { doc.addPage(); y = 60 }
    })
    addPdfFooter(doc)
    doc.save(`${safeContractTitle}_Annotated.pdf`)
  }

  const downloadChartsCsv = () => {
    const rows: string[] = [
      'HelloACA,Charts & Data Export',
      `Contract,${safeContractTitle}`,
      `Exported,${new Date().toISOString()}`,
      '',
      'chart_type,category,score'
    ]
    const charts = displayCharts || []
    charts.forEach(c => {
      const d = c.data || []
      d.forEach((item: any) => {
        if (Array.isArray(item) && item.length >= 2) {
          rows.push(`${c.chart_type},${String(item[0]).replace(/[,\n]/g, ' ')},${String(item[1]).replace(/[,\n]/g, ' ')}`)
        } else if (item && typeof item === 'object' && 'category' in item && 'score' in item) {
          rows.push(`${c.chart_type},${String(item.category).replace(/[,\n]/g, ' ')},${String(item.score).replace(/[,\n]/g, ' ')}`)
        } else {
          rows.push(`${c.chart_type},${JSON.stringify(item).replace(/[,\n]/g, ' ')},`)
        }
      })
    })
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeContractTitle}_Charts.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  return (
    <div className="relative space-y-4 sm:space-y-6">
      {/* Header - Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Export Center</h2>
        <Badge variant="default" className="text-xs sm:text-sm">
           Ready to Download
         </Badge>
      </div>

      {/* Export Options - Responsive Grid */}
      <div className={locked ? 'pointer-events-none select-none filter blur-sm' : ''}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={locked ? onUpgrade : downloadPdfReport}>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={locked ? onUpgrade : downloadWordDoc}>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={locked ? onUpgrade : downloadAnnotatedPdf}>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={locked ? onUpgrade : downloadChartsCsv}>
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
      </div>

      {/* Preview Section - Responsive */}
      <div className={locked ? 'pointer-events-none select-none filter blur-sm space-y-3 sm:space-y-4' : 'space-y-3 sm:space-y-4'}>
        <h3 className="text-base sm:text-lg font-semibold">Preview</h3>
        
        {/* Chart Data Preview - Responsive Card */}
        {displayCharts?.length > 0 && (
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileBarChart className="h-4 w-4 mr-2" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="space-y-2 sm:space-y-3">
                {displayCharts.map((chart, index) => {
                  if (chart.chart_type === 'risk_distribution') {
                    const entries = (chart.data || []).map((item: any) => {
                      if (Array.isArray(item) && item.length >= 2) {
                        return { k: String(item[0]), v: Number(item[1]) }
                      }
                      if (item && typeof item === 'object') {
                        const k = (item.category ?? item.key ?? '')
                        const v = Number(item.score ?? item.value ?? 0)
                        return { k: String(k), v }
                      }
                      return { k: '', v: 0 }
                    }).filter((e: any) => e.k)
                    const total = entries.reduce((sum: number, e: any) => sum + (isFinite(e.v) ? e.v : 0), 0)
                    return entries.map((e: any, idx: number) => (
                      <div key={`${index}-${idx}`} className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium truncate mr-2">{e.k}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${total > 0 ? Math.round((e.v / total) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12 text-right">{e.v}</span>
                        </div>
                      </div>
                    ))
                  }
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium truncate mr-2">{chart.chart_type}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${(chart.data?.length || 0) * 10}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12 text-right">{(chart.data?.length || 0)}</span>
                      </div>
                    </div>
                  )
                })}
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

      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/85 backdrop-blur-sm rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Upgrade to unlock exports</h3>
            <p className="text-sm text-gray-600 mt-2">Buy credits to export reports, documents, and data.</p>
            <div className="mt-4 flex justify-center">
              <Button onClick={onUpgrade} className="min-h-[44px] px-6">Upgrade</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
