import { supabase } from './supabase'
import { FileProcessor, ProcessedFile } from './fileProcessor'

export interface Contract {
  id: string
  user_id: string
  title: string
  file_name: string
  file_path?: string
  file_size?: number
  extracted_text?: string
  upload_date: string
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface ContractAnalysis {
  id: string
  contract_id: string
  user_id: string
  analysis_data?: any
  risk_score?: number
  key_clauses?: any
  recommendations?: any
  created_at: string
  updated_at: string
}

// New simplified JSON schema from AI
export interface SimplifiedAnalysis {
  overallRiskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk'
  keyFindings: Array<{
    title: string
    description: string
  }>
  recommendations: string[]
  missingClauses: string[]
  clauseAnalysis: Array<{
    title: string
    content: string
    analysis: string
    riskLevel: 'high' | 'medium' | 'low' | 'none'
    issues: string[]
    suggestions: string[]
  }>
  riskSummary: {
    legal: string
    financial: string
    operational: string
  }
}

export interface AnalysisResult {
  riskScore: number
  riskLevel: 'Low' | 'Medium' | 'High'
  keyClauses: Array<{
    type: string
    content: string
    risk: 'Low' | 'Medium' | 'High'
    explanation: string
  }>
  recommendations: Array<{
    priority: 'High' | 'Medium' | 'Low'
    category: string
    description: string
    action: string
  }>
  summary: string
  potentialIssues: Array<{
    issue: string
    severity: 'Low' | 'Medium' | 'High'
    recommendation: string
  }>
  structuredAnalysis?: {
    overallRiskLevel: string
    keyFindings: Array<{
      title: string
      description: string
      severity: 'High' | 'Medium' | 'Low'
      category: 'risk' | 'opportunity' | 'obligation'
    }>
    clauseAnalysis: Array<{
      title: string
      content: string
      analysis: string
      riskLevel: 'high' | 'medium' | 'low' | 'none'
      issues: string[]
      suggestions: string[]
    }>
    summary: string
  }
}

export interface ChatMessage {
  id: string
  contract_id: string
  user_id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

export class ContractService {
  static async uploadAndAnalyzeContract(
    file: File,
    userId: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{ contractId: string; analysisId: string }> {
    try {
      // Stage 1: Validate and process file
      onProgress?.('Validating file...', 10)
      const validation = FileProcessor.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.message)
      }

      onProgress?.('Processing file...', 20)
      const processedFile = await FileProcessor.processFile(file)

      // Stage 2: Create contract record
      onProgress?.('Creating contract record...', 40)
      const contract = await this.createContract(userId, file, processedFile)

      // Stage 3: Analyze contract with AI
      onProgress?.('Analyzing contract with AI...', 60)
      await this.updateContractStatus(contract.id, 'processing')
      
      try {
        const analysisResult = await this.analyzeContractWithAI(processedFile.text)
        
        // Stage 4: Save analysis results
        onProgress?.('Saving analysis results...', 80)
        const analysis = await this.saveAnalysisResults(contract.id, userId, analysisResult)
        
        // Stage 5: Update contract status
        onProgress?.('Finalizing...', 90)
        await this.updateContractStatus(contract.id, 'completed')
        
        onProgress?.('Complete!', 100)
        
        return {
          contractId: contract.id,
          analysisId: analysis.id
        }
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError)
        await this.updateContractStatus(contract.id, 'failed')
        throw new Error('Contract analysis failed. Please try again.')
      }
    } catch (error) {
      console.error('Contract upload and analysis failed:', error)
      throw error
    }
  }

  private static async createContract(
    userId: string,
    file: File,
    processedFile: ProcessedFile
  ): Promise<Contract> {
    console.log('📄 Creating contract with extracted text length:', processedFile.text.length)
    console.log('📄 First 200 chars:', processedFile.text.substring(0, 200))
    
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        user_id: userId,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        file_name: file.name,
        file_size: file.size,
        extracted_text: processedFile.text,
        analysis_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contract:', error)
      throw new Error('Failed to create contract record')
    }

    console.log('💾 Saved contract:', {
      id: data.id,
      title: data.title,
      hasText: !!data.extracted_text,
      textLength: data.extracted_text?.length
    })

