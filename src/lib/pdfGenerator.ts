import jsPDF from 'jspdf'
import { Contract, ContractAnalysis } from './contractService'

interface ReportData extends Contract {
  analysis?: ContractAnalysis
}

export const generatePDFReport = (report: ReportData): void => {
  if (!report.analysis) {
    throw new Error('No analysis data available for PDF generation')
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + (lines.length * (fontSize * 0.4))
  }

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number): number => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage()
      return margin
    }
    return yPosition
  }

  // Header with branding
  doc.setFillColor(78, 204, 163) // HelloACA brand color
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('HelloACA', margin, 25)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Contract Analysis Report', margin, 35)

  yPosition = 60

  // Report Title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  yPosition = addWrappedText(report.title, margin, yPosition, contentWidth, 18)
  yPosition += 10

  // Report Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  
  const metadata = [
    `File Name: ${report.file_name}`,
    `Upload Date: ${new Date(report.upload_date).toLocaleDateString()}`,
    `Analysis Date: ${new Date(report.analysis.created_at).toLocaleDateString()}`,
    `Status: ${report.analysis_status.charAt(0).toUpperCase() + report.analysis_status.slice(1)}`
  ]

  metadata.forEach(item => {
    yPosition = addWrappedText(item, margin, yPosition, contentWidth, 10)
    yPosition += 2
  })

  yPosition += 15

  // Summary Section
  yPosition = checkNewPage(40)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  yPosition = addWrappedText('Executive Summary', margin, yPosition, contentWidth, 16)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const summary = report.analysis.analysis_data?.executiveSummary || 'No summary available'
  yPosition = addWrappedText(summary, margin, yPosition, contentWidth, 11)
  yPosition += 20

  // Risk Score Section
  const riskScoreVal = report.analysis.analysis_data?.riskScore
  if (typeof riskScoreVal === 'number') {
    yPosition = checkNewPage(30)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    yPosition = addWrappedText('Risk Assessment', margin, yPosition, contentWidth, 16)
    yPosition += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 53, 69) // Red color for risk
    yPosition = addWrappedText(`Risk Score: ${riskScoreVal}`, margin, yPosition, contentWidth, 14)
    yPosition += 20
  }

  // Key Findings Section (aggregated from sections)
  const sectionsObj = report.analysis.analysis_data?.sections
  const aggregatedFindings = sectionsObj 
    ? Object.values(sectionsObj).flatMap((section: any) => 
        (section.keyFindings || []).map((desc: string) => ({ sectionName: section.sectionName, description: desc }))
      )
    : []

  if (aggregatedFindings.length) {
    yPosition = checkNewPage(40)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    yPosition = addWrappedText('Key Findings', margin, yPosition, contentWidth, 16)
    yPosition += 10

    aggregatedFindings.forEach((finding: { sectionName?: string; description?: string }, index: number) => {
      yPosition = checkNewPage(25)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      yPosition = addWrappedText(`${index + 1}. ${finding.sectionName || 'Finding'}`, margin, yPosition, contentWidth, 12)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      yPosition = addWrappedText(finding.description || 'No description available', margin + 10, yPosition, contentWidth - 10, 11)
      yPosition += 10
    })
  }

  // Critical Issues Section
  const criticalIssues = report.analysis.analysis_data?.criticalIssues || []
  if (criticalIssues.length) {
    yPosition = checkNewPage(40)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    yPosition = addWrappedText('Critical Issues', margin, yPosition, contentWidth, 16)
    yPosition += 10

    criticalIssues.forEach((issue: any, index: number) => {
      yPosition = checkNewPage(30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      yPosition = addWrappedText(`${index + 1}. ${issue.type || 'Issue'}`, margin, yPosition, contentWidth, 12)
      yPosition += 5

      if (issue.severity) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const sev = String(issue.severity).toLowerCase()
        const riskColor = sev === 'critical' ? [220, 53, 69] : sev === 'high' ? [255, 193, 7] : [40, 167, 69]
        doc.setTextColor(riskColor[0], riskColor[1], riskColor[2])
        yPosition = addWrappedText(`Severity: ${issue.severity}`, margin + 10, yPosition, contentWidth - 10, 10)
        yPosition += 3
      }

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      yPosition = addWrappedText(issue.description || issue.impact || 'No details available', margin + 10, yPosition, contentWidth - 10, 11)
      yPosition += 10
    })
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10)
    doc.text('Generated by HelloACA', margin, pageHeight - 10)
  }

  // Generate filename with report name and date
  const fileName = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis_report_${new Date().toISOString().split('T')[0]}.pdf`
  
  // Save the PDF
  doc.save(fileName)
}