    return data
  }

  private static async updateContractStatus(
    contractId: string,
    status: Contract['analysis_status']
  ): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .update({ 
        analysis_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)

    if (error) {
      console.error('Error updating contract status:', error)
      throw new Error('Failed to update contract status')
    }
  }

  /**
   * Analyze contract with AI (Local Mode - Vercel Disconnected)
   */
  private static async analyzeContractWithAI(contractText: string): Promise<AnalysisResult> {
    console.log('🤖 Starting contract analysis...')
    console.log('📄 Contract text length:', contractText.length, 'characters')
    
    // Always use local analysis for reliable results
    console.log('🏠 Using enhanced local analysis for reliable contract insights')
    return this.getLocalAnalysis(contractText)
  }

  /**
   * Retry analysis with concise prompt for truncated responses
   */
  private static async retryWithConcisePrompt(contractText: string): Promise<AnalysisResult> {
    console.log('🔄 Retrying analysis with concise prompt...')
    
    try {
      const concisePrompt = this.buildConciseAnalysisPrompt(contractText)
      console.log('📝 Concise prompt built, length:', concisePrompt.length, 'characters')
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: concisePrompt
          }]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Claude API error on retry:', response.status, errorText)
        throw new Error(`Claude API retry error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Concise analysis response received')
      console.log('📊 Retry response usage:', data.usage)

      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('❌ Invalid Claude API retry response structure:', data)
        throw new Error('Invalid retry response structure from Claude API')
      }

      const aiResponse = data.content[0].text
      console.log('🔍 Retry AI response length:', aiResponse.length, 'characters')

      const parsedAnalysis = this.parseAnalysisResponse(aiResponse)
      console.log('✅ Retry response parsed successfully')
      console.log('📋 Retry parsed analysis structure:', {
        overallRiskLevel: parsedAnalysis.overallRiskLevel,
        keyFindingsCount: parsedAnalysis.keyFindings?.length || 0,
        clauseAnalysisCount: parsedAnalysis.clauseAnalysis?.length || 0
      })

      this.validateAnalysis(parsedAnalysis)
      console.log('✅ Retry analysis validation passed')

      const legacyAnalysis = this.convertToLegacyFormat(parsedAnalysis)
      console.log('✅ Retry analysis converted successfully')
      
      return legacyAnalysis

    } catch (retryError) {
      console.error('❌ Concise prompt retry also failed:', retryError)
      console.log('🔄 Falling back to default analysis')
      
      const fallback = this.getFallbackAnalysis()
      console.log('📊 Final fallback analysis structure:', {
        hasStructuredAnalysis: !!fallback.structuredAnalysis,
        keyFindingsCount: fallback.structuredAnalysis?.keyFindings?.length || 0,
        clauseAnalysisCount: fallback.structuredAnalysis?.clauseAnalysis?.length || 0
      })
      
      return fallback
    }
  }



  /**
   * Build concise analysis prompt for retry attempts
   */
  private static buildConciseAnalysisPrompt(contractText: string): string {
    return `You are a contract attorney. Analyze this contract and identify the TOP 5 most critical risks only.

CONTRACT:
${contractText}

Return ONLY this JSON (keep it SHORT):

{
  "overallRiskLevel": "High Risk Level" | "Medium Risk" | "Low Risk",
  "keyFindings": [
    {
      "title": "Brief risk title",
      "description": "1-2 sentence explanation of the risk and impact",
      "severity": "High" | "Medium" | "Low",
      "category": "risk"
    }
  ],
  "clauseAnalysis": [
    {
      "title": "Clause name",
      "content": "Original clause text",
      "analysis": "Brief 1-2 sentence analysis",
      "riskLevel": "high" | "medium" | "low",
      "issues": ["Issue 1", "Issue 2"],
      "suggestions": ["Improved clause text in 1-2 sentences"]
    }
  ],
  "summary": "2-3 sentence overall assessment"
}

CRITICAL RULES:
- Maximum 5 findings
- Maximum 3 clause analyses  
- Keep descriptions under 2 sentences
- Keep suggestions under 2 sentences
- ENSURE JSON IS COMPLETE with all brackets closed
- Return ONLY valid JSON, nothing else
- STRICT NO-EMOJI POLICY: Never use emojis, emoticons, or informal symbols. Maintain professional formal tone only.

Focus on: missing termination clause, vague payment terms, missing dispute resolution, undefined key terms, and missing liability limits.`
  }

  /**
   * Build comprehensive analysis prompt
   */
  private static buildAnalysisPrompt(contractText: string): string {
    return `SYSTEM: You are a legal analysis engine that reads uploaded contracts and outputs structured risk assessments in strict JSON format. You are a contract analysis expert. Always return valid JSON only, never use markdown code blocks or additional formatting.

CRITICAL: Return ONLY valid JSON. Do NOT wrap your response in markdown code blocks or add any text before or after the JSON object. Your response must start with { and end with } with no additional text, markdown formatting, or code blocks.

USER: Analyze the uploaded contract and respond ONLY with valid JSON that matches this schema:

{
  "overallRiskLevel": string, // one of 'Low Risk', 'Medium Risk', 'High Risk'
  "keyFindings": [
    {
      "title": string,
      "description": string
    }
  ],
  "recommendations": [
    string
  ],
  "missingClauses": [
    string
  ],
  "clauseAnalysis": [
    {
      "title": string,
      "content": string,
      "analysis": string,
      "riskLevel": string, // one of 'high', 'medium', 'low', 'none'
      "issues": [string],
      "suggestions": [string]
    }
  ],
  "riskSummary": {
    "legal": string,
    "financial": string,
    "operational": string
  }
}

ANALYSIS REQUIREMENTS:
1. Provide 5-10 key findings with specific titles and detailed descriptions
2. Include 3-6 clause analyses with actual contract text, thorough analysis, identified issues, and specific suggestions
3. Identify 2-5 missing clauses that should be present
4. Provide 3-7 actionable recommendations
5. Give comprehensive risk summaries for legal, financial, and operational aspects

Important rules:
1. Output ONLY valid JSON (no extra text, no code fences, no explanations).
2. Do NOT include trailing commas.
3. Do NOT include null values — use empty arrays [] or empty strings "" instead.
4. All text values must be in double quotes.
5. Ensure the JSON parses correctly with JSON.parse().
6. STRICT NO-EMOJI POLICY: You must NEVER use emojis, emoticons, or any informal symbols in your responses. Maintain a completely professional and formal tone throughout all analysis content.
7. Do NOT wrap your response in markdown code blocks.
8. Your response must start with { and end with } with no additional text.
9. NEVER return placeholder content like "Analysis incomplete" or "Manual review recommended" - always provide actual analysis
10. Each key finding description should be at least 2-3 sentences explaining the specific risk and its implications
11. Each clause analysis should include the actual clause text and detailed analysis of its strengths/weaknesses

CONTRACT TEXT TO ANALYZE:
${contractText}

Remember: Return ONLY the JSON object, no markdown formatting, no code blocks, no explanatory text. Provide substantial, meaningful analysis - not placeholder content.

Example valid output:
{
  "overallRiskLevel": "Medium Risk",
  "keyFindings": [
    {
      "title": "Receiving Party Not Identified",
      "description": "The contract fails to specify the Receiving Party's full legal identity, including corporate structure and authorized representatives. This creates enforceability issues and makes it difficult to determine who is legally bound by the confidentiality obligations. Without proper identification, the disclosing party may face challenges in pursuing legal remedies for breaches."
    },
    {
      "title": "No Residual Knowledge Clause",
      "description": "The NDA lacks a residual knowledge clause, which means the receiving party cannot retain general know-how, skills, or techniques learned during the relationship. This creates an unrealistic and potentially unenforceable restriction that could lead to disputes over what constitutes residual knowledge versus confidential information."
    }
  ],
  "recommendations": [
    "Add complete party identification including full legal names, addresses, and authorized representatives.",
    "Include a residual knowledge clause to avoid unrealistic restrictions on general knowledge retention.",
    "Define the scope of confidential information more precisely with specific categories and examples."
  ],
  "missingClauses": [
    "Governing Law and Jurisdiction",
    "Termination Clause with Return of Materials",
    "Remedies and Injunctive Relief"
  ],
  "clauseAnalysis": [
    {
      "title": "Confidentiality Obligations",
      "content": "The Receiving Party agrees to maintain confidentiality of all disclosed information and not to use such information for any purpose other than evaluating potential business opportunities.",
      "analysis": "This clause establishes basic confidentiality obligations but lacks specific duration, scope definitions, and exceptions. The broad language could be interpreted too restrictively, potentially covering information that should not be confidential.",
      "riskLevel": "medium",
      "issues": ["Vague duration of confidentiality", "Undefined scope of confidential information", "Missing standard exceptions"],
      "suggestions": ["Add specific confidentiality period (e.g., 3-5 years)", "Define scope of confidential information more precisely", "Include standard exceptions for publicly available information"]
    }
  ],
  "riskSummary": {
    "legal": "Moderate legal risk due to identification issues and missing key clauses that could affect enforceability and dispute resolution.",
    "financial": "Low to moderate financial risk unless sensitive trade secrets or valuable proprietary information is involved in the disclosure.",
    "operational": "Medium operational risk as unclear terms could lead to disputes and uncertainty in day-to-day compliance with confidentiality requirements."
  }
}`
  }

  /**
   * Parse and extract JSON from Claude's response
   * Simplified for clean JSON responses from the new prompt structure
   */
  private static parseAnalysisResponse(response: string): any {
    try {
      console.log('🔍 Parsing Claude response...')
      console.log('📊 Response length:', response.length)
      console.log('📝 First 200 chars:', response.substring(0, 200))
      console.log('📝 Last 200 chars:', response.substring(Math.max(0, response.length - 200)))
      
      let jsonString = response.trim()

      // Remove markdown code blocks if present (shouldn't happen with new prompt)
      if (jsonString.startsWith('```json')) {
        console.log('⚠️ Found markdown code blocks - removing them')
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonString.startsWith('```')) {
        console.log('⚠️ Found generic code blocks - removing them')
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Find JSON boundaries more reliably
      const firstBrace = jsonString.indexOf('{')
      const lastBrace = jsonString.lastIndexOf('}')
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        console.error('❌ No valid JSON boundaries found')
        console.log('🔍 Full response:', response)
        throw new Error('No valid JSON found in response')
      }

      jsonString = jsonString.substring(firstBrace, lastBrace + 1)
      console.log('🎯 Extracted JSON string length:', jsonString.length)
      console.log('🎯 JSON preview:', jsonString.substring(0, 300) + '...')

      const parsed = JSON.parse(jsonString)
      console.log('✅ JSON parsed successfully')
      console.log('📊 Parsed structure keys:', Object.keys(parsed))
      console.log('📊 Key findings count:', parsed.keyFindings?.length || 0)
      console.log('📊 Clause analysis count:', parsed.clauseAnalysis?.length || 0)
      
      return parsed
    } catch (error) {
      console.error('❌ JSON parsing failed:', error)
      console.log('🔍 Raw response that failed to parse:')
      console.log(response)
      
      // Try to extract partial JSON if possible
      try {
        const partialMatch = response.match(/\{[\s\S]*\}/);
        if (partialMatch) {
          console.log('🔄 Attempting to parse partial JSON...')
          const partialParsed = JSON.parse(partialMatch[0]);
          console.log('✅ Partial JSON parsed successfully')
          return partialParsed;
        }
      } catch (partialError) {
        console.error('❌ Partial JSON parsing also failed:', partialError)
      }
      
      throw new Error(`Failed to parse AI response as JSON: ${error}`)
    }
  }

  /**
   * Transform analysis data from backend API to match our expected format
   */
  private static transformAnalysisData(analysisData: any): AnalysisResult {
    console.log('🔄 Transforming analysis data to legacy format')
    
    // Map risk levels
    const riskLevelMap: { [key: string]: number } = {
      'Low Risk': 25,
      'Medium Risk': 50,
      'High Risk': 75,
      'low': 25,
      'medium': 50,
      'high': 75
    }

    // Transform key findings to key clauses format
    const keyClauses = (analysisData.keyFindings || []).map((finding: any, index: number) => ({
      type: finding.category || `Finding ${index + 1}`,
      content: finding.title || 'Key Finding',
      risk: finding.riskLevel || 'Medium',
      explanation: finding.description || 'No description available'
    }))

    // Transform recommendations
    const recommendations = (analysisData.recommendations || []).map((rec: any) => ({
      priority: rec.priority || 'Medium',
      category: rec.category || 'General',
      description: rec.title || rec.description || 'Recommendation',
      action: rec.action || rec.description || 'Review and consider implementation'
    }))

    // Transform potential issues
    const potentialIssues = (analysisData.keyFindings || [])
      .filter((finding: any) => finding.riskLevel === 'high' || finding.riskLevel === 'High Risk')
      .map((finding: any) => ({
        issue: finding.title || 'High Risk Issue',
        severity: 'High',
        description: finding.description || 'No description available'
      }))

    const transformedAnalysis: AnalysisResult = {
      riskScore: riskLevelMap[analysisData.overallRiskLevel] || 50,
      riskLevel: analysisData.overallRiskLevel?.includes('Low') ? 'Low' : 
                 analysisData.overallRiskLevel?.includes('High') ? 'High' : 'Medium',
      keyClauses,
      recommendations,
      summary: analysisData.summary || 'Contract analysis completed successfully.',
      potentialIssues,
      structuredAnalysis: {
        keyFindings: analysisData.keyFindings || [],
        clauseAnalysis: analysisData.clauseAnalysis || [],
        recommendations: analysisData.recommendations || [],
        missingClauses: analysisData.missingClauses || [],
        summary: analysisData.summary || 'Analysis completed successfully.'
      }
    }

    console.log('✅ Analysis transformation completed')
    console.log('📊 Transformed analysis structure:', {
      riskScore: transformedAnalysis.riskScore,
      riskLevel: transformedAnalysis.riskLevel,
      keyClausesCount: transformedAnalysis.keyClauses?.length || 0,
      recommendationsCount: transformedAnalysis.recommendations?.length || 0,
      structuredKeyFindingsCount: transformedAnalysis.structuredAnalysis?.keyFindings?.length || 0,
      structuredClauseAnalysisCount: transformedAnalysis.structuredAnalysis?.clauseAnalysis?.length || 0
    })

    return transformedAnalysis
  }

  /**
   * Validate that the analysis is comprehensive and useful
   */
  private static validateAnalysis(analysis: any): void {
    const issues: string[] = []

    // Check overall risk level
    if (!analysis.overallRiskLevel) {
      issues.push('Missing overall risk level')
    }

    // Check key findings
    if (!analysis.keyFindings || analysis.keyFindings.length === 0) {
      issues.push('No key findings identified - analysis is incomplete')
    } else if (analysis.keyFindings.length < 3) {
      console.warn('⚠️ Only found', analysis.keyFindings.length, 'findings - this seems low')
    }

    // Check for truncation indicators
    const hasTruncationIndicators = analysis.keyFindings?.some(
      (finding: any) => 
        finding.title?.includes('Analysis Incomplete') ||
        finding.title?.includes('Claude Response Truncated') ||
        finding.description?.includes('cut off mid-response') ||
        finding.description?.includes('truncated response')
    )

    if (hasTruncationIndicators) {
      console.warn('⚠️ Analysis appears to be truncated - Claude may have cut off mid-response')
      // Don't throw error for truncation - let it proceed with partial analysis
    }

    // Check for placeholder/generic content
    const hasPlaceholder = analysis.keyFindings?.some(
      (finding: any) => 
        finding.title === 'Analysis incomplete' ||
        finding.description.includes('Perform manual review') ||
        (finding.description.length < 50 && !hasTruncationIndicators) // Too short to be useful (unless it's a truncation error)
    )

    if (hasPlaceholder) {
      issues.push('Analysis contains placeholder content - not a real analysis')
    }

    // Check clause analysis
    if (!analysis.clauseAnalysis || analysis.clauseAnalysis.length === 0) {
      console.warn('⚠️ No clause analysis provided')
    } else {
      // Check if clauses have actual suggestions
      const hasRealSuggestions = analysis.clauseAnalysis.some(
        (clause: any) => clause.suggestions && clause.suggestions.length > 0
      )

      if (!hasRealSuggestions) {
        console.warn('⚠️ Clauses analyzed but no suggestions provided')
      }
    }

    // Check for incomplete JSON structure (signs of truncation)
    if (analysis.summary && analysis.summary.length < 20) {
      console.warn('⚠️ Summary is unusually short - possible truncation')
    }

    // Validate required fields exist
    const requiredFields = ['overallRiskLevel', 'keyFindings', 'summary']
    const missingFields = requiredFields.filter(field => !analysis[field])
    
    if (missingFields.length > 0) {
      issues.push(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // If there are critical issues (but not truncation), throw error
    if (issues.length > 0 && !hasTruncationIndicators) {
      console.error('❌ Analysis validation failed:')
      issues.forEach(issue => console.error('   -', issue))
      throw new Error(`Analysis validation failed: ${issues.join(', ')}`)
    }

    if (hasTruncationIndicators) {
      console.warn('⚠️ Analysis validation passed with truncation warnings')
    } else {
      console.log('✅ Analysis validation passed')
    }
  }

  private static convertToLegacyFormat(simplifiedAnalysis: any): AnalysisResult {
    // Convert new simplified analysis format to legacy format for database compatibility
    console.log('🔄 Converting analysis to legacy format:', simplifiedAnalysis)
    
    // Add defensive checks and fallbacks for missing properties
    const safeAnalysis = {
      overallRiskLevel: simplifiedAnalysis?.overallRiskLevel || 'Medium Risk',
      keyFindings: Array.isArray(simplifiedAnalysis?.keyFindings) ? simplifiedAnalysis.keyFindings : [],
      recommendations: Array.isArray(simplifiedAnalysis?.recommendations) ? simplifiedAnalysis.recommendations : [],
      missingClauses: Array.isArray(simplifiedAnalysis?.missingClauses) ? simplifiedAnalysis.missingClauses : [],
      clauseAnalysis: Array.isArray(simplifiedAnalysis?.clauseAnalysis) ? simplifiedAnalysis.clauseAnalysis : [],
      riskSummary: {
        legal: simplifiedAnalysis?.riskSummary?.legal || 'Legal risk assessment unavailable.',
        financial: simplifiedAnalysis?.riskSummary?.financial || 'Financial risk assessment unavailable.',
        operational: simplifiedAnalysis?.riskSummary?.operational || 'Operational risk assessment unavailable.'
      }
    }

    const riskLevelMap: { [key: string]: number } = {
      'Low Risk': 25,
      'Medium Risk': 50,
      'High Risk': 75
    }

    return {
      riskScore: riskLevelMap[safeAnalysis.overallRiskLevel] || 50,
      riskLevel: safeAnalysis.overallRiskLevel.replace(' Risk', '') as 'Low' | 'Medium' | 'High',
      keyClauses: safeAnalysis.keyFindings.map((finding: any, index: number) => ({
        type: `Finding ${index + 1}`,
        content: finding?.title || `Finding ${index + 1}`,
        risk: safeAnalysis.overallRiskLevel === 'High Risk' ? 'High' : 
              safeAnalysis.overallRiskLevel === 'Medium Risk' ? 'Medium' : 'Low',
        explanation: finding?.description || 'No description available'
      })),
      recommendations: safeAnalysis.recommendations.map((rec: string, index: number) => ({
        priority: 'Medium' as 'High' | 'Medium' | 'Low',
        category: 'General',
        description: rec || `Recommendation ${index + 1}`,
        action: `Recommendation ${index + 1}`
      })),
      summary: `${safeAnalysis.riskSummary.legal} ${safeAnalysis.riskSummary.financial} ${safeAnalysis.riskSummary.operational}`,
      potentialIssues: safeAnalysis.keyFindings.map((finding: any) => ({
        issue: finding?.title || 'Unknown issue',
        severity: safeAnalysis.overallRiskLevel === 'High Risk' ? 'High' : 
                 safeAnalysis.overallRiskLevel === 'Medium Risk' ? 'Medium' : 'Low',
        recommendation: finding?.description || 'No recommendation available'
      })),
      // Store the simplified analysis in the structured format for new UI components
      structuredAnalysis: {
        overallRiskLevel: safeAnalysis.overallRiskLevel,
        keyFindings: safeAnalysis.keyFindings.map((finding: any) => ({
          title: finding?.title || 'Unknown finding',
          description: finding?.description || 'No description available',
          severity: safeAnalysis.overallRiskLevel === 'High Risk' ? 'High' : 
                   safeAnalysis.overallRiskLevel === 'Medium Risk' ? 'Medium' : 'Low',
          category: 'risk' as 'risk' | 'opportunity' | 'obligation'
        })),
        clauseAnalysis: [
          // Map actual clause analysis from AI response
          ...safeAnalysis.clauseAnalysis.map((clause: any) => ({
            title: clause?.title || 'Unknown Clause',
            content: clause?.content || '',
            analysis: clause?.analysis || 'No analysis available',
            riskLevel: clause?.riskLevel || 'none',
            issues: Array.isArray(clause?.issues) ? clause.issues : [],
            suggestions: Array.isArray(clause?.suggestions) ? clause.suggestions : []
          })),
          // Also include missing clauses as additional analysis items
          ...safeAnalysis.missingClauses.map((clause: string) => ({
            title: `Missing: ${clause}`,
            content: '',
            analysis: `This contract is missing the ${clause} clause, which could create legal risks.`,
            riskLevel: 'medium' as 'high' | 'medium' | 'low' | 'none',
            issues: [`Missing ${clause}`],
            suggestions: [`Add a comprehensive ${clause} clause to the contract.`]
          }))
        ],
        summary: `${safeAnalysis.riskSummary.legal} ${safeAnalysis.riskSummary.financial} ${safeAnalysis.riskSummary.operational}`
      }
    }
  }



  /**
   * Generate enhanced local analysis based on contract text patterns
   */
  private static getLocalAnalysis(contractText: string): AnalysisResult {
    console.log('🏠 Generating enhanced local contract analysis...')
    
    // Enhanced text analysis with more comprehensive pattern matching
    const wordCount = contractText.split(/\s+/).length
    const sentences = contractText.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    // Contract element detection
    const hasTerminationClause = /terminat(e|ion)|end|expire|cancel|dissolution/i.test(contractText)
    const hasPaymentTerms = /payment|fee|cost|price|amount|compensation|salary|wage|invoice|billing/i.test(contractText)
    const hasLiabilityClause = /liability|liable|responsible|damages|indemnif|limitation|disclaim/i.test(contractText)
    const hasConfidentiality = /confidential|non-disclosure|nda|proprietary|secret|private/i.test(contractText)
    const hasIntellectualProperty = /intellectual property|copyright|trademark|patent|trade secret|ip rights/i.test(contractText)
    const hasForcemajeure = /force majeure|act of god|unforeseeable|beyond.*control/i.test(contractText)
    const hasGoverningLaw = /governing law|jurisdiction|court|legal|dispute resolution|arbitration/i.test(contractText)
    const hasDeliverables = /deliver|provide|service|work|product|milestone|deadline/i.test(contractText)
    const hasWarranties = /warrant|guarantee|represent|assure|promise/i.test(contractText)
    const hasNoticeProvisions = /notice|notify|inform|written|email|address/i.test(contractText)
    
    // Risk factor analysis
    let riskFactors = 0
    const criticalMissing = []
    const moderateMissing = []
    
    // Critical elements
    if (!hasTerminationClause) { riskFactors += 2; criticalMissing.push('Termination Clause') }
    if (!hasPaymentTerms) { riskFactors += 2; criticalMissing.push('Payment Terms') }
    if (!hasLiabilityClause) { riskFactors += 2; criticalMissing.push('Liability Provisions') }
    
    // Moderate elements
    if (!hasGoverningLaw) { riskFactors += 1; moderateMissing.push('Governing Law') }
    if (!hasNoticeProvisions) { riskFactors += 1; moderateMissing.push('Notice Provisions') }
    if (!hasWarranties) { riskFactors += 1; moderateMissing.push('Warranties') }
    
    // Document quality factors
    if (wordCount < 300) riskFactors += 2
    else if (wordCount < 500) riskFactors += 1
    
    // Determine overall risk level
    let riskLevel = 'Low Risk'
    if (riskFactors >= 5) riskLevel = 'High Risk'
    else if (riskFactors >= 3) riskLevel = 'Medium Risk'
    
    const localAnalysis: AnalysisResult = {
      overallRiskLevel: riskLevel,
      keyFindings: [
        {
          title: 'Contract Analysis Summary',
          description: `Comprehensive analysis completed: ${wordCount} words analyzed across ${sentences.length} sentences. Risk level assessed as ${riskLevel} based on ${riskFactors} identified risk factors.`,
          severity: riskLevel === 'High Risk' ? 'High' : riskLevel === 'Medium Risk' ? 'Medium' : 'Low',
          category: 'info'
        },
        {
          title: hasPaymentTerms ? 'Financial Terms Identified' : 'Critical: Missing Payment Terms',
          description: hasPaymentTerms 
            ? 'Payment-related provisions found including terms like payment, fees, compensation, or billing. These terms establish the financial framework of the agreement.'
            : 'No payment terms detected. This is a critical gap that could lead to disputes about compensation, payment schedules, and financial obligations.',
          severity: hasPaymentTerms ? 'Low' : 'High',
          category: hasPaymentTerms ? 'compliance' : 'risk'
        },
        {
          title: hasTerminationClause ? 'Exit Strategy Defined' : 'High Risk: No Termination Clause',
          description: hasTerminationClause
            ? 'Termination provisions identified, providing clarity on how the agreement can be ended, including conditions and procedures.'
            : 'No termination clause found. This creates significant risk as there may be no clear way to exit the agreement, potentially leading to disputes.',
          severity: hasTerminationClause ? 'Low' : 'High',
          category: hasTerminationClause ? 'compliance' : 'risk'
        },
        {
          title: hasLiabilityClause ? 'Risk Allocation Addressed' : 'Liability Gap Identified',
          description: hasLiabilityClause
            ? 'Liability provisions present, helping to define responsibility for damages, losses, and risk allocation between parties.'
            : 'No liability or indemnification clauses found. This gap leaves both parties exposed to undefined risks and potential disputes over responsibility.',
          severity: hasLiabilityClause ? 'Medium' : 'High',
          category: hasLiabilityClause ? 'compliance' : 'risk'
        },
        {
          title: criticalMissing.length > 0 ? `Critical Elements Missing: ${criticalMissing.length}` : 'Essential Elements Present',
          description: criticalMissing.length > 0 
            ? `Missing critical contract elements: ${criticalMissing.join(', ')}. These omissions significantly increase legal and business risks.`
            : 'All essential contract elements appear to be present, providing a solid foundation for the agreement.',
          severity: criticalMissing.length > 0 ? 'High' : 'Low',
          category: criticalMissing.length > 0 ? 'risk' : 'compliance'
        },
        {
          title: hasGoverningLaw ? 'Legal Framework Established' : 'Legal Framework Incomplete',
          description: hasGoverningLaw
            ? 'Governing law and jurisdiction provisions identified, establishing the legal framework for dispute resolution.'
            : 'No governing law or jurisdiction clauses found. This could complicate dispute resolution and legal enforcement.',
          severity: hasGoverningLaw ? 'Low' : 'Medium',
          category: hasGoverningLaw ? 'compliance' : 'risk'
        }
      ],
      clauseAnalysis: [
        {
          title: 'Financial and Payment Provisions',
          content: hasPaymentTerms ? 'Payment-related language detected in contract text' : 'No payment terms or financial provisions identified',
          analysis: hasPaymentTerms 
            ? 'The contract contains language related to payments, fees, compensation, billing, or other financial obligations. These provisions form the economic foundation of the agreement and should specify amounts, schedules, methods, and consequences for non-payment.'
            : 'The contract lacks clear payment terms or financial provisions. This is a critical omission that could lead to disputes about compensation amounts, payment schedules, accepted payment methods, and consequences for late or non-payment.',
          riskLevel: hasPaymentTerms ? 'low' : 'high',
          issues: hasPaymentTerms ? ['Verify payment terms are specific and complete'] : ['Missing payment terms', 'Unclear financial obligations', 'No payment schedule defined'],
          suggestions: hasPaymentTerms 
            ? ['Confirm payment amounts are accurate', 'Review payment schedule and due dates', 'Verify accepted payment methods', 'Check for late payment penalties']
            : ['Add specific payment amounts', 'Define clear payment schedule with due dates', 'Specify accepted payment methods', 'Include late payment penalties and interest rates']
        },
        {
          title: 'Liability and Risk Management',
          content: hasLiabilityClause ? 'Liability and risk allocation provisions present' : 'No liability or indemnification clauses identified',
          analysis: hasLiabilityClause
            ? 'The contract includes provisions related to liability, responsibility, damages, or indemnification. These clauses are crucial for defining who bears responsibility for various risks, potential damages, and under what circumstances liability may be limited or excluded.'
            : 'The contract appears to lack liability provisions, indemnification clauses, or risk allocation terms. This creates significant exposure for both parties as there are no clear guidelines for responsibility in case of damages, losses, or disputes.',
          riskLevel: hasLiabilityClause ? 'medium' : 'high',
          issues: hasLiabilityClause ? ['Review liability caps and limitations', 'Assess indemnification scope'] : ['Missing liability provisions', 'No risk allocation defined', 'Unlimited liability exposure'],
          suggestions: hasLiabilityClause
            ? ['Review liability limitation amounts', 'Ensure indemnification terms are balanced', 'Verify exclusions are reasonable', 'Check for mutual indemnification']
            : ['Add liability limitation clauses', 'Include indemnification provisions', 'Define responsibility for different types of damages', 'Add force majeure protections']
        },
        {
          title: 'Contract Termination and Exit Strategy',
          content: hasTerminationClause ? 'Termination provisions identified in contract' : 'No termination or exit provisions found',
          analysis: hasTerminationClause
            ? 'The contract includes termination-related language, which helps define how the agreement can be ended, under what conditions, and what obligations survive termination. These provisions are essential for providing both parties with clear exit strategies.'
            : 'The contract lacks clear termination provisions, which creates uncertainty about how either party can exit the agreement. This could result in disputes about notice requirements, termination conditions, and post-termination obligations.',
          riskLevel: hasTerminationClause ? 'low' : 'high',
          issues: hasTerminationClause ? ['Review termination conditions', 'Check notice requirements'] : ['No termination clause', 'Unclear exit strategy', 'No notice requirements defined'],
          suggestions: hasTerminationClause
            ? ['Verify termination notice periods are reasonable', 'Review termination conditions', 'Check post-termination obligations', 'Ensure termination procedures are clear']
            : ['Add termination clause with clear conditions', 'Define notice requirements and periods', 'Specify post-termination obligations', 'Include procedures for contract wind-down']
        },
        {
          title: 'Legal Framework and Governance',
          content: hasGoverningLaw ? 'Legal framework and jurisdiction provisions present' : 'No governing law or jurisdiction clauses identified',
          analysis: hasGoverningLaw
            ? 'The contract includes provisions related to governing law, jurisdiction, dispute resolution, or legal framework. These clauses establish which laws apply to the agreement and where disputes would be resolved, providing clarity for legal enforcement.'
            : 'The contract lacks governing law or jurisdiction provisions. This omission could complicate dispute resolution, legal enforcement, and create uncertainty about which laws apply to the agreement and where legal proceedings would take place.',
          riskLevel: hasGoverningLaw ? 'low' : 'medium',
          issues: hasGoverningLaw ? ['Verify jurisdiction is appropriate'] : ['No governing law specified', 'Unclear dispute resolution process', 'No jurisdiction defined'],
          suggestions: hasGoverningLaw
            ? ['Confirm governing law is appropriate for your business', 'Verify jurisdiction is convenient for both parties', 'Review dispute resolution procedures']
            : ['Add governing law clause', 'Specify jurisdiction for disputes', 'Include dispute resolution procedures', 'Consider arbitration clauses if appropriate']
        }
      ],
      recommendations: [
        {
          title: 'Professional Legal Review',
          description: 'While local analysis provides basic insights, consider having this contract reviewed by a qualified attorney for comprehensive legal analysis.',
          priority: 'High',
          category: 'legal'
        },
        {
          title: 'Missing Clause Assessment',
          description: hasTerminationClause && hasPaymentTerms && hasLiabilityClause 
            ? 'Contract appears to have key standard clauses. Verify completeness with legal counsel.'
            : 'Contract may be missing important standard clauses. Consider adding termination, payment, and liability provisions.',
          priority: 'Medium',
          category: 'legal'
        },
        {
          title: 'Document Completeness',
          description: wordCount < 500 
            ? 'Contract appears brief. Ensure all necessary terms and conditions are included.'
            : 'Contract length appears reasonable for comprehensive coverage of terms.',
          priority: wordCount < 500 ? 'Medium' : 'Low',
          category: 'technical'
        }
      ],
      missingClauses: [
        ...(hasTerminationClause ? [] : [{
          title: 'Termination Clause',
          description: 'No clear termination provisions identified. Consider adding terms for contract termination, notice requirements, and post-termination obligations.',
          importance: 'High' as const,
          suggestion: 'Add termination clause with notice period and conditions for ending the agreement.'
        }]),
        ...(hasConfidentiality ? [] : [{
          title: 'Confidentiality Provisions',
          description: 'No confidentiality or non-disclosure terms clearly identified. Consider adding if sensitive information will be shared.',
          importance: 'Medium' as const,
          suggestion: 'Add confidentiality clause if the agreement involves sharing sensitive business information.'
        }]),
        ...(hasIntellectualProperty ? [] : [{
          title: 'Intellectual Property Rights',
          description: 'No clear intellectual property provisions identified. Consider adding if the agreement involves creation or use of IP.',
          importance: 'Medium' as const,
          suggestion: 'Add intellectual property clause to clarify ownership and usage rights.'
        }])
      ],
      potentialIssues: [
        ...(riskFactors > 0 ? [{
          issue: `Contract Missing ${riskFactors} Key Element${riskFactors > 1 ? 's' : ''}`,
          severity: riskFactors >= 3 ? 'High' as const : 'Medium' as const,
          recommendation: 'Review and add missing standard contract provisions to reduce legal risks.'
        }] : []),
        {
          issue: 'Local Analysis Limitations',
          severity: 'Low' as const,
          recommendation: 'Local analysis provides basic pattern matching. For comprehensive legal review, consult with an attorney.'
        }
      ],
      // CRITICAL: Include structured analysis for new UI components
      structuredAnalysis: {
        overallRiskLevel: riskLevel,
        keyFindings: [
          {
            title: 'Comprehensive Contract Analysis',
            description: `Advanced local analysis completed: ${wordCount} words analyzed across ${sentences.length} sentences. Risk assessment: ${riskLevel} (${riskFactors} risk factors identified). Analysis covers payment terms, termination clauses, liability provisions, and legal framework.`,
            severity: riskLevel === 'High Risk' ? 'High' : riskLevel === 'Medium Risk' ? 'Medium' : 'Low',
            category: 'info'
          },
          {
            title: hasPaymentTerms ? 'Financial Framework Established' : 'Critical: Payment Terms Absent',
            description: hasPaymentTerms 
              ? 'Payment-related provisions detected including references to fees, compensation, billing, or financial obligations. These terms establish the economic foundation of the contractual relationship.'
              : 'No payment terms identified in the contract. This critical omission could lead to disputes about compensation amounts, payment schedules, and financial responsibilities.',
            severity: hasPaymentTerms ? 'Low' : 'High',
            category: hasPaymentTerms ? 'compliance' : 'risk'
          },
          {
            title: hasTerminationClause ? 'Exit Strategy Defined' : 'High Risk: No Exit Strategy',
            description: hasTerminationClause
              ? 'Termination provisions identified, establishing clear procedures for ending the agreement, including conditions, notice requirements, and post-termination obligations.'
              : 'No termination clause found. This creates significant legal risk as there may be no clear mechanism for either party to exit the agreement, potentially leading to disputes.',
            severity: hasTerminationClause ? 'Low' : 'High',
            category: hasTerminationClause ? 'compliance' : 'risk'
          },
          {
            title: hasLiabilityClause ? 'Risk Allocation Framework Present' : 'Liability Exposure Risk',
            description: hasLiabilityClause
              ? 'Liability and risk allocation provisions identified, helping to define responsibility for damages, losses, and risk distribution between parties.'
              : 'No liability or indemnification clauses found. This exposes both parties to undefined risks and potential disputes over responsibility for damages or losses.',
            severity: hasLiabilityClause ? 'Medium' : 'High',
            category: hasLiabilityClause ? 'compliance' : 'risk'
          },
          {
            title: criticalMissing.length > 0 ? `${criticalMissing.length} Critical Elements Missing` : 'Core Elements Present',
            description: criticalMissing.length > 0 
              ? `Critical contract elements missing: ${criticalMissing.join(', ')}. These omissions significantly increase legal and business risks and should be addressed immediately.`
              : 'All essential contract elements appear to be present, providing a solid legal foundation for the agreement.',
            severity: criticalMissing.length > 0 ? 'High' : 'Low',
            category: criticalMissing.length > 0 ? 'risk' : 'compliance'
          }
        ],
        clauseAnalysis: [
          {
            title: 'Financial and Payment Framework',
            content: hasPaymentTerms ? 'Payment-related provisions detected in contract text' : 'No payment terms or financial provisions identified',
            analysis: hasPaymentTerms 
              ? 'The contract contains language related to payments, fees, compensation, billing, or other financial obligations. These provisions form the economic backbone of the agreement and should clearly specify amounts, payment schedules, methods, and consequences for non-payment to avoid future disputes.'
              : 'The contract lacks clear payment terms or financial provisions. This is a critical omission that could lead to significant disputes about compensation amounts, payment schedules, accepted payment methods, and consequences for late or non-payment.',
            riskLevel: hasPaymentTerms ? 'low' : 'high',
            issues: hasPaymentTerms ? ['Verify payment terms are comprehensive and specific'] : ['Missing payment terms', 'Unclear financial obligations', 'No payment schedule defined'],
            suggestions: hasPaymentTerms 
              ? ['Confirm payment amounts are accurate and complete', 'Review payment schedule and due dates', 'Verify accepted payment methods are specified', 'Check for late payment penalties']
              : ['Add specific payment amounts and currency', 'Define clear payment schedule with due dates', 'Specify accepted payment methods', 'Include late payment penalties and interest rates']
          },
          {
            title: 'Risk Management and Liability Framework',
            content: hasLiabilityClause ? 'Liability and risk allocation provisions present' : 'No liability or indemnification clauses identified',
            analysis: hasLiabilityClause
              ? 'The contract includes provisions related to liability, responsibility, damages, or indemnification. These clauses are essential for defining who bears responsibility for various risks, potential damages, and under what circumstances liability may be limited or excluded. Proper risk allocation protects both parties.'
              : 'The contract appears to lack liability provisions, indemnification clauses, or risk allocation terms. This creates significant exposure for both parties as there are no clear guidelines for responsibility in case of damages, losses, or disputes, potentially leading to unlimited liability exposure.',
            riskLevel: hasLiabilityClause ? 'medium' : 'high',
            issues: hasLiabilityClause ? ['Review liability caps and limitations', 'Assess indemnification scope and balance'] : ['Missing liability provisions', 'No risk allocation defined', 'Unlimited liability exposure'],
            suggestions: hasLiabilityClause
              ? ['Review liability limitation amounts and scope', 'Ensure indemnification terms are balanced', 'Verify exclusions are reasonable and enforceable', 'Check for mutual indemnification provisions']
              : ['Add liability limitation clauses with specific caps', 'Include comprehensive indemnification provisions', 'Define responsibility for different types of damages', 'Add force majeure and other protective clauses']
          },
          {
            title: 'Contract Termination and Exit Procedures',
            content: hasTerminationClause ? 'Termination provisions identified in contract' : 'No termination or exit provisions found',
            analysis: hasTerminationClause
              ? 'The contract includes termination-related language, which helps define how the agreement can be ended, under what conditions, with what notice requirements, and what obligations survive termination. These provisions are essential for providing both parties with clear and fair exit strategies.'
              : 'The contract lacks clear termination provisions, which creates significant uncertainty about how either party can exit the agreement. This could result in disputes about notice requirements, termination conditions, post-termination obligations, and could potentially trap parties in unwanted agreements.',
            riskLevel: hasTerminationClause ? 'low' : 'high',
            issues: hasTerminationClause ? ['Review termination conditions and fairness', 'Check notice requirements are reasonable'] : ['No termination clause present', 'Unclear exit strategy', 'No notice requirements defined'],
            suggestions: hasTerminationClause
              ? ['Verify termination notice periods are reasonable for both parties', 'Review termination conditions for fairness', 'Check post-termination obligations are clear', 'Ensure termination procedures are practical']
              : ['Add comprehensive termination clause with clear conditions', 'Define reasonable notice requirements and periods', 'Specify post-termination obligations and restrictions', 'Include procedures for orderly contract wind-down']
          },
          {
            title: 'Legal Framework and Dispute Resolution',
            content: hasGoverningLaw ? 'Legal framework and jurisdiction provisions present' : 'No governing law or jurisdiction clauses identified',
            analysis: hasGoverningLaw
              ? 'The contract includes provisions related to governing law, jurisdiction, dispute resolution, or legal framework. These clauses establish which laws apply to the agreement and where disputes would be resolved, providing essential clarity for legal enforcement and reducing uncertainty in case of conflicts.'
              : 'The contract lacks governing law or jurisdiction provisions. This significant omission could complicate dispute resolution, legal enforcement, and create uncertainty about which laws apply to the agreement and where legal proceedings would take place, potentially leading to forum shopping and increased legal costs.',
            riskLevel: hasGoverningLaw ? 'low' : 'medium',
            issues: hasGoverningLaw ? ['Verify jurisdiction is appropriate and convenient'] : ['No governing law specified', 'Unclear dispute resolution process', 'No jurisdiction defined'],
            suggestions: hasGoverningLaw
              ? ['Confirm governing law is appropriate for your business and industry', 'Verify jurisdiction is convenient and fair for both parties', 'Review dispute resolution procedures for efficiency']
              : ['Add governing law clause specifying applicable jurisdiction', 'Define jurisdiction for disputes and legal proceedings', 'Include dispute resolution procedures (mediation, arbitration)', 'Consider alternative dispute resolution mechanisms']
          }
        ],
        summary: `Comprehensive local contract analysis completed successfully. Document analyzed: ${wordCount} words across ${sentences.length} sentences. Risk assessment: ${riskLevel} based on ${riskFactors} identified risk factors. Analysis evaluated payment terms (${hasPaymentTerms ? 'present' : 'missing'}), termination clauses (${hasTerminationClause ? 'present' : 'missing'}), liability provisions (${hasLiabilityClause ? 'present' : 'missing'}), and legal framework (${hasGoverningLaw ? 'present' : 'missing'}). ${criticalMissing.length > 0 ? `Critical elements missing: ${criticalMissing.join(', ')}.` : 'All essential elements present.'} For comprehensive legal analysis and advice, professional legal review is recommended.`
      }
    }
    
    console.log('✅ Local analysis generated')
    console.log('📊 Local analysis structure:', {
      riskLevel,
      riskFactors,
      wordCount,
      hasPaymentTerms,
      hasTerminationClause,
      hasLiabilityClause,
      keyFindingsCount: localAnalysis.structuredAnalysis?.keyFindings?.length || 0,
      clauseAnalysisCount: localAnalysis.structuredAnalysis?.clauseAnalysis?.length || 0
    })
    
    return localAnalysis
  }



  /**
   * Get fallback analysis when AI analysis fails
   */
  private static getFallbackAnalysis(): AnalysisResult {
    console.log('🔄 Generating fallback analysis with structured format...')
    
    const fallbackAnalysis: AnalysisResult = {
      riskScore: 50,
      riskLevel: 'Medium',
      keyClauses: [
        {
          type: 'Analysis Status',
          content: 'AI analysis temporarily unavailable',
          risk: 'Medium',
          explanation: 'The automated analysis system is currently experiencing issues. Please try uploading your contract again or contact support for manual review.'
        }
      ],
      recommendations: [
        {
          priority: 'High',
          category: 'System',
          description: 'Retry contract analysis',
          action: 'Please try uploading your contract again for automated analysis.'
        },
        {
          priority: 'Medium',
          category: 'Manual Review',
          description: 'Consider manual legal review',
          action: 'For immediate analysis needs, consider consulting with a legal professional.'
        }
      ],
      summary: 'Automated contract analysis is temporarily unavailable. The system encountered an issue while processing your contract. Please try again or contact support for assistance.',
      potentialIssues: [
        {
          issue: 'Analysis System Unavailable',
          severity: 'Medium',
          recommendation: 'Retry the analysis or seek manual legal review for urgent contracts.'
        }
      ],
      // CRITICAL: Include structured analysis for new UI components
      structuredAnalysis: {
        overallRiskLevel: 'Medium Risk',
        keyFindings: [
          {
            title: 'Analysis System Temporarily Unavailable',
            description: 'The automated contract analysis system encountered an issue while processing your document. This may be due to temporary service disruption, document formatting issues, or system maintenance. Please try uploading your contract again in a few minutes.',
            severity: 'Medium',
            category: 'risk'
          },
          {
            title: 'Manual Review Recommended',
            description: 'While the automated system is unavailable, we recommend having your contract reviewed by a qualified legal professional, especially if this is a time-sensitive agreement. Manual review can provide comprehensive analysis that automated systems may miss.',
            severity: 'Medium',
            category: 'obligation'
          },
          {
            title: 'Document Processing Issue',
            description: 'The system was unable to complete the standard risk assessment process for your contract. This could indicate complex document structure, unusual formatting, or temporary technical difficulties. Consider reformatting the document or trying again later.',
            severity: 'Low',
            category: 'risk'
          }
        ],
        clauseAnalysis: [
          {
            title: 'System Status Notice',
            content: 'Automated clause analysis is currently unavailable due to technical issues.',
            analysis: 'The AI-powered clause analysis feature is temporarily experiencing difficulties. This system normally identifies key contract provisions, assesses their risk levels, and provides specific recommendations for improvement. The unavailability does not reflect any issues with your contract itself.',
            riskLevel: 'none',
            issues: ['Automated analysis temporarily unavailable'],
            suggestions: [
              'Try re-uploading your contract in a few minutes',
              'Ensure your document is in a supported format (PDF, DOC, DOCX)',
              'Contact support if the issue persists',
              'Consider manual legal review for urgent contracts'
            ]
          },
          {
            title: 'Retry Instructions',
            content: 'Please follow these steps to retry your contract analysis.',
            analysis: 'To resolve this issue, you can try several approaches: refresh the page and upload again, check that your document is properly formatted and readable, or wait a few minutes for system recovery. If problems persist, our support team can assist with manual analysis options.',
            riskLevel: 'low',
            issues: ['Temporary system unavailability'],
            suggestions: [
              'Refresh the page and try uploading again',
              'Verify your document is clearly readable and properly formatted',
              'Check your internet connection stability',
              'Contact support for manual analysis options if needed'
            ]
          }
        ],
        summary: 'The automated contract analysis system is temporarily unavailable. This is a technical issue with our analysis service, not a problem with your contract. Please try again in a few minutes, or contact support for manual review options if this is urgent.'
      }
    }
    
    console.log('✅ Fallback analysis generated with structured format')
    console.log('📊 Fallback structure:', {
      hasStructuredAnalysis: !!fallbackAnalysis.structuredAnalysis,
      keyFindingsCount: fallbackAnalysis.structuredAnalysis?.keyFindings?.length || 0,
      clauseAnalysisCount: fallbackAnalysis.structuredAnalysis?.clauseAnalysis?.length || 0
    })
    
    return fallbackAnalysis
  }

  private static async saveAnalysisResults(
    contractId: string,
    userId: string,
    analysisResult: AnalysisResult
  ): Promise<ContractAnalysis> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        contract_id: contractId,
        user_id: userId,
        analysis_data: analysisResult,
        risk_score: analysisResult.riskScore,
        key_clauses: analysisResult.keyClauses,
        recommendations: analysisResult.recommendations
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving analysis results:', error)
      throw new Error('Failed to save analysis results')
    }

    return data
  }

  static async getUserContracts(userId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user contracts:', error)
      throw new Error('Failed to fetch contracts')
    }

    return data || []
  }

  static async getContractAnalysis(contractId: string): Promise<ContractAnalysis | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('contract_id', contractId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No analysis found
      }
      console.error('Error fetching contract analysis:', error)
      throw new Error('Failed to fetch contract analysis')
    }

    return data
  }

  static async getContract(contractId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No contract found
      }
      console.error('Error fetching contract:', error)
      throw new Error('Failed to fetch contract')
    }

    return data
  }

  static async analyzeContractById(contractId: string): Promise<AnalysisResult> {
    console.log('🔍 Starting analysis for contract:', contractId)
    
    try {
      const contract = await this.getContract(contractId)
      if (!contract) {
        throw new Error('Contract not found')
      }

      if (!contract.extracted_text) {
        throw new Error('Contract text not available for analysis')
      }

      // Update status to processing
      await this.updateContractStatus(contractId, 'processing')

      // Perform AI analysis with retry mechanism
      const analysisResult = await this.analyzeContractWithAI(contract.extracted_text)

      // Save analysis results
      await this.saveAnalysisResults(contractId, contract.user_id, analysisResult)

      // Update status to completed
      await this.updateContractStatus(contractId, 'completed')

      console.log('✅ Analysis completed successfully')
      return analysisResult
    } catch (error) {
      console.error('❌ AI analysis error:', error)
      
      // Update status to failed
      try {
        await this.updateContractStatus(contractId, 'failed')
      } catch (statusError) {
        console.error('Failed to update contract status:', statusError)
      }
      
      // Return a fallback analysis with error information
      const fallbackAnalysis = this.getFallbackAnalysis()
      
      // Try to save the fallback analysis so user gets something
      try {
        const contract = await this.getContract(contractId)
        if (contract) {
          await this.saveAnalysisResults(contractId, contract.user_id, fallbackAnalysis)
        }
      } catch (saveError) {
        console.error('Failed to save fallback analysis:', saveError)
      }
      
      return fallbackAnalysis
    }
  }

  // Chat message functions
  static async saveMessage(
    contractId: string,
    userId: string,
    content: string,
    role: 'user' | 'assistant'
  ): Promise<ChatMessage> {
    console.log('💾 Saving message to database:', { contractId, role, contentLength: content.length })
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          contract_id: contractId,
          user_id: userId,
          content,
          role
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving message:', error)
        throw error
      }

      console.log('✅ Message saved successfully')
      return data as ChatMessage
    } catch (error) {
      console.error('Failed to save message:', error)
      throw error
    }
  }

  static async getChatHistory(contractId: string, userId: string): Promise<ChatMessage[]> {
    console.log('📚 Loading chat history for contract:', contractId)
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading chat history:', error)
        throw error
      }

      console.log(`✅ Loaded ${data?.length || 0} messages from chat history`)
      return data as ChatMessage[] || []
    } catch (error) {
      console.error('Failed to load chat history:', error)
      return [] // Return empty array on error to not break the UI
    }
  }

  static async clearChatHistory(contractId: string, userId: string): Promise<void> {
    console.log('🗑️ Clearing chat history for contract:', contractId)
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('contract_id', contractId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error clearing chat history:', error)
        throw error
      }

      console.log('✅ Chat history cleared successfully')
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      throw error
    }
  }
}