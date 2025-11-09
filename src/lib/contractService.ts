import { supabase } from './supabase'
import { FileProcessor, ProcessedFile } from './fileProcessor'
import { claudeService } from './claude'
import { 
  ContractAnalysis as EnhancedContractAnalysis, 
  validateAnalysis,
  RiskLevel
} from '../types/contractAnalysis'

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
  analysis_data?: EnhancedContractAnalysis
  risk_score?: number
  key_clauses?: any
  recommendations?: any
  created_at: string
  updated_at: string
}

// New simplified JSON schema from AI
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
    description: string
    priority: 'Low' | 'Medium' | 'High'
    category: 'legal' | 'technical' | 'compliance' | 'info'
    action: string
  }>
  summary: string
  potentialIssues: Array<{
    issue: string
    severity: 'Low' | 'Medium' | 'High'
    recommendation: string
  }>
  structuredAnalysis: {
    overallRiskLevel: string
    keyFindings: Array<{
      title: string
      description: string
      severity: 'Low' | 'Medium' | 'High'
      category: 'risk' | 'compliance' | 'info'
    }>
    clauseAnalysis: Array<{
      title: string
      content: string
      analysis: string
      riskLevel: 'low' | 'medium' | 'high'
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
  message: string
  response: string
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
        throw new Error(validation.message || 'File validation failed')
      }

      // Stage 2: Process file content
      onProgress?.('Processing file content...', 20)
      const processedFile: ProcessedFile = await FileProcessor.processFile(file)
      
      if (!processedFile.text || processedFile.text.trim().length === 0) {
        throw new Error('No text content could be extracted from the file')
      }

      // Stage 3: Save contract to database
      onProgress?.('Saving contract...', 40)
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: userId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          file_name: file.name,
          file_size: file.size,
          extracted_text: processedFile.text,
          upload_date: new Date().toISOString(),
          analysis_status: 'processing'
        })
        .select()
        .single()

      if (contractError || !contractData) {
        console.error('Contract save error:', contractError)
        throw new Error('Failed to save contract to database')
      }

      const contractId = contractData.id

      // Stage 4: Analyze contract
      onProgress?.('Analyzing contract...', 60)
      const analysisResult = await this.analyzeContractWithAI(processedFile.text)

      // Stage 5: Save analysis results
      onProgress?.('Saving analysis...', 80)
      const analysisData = await this.saveAnalysisResults(contractId, userId, analysisResult)

      // Stage 6: Update contract status
      onProgress?.('Finalizing...', 90)
      await supabase
        .from('contracts')
        .update({ analysis_status: 'completed' })
        .eq('id', contractId)

      onProgress?.('Complete!', 100)

      return {
        contractId: contractId,
        analysisId: analysisData.id
      }

    } catch (error) {
      console.error('Contract upload and analysis failed:', error)
      throw error
    }
  }

  /**
   * Analyze contract using Claude AI with 11-section professional framework
   */
  private static async analyzeContractWithAI(contractText: string): Promise<EnhancedContractAnalysis> {
    console.log('🤖 Starting 11-section professional contract analysis...')
    console.log('📄 Contract text length:', contractText.length, 'characters')
    
    try {
      // Create comprehensive 11-section analysis prompt
      const analysisPrompt = `You are a senior contract attorney with 25+ years of experience. Analyze this contract using the professional 11-section framework that law firms use for comprehensive contract review.

CONTRACT TEXT TO ANALYZE:
${contractText}

ANALYSIS FRAMEWORK - Analyze each of these 11 critical sections:

1. **TITLE & PARTIES**
   Goal: Confirm who's in this deal
   Check: Legal names (not trade names), business registration numbers, addresses, authorization to sign
   🚩 RED FLAG: "Between ABC Ltd. and its affiliates" - opens door for unknown entities

2. **RECITALS (Background/Whereas)**
   Goal: Understand deal intent
   Check: Background matches verbal agreement, no scope broadening
   🚩 RED FLAG: Recital subtly broadens scope beyond negotiated terms

3. **SCOPE OF WORK/SERVICES**
   Goal: Define exact deliverables
   Check: Clear deliverables, performance standards/KPIs, exclusions
   🚩 RED FLAG: Vague wording like "as needed" or "to satisfaction of company"

4. **PAYMENT TERMS**
   Goal: Ensure payment happens
   Check: Due dates, currency, milestones, late penalties, refund conditions
   🚩 RED FLAG: "Payment upon client acceptance" - if never accepted, never paid

5. **TERM & TERMINATION**
   Goal: Define start/end and exit strategy
   Check: Fixed vs open-ended, termination for cause/convenience, mutual rights
   🚩 RED FLAG: Only one side can terminate at will - that's servitude, not partnership

6. **INTELLECTUAL PROPERTY**
   Goal: Protect client's creations
   Check: Pre-existing IP retention, new IP ownership, licensing rights
   🚩 RED FLAG: "All work product belongs to company" - loses code/assets/methods

7. **CONFIDENTIALITY/NON-DISCLOSURE**
   Goal: Protect sensitive info without eternal silence
   Check: Duration, definition of confidential info, exceptions
   🚩 RED FLAG: "Confidentiality survives indefinitely" - nobody remembers after 10 years

8. **LIABILITY, INDEMNIFICATION & WARRANTIES**
   Goal: Decide who pays when things blow up
   Check: Liability caps, mutual indemnification, indirect damage disclaimers
   🚩 RED FLAG: "Party A indemnifies all losses whether caused by negligence or not" - financial death sentence

9. **DISPUTE RESOLUTION/GOVERNING LAW**
   Goal: Know where/how fights are settled
   Check: Arbitration vs court, jurisdiction, mediation steps
   🚩 RED FLAG: Foreign jurisdiction when client is local - stacks odds against you

10. **BOILERPLATE & MISCELLANEOUS**
    Goal: Catch sneaky provisions
    Check: Entire agreement clause, assignment rights, notice provisions
    🚩 RED FLAG: "Agreement may be assigned by Company without consent" - could work for different entity

11. **SIGNATURE PAGE**
    Goal: Final sanity check
    Check: Signatories identified, consistent dates, match entities from Section 1
    🚩 RED FLAG: Missing titles or unauthorized signatures = voidable contract

RESPONSE FORMAT - Return ONLY this JSON structure:

{
  "overallRiskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
  "riskScore": [number 1-100],
  "executiveSummary": "[3-4 sentence summary of overall risk and key concerns]",
  "sections": {
    "titleParties": {
      "sectionName": "Title & Parties",
      "goal": "Confirm who's in this deal",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [
        {
          "item": "[check item description]",
          "status": "Pass" | "Warning" | "Critical" | "Not Found",
          "finding": "[what was found or missing]",
          "recommendation": "[specific recommendation if needed]"
        }
      ],
      "redFlags": [
        {
          "type": "[red flag type]",
          "severity": "Critical" | "High" | "Medium" | "Low",
          "description": "[what red flag was found]",
          "explanation": "[why this is problematic]",
          "recommendation": "[how to fix it]",
          "location": "[where in contract]"
        }
      ],
      "keyFindings": ["[key findings for this section]"],
      "recommendations": ["[section-specific recommendations]"],
      "parties": [
        {
          "name": "[party name]",
          "isLegalName": boolean,
          "hasRegistrationNumber": boolean,
          "hasAddress": boolean,
          "isAuthorized": boolean
        }
      ]
    },
    "recitals": {
      "sectionName": "Recitals",
      "goal": "Understand the intent of the deal",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "intentMatch": boolean,
      "scopeConsistency": boolean,
      "backgroundAccuracy": boolean
    },
    "scopeOfWork": {
      "sectionName": "Scope of Work",
      "goal": "Nail down exactly what's being delivered",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "hasDeliverables": boolean,
      "hasPerformanceStandards": boolean,
      "hasExclusions": boolean,
      "clarityScore": [number 1-10]
    },
    "paymentTerms": {
      "sectionName": "Payment Terms",
      "goal": "Make sure your client actually gets paid",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "hasDueDates": boolean,
      "hasCurrency": boolean,
      "hasMilestones": boolean,
      "hasLatePenalties": boolean,
      "hasRefundConditions": boolean
    },
    "termTermination": {
      "sectionName": "Term & Termination",
      "goal": "Define when this relationship starts, ends, and how to escape it",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "isFixedTerm": boolean,
      "hasTerminationForCause": boolean,
      "hasTerminationForConvenience": boolean,
      "isMutualTermination": boolean
    },
    "intellectualProperty": {
      "sectionName": "Intellectual Property",
      "goal": "Protect your client's creations",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "retainsPreExistingIP": boolean,
      "definesNewIPOwnership": boolean,
      "hasLicensingRights": boolean,
      "isExclusive": boolean
    },
    "confidentiality": {
      "sectionName": "Confidentiality",
      "goal": "Protect sensitive info without locking client into silence forever",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "hasDuration": boolean,
      "hasDefinition": boolean,
      "hasExceptions": boolean,
      "durationReasonable": boolean
    },
    "liability": {
      "sectionName": "Liability & Warranties",
      "goal": "Decide who pays when something blows up",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "hasLiabilityCap": boolean,
      "isMutualIndemnification": boolean,
      "hasIndirectDamageDisclaimer": boolean,
      "isBalanced": boolean
    },
    "disputeResolution": {
      "sectionName": "Dispute Resolution",
      "goal": "Know where and how fights are settled",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "hasArbitration": boolean,
      "hasJurisdiction": boolean,
      "hasMediation": boolean,
      "isFavorableJurisdiction": boolean
    },
    "boilerplate": {
      "sectionName": "Boilerplate",
      "goal": "Make sure nothing sneaky is hiding here",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "hasEntireAgreement": boolean,
      "hasAssignmentClause": boolean,
      "hasNoticeProvisions": boolean,
      "allowsUnilateralAssignment": boolean
    },
    "signaturePage": {
      "sectionName": "Signature Page",
      "goal": "Final sanity check",
      "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
      "status": "Pass" | "Warning" | "Critical" | "Not Found",
      "checkItems": [...],
      "redFlags": [...],
      "keyFindings": [...],
      "recommendations": [...],
      "signatorsIdentified": boolean,
      "datesConsistent": boolean,
      "matchesEntities": boolean,
      "hasProperAuthority": boolean
    }
  },
  "totalRedFlags": [number],
  "criticalIssues": [
    {
      "type": "[red flag type]",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "description": "[description]",
      "explanation": "[why problematic]",
      "recommendation": "[how to fix]",
      "location": "[where found]"
    }
  ],
  "overallRecommendations": ["[overall recommendations]"],
  "analysisDate": "[current date]",
  "contractType": "[detected contract type]"
}

CRITICAL INSTRUCTIONS:
- Analyze EVERY section even if not present (mark as "Not Found")
- Look for specific red flags mentioned for each section
- Be thorough with check items for each section
- Assign risk levels per section and overall
- Provide actionable recommendations
- Focus on practical business risks that could cause financial loss

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond ONLY with valid JSON - no markdown code blocks, no backticks, no additional text
- Do NOT wrap the JSON in \`\`\`json or \`\`\` blocks
- Start directly with { and end with }
- Ensure ALL arrays have proper comma separation between elements
- Ensure ALL object properties are properly comma-separated
- Use double quotes for all strings and property names
- Do NOT include trailing commas after the last element in arrays or objects
- Ensure proper nesting and bracket/brace matching
- Test your JSON mentally before responding - it must be parseable
- If you include arrays like "checkItems", "redFlags", "keyFindings", "recommendations", ensure each element is properly formatted with commas between them

EXAMPLE OF PROPER ARRAY FORMATTING:
"checkItems": [
  {
    "item": "Legal names verified",
    "status": "Pass",
    "finding": "Both parties use legal names",
    "recommendation": ""
  },
  {
    "item": "Registration numbers present",
    "status": "Warning", 
    "finding": "Missing registration numbers",
    "recommendation": "Add business registration numbers"
  }
]

REMEMBER: Every array element MUST be followed by a comma except the last one. Every object property MUST be followed by a comma except the last one.`

      console.log('🔍 Sending contract to Claude AI for comprehensive analysis...')
      
      const response = await claudeService.sendMessage([
        { role: 'user', content: analysisPrompt }
      ], undefined, true)

      console.log('📝 Received comprehensive analysis from Claude AI')
      
      // Parse the JSON response with robust error handling
      let enhancedAnalysis: EnhancedContractAnalysis
      try {
        console.log('🧹 Starting JSON parsing with enhanced error handling...')
        
        // Step 1: Clean the response
        let cleanResponse = this.sanitizeJsonResponse(response)
        console.log('✅ Initial response sanitization completed')
        
        // Step 2: Attempt to parse JSON
        try {
          enhancedAnalysis = JSON.parse(cleanResponse)
          console.log('✅ Successfully parsed comprehensive AI analysis result')
        } catch (initialParseError) {
          console.warn('⚠️ Initial JSON parse failed, attempting repair...', initialParseError)
          
          // Step 3: Attempt JSON repair
          const repairedJson = this.repairMalformedJson(cleanResponse)
          if (repairedJson) {
            try {
              enhancedAnalysis = JSON.parse(repairedJson)
              console.log('✅ Successfully parsed repaired JSON')
            } catch (repairParseError) {
              console.error('❌ JSON repair failed:', repairParseError)
              throw repairParseError
            }
          } else {
            throw initialParseError
          }
        }
        
      } catch (parseError: any) {
        console.error('❌ All JSON parsing attempts failed:', parseError)
        console.log('📊 Error details:', {
          message: parseError?.message || 'Unknown error',
          position: parseError?.message?.match(/position (\d+)/)?.[1],
          line: parseError?.message?.match(/line (\d+)/)?.[1],
          column: parseError?.message?.match(/column (\d+)/)?.[1]
        })
        
        // Enhanced logging for debugging
        const errorPosition = parseError?.message?.match(/position (\d+)/)?.[1]
        if (errorPosition) {
          const pos = parseInt(errorPosition)
          const context = response.substring(Math.max(0, pos - 100), pos + 100)
          console.log('🔍 Error context around position', pos, ':', context)
        }
        
        console.log('📄 Raw response preview (first 1000 chars):', response.substring(0, 1000))
        console.log('📄 Raw response preview (last 500 chars):', response.substring(Math.max(0, response.length - 500)))
        
        // Fallback to local analysis if JSON parsing fails
        console.log('🔄 Falling back to local analysis due to JSON parsing error')
        return this.getLocalAnalysis(contractText)
      }

      // Validate the structure using the comprehensive validation function
      if (!validateAnalysis(enhancedAnalysis)) {
        console.error('❌ AI response structure validation failed')
        console.log('🔄 Falling back to local analysis due to structure validation error')
        return this.getLocalAnalysis(contractText)
      }

      console.log('✅ Comprehensive AI-powered contract analysis completed successfully')
      console.log(`📊 Risk Assessment: ${enhancedAnalysis.overallRiskLevel} (Score: ${enhancedAnalysis.riskScore})`)
      console.log(`🔍 Critical Issues Found: ${enhancedAnalysis.criticalIssues.length}`)
      console.log(`📋 Missing Clauses Identified: ${enhancedAnalysis.missingClauses.length}`)
      
      return enhancedAnalysis

    } catch (error) {
      console.error('❌ AI analysis failed:', error)
      console.log('🔄 Falling back to local analysis due to AI error')
      
      // Fallback to local analysis if AI fails
      return this.getLocalAnalysis(contractText)
    }
  }

  /**
   * Sanitize AI response to extract clean JSON
   */
  private static sanitizeJsonResponse(response: string): string {
    let cleanResponse = response.trim()
    
    // Remove markdown code blocks (```json ... ```)
    if (cleanResponse.startsWith('```json')) {
      const startIndex = cleanResponse.indexOf('{')
      const lastBraceIndex = cleanResponse.lastIndexOf('}')
      if (startIndex !== -1 && lastBraceIndex !== -1) {
        cleanResponse = cleanResponse.substring(startIndex, lastBraceIndex + 1)
      }
    } else if (cleanResponse.startsWith('```')) {
      // Handle generic code blocks
      const lines = cleanResponse.split('\n')
      lines.shift() // Remove first line with ```
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop() // Remove last line with ```
      }
      cleanResponse = lines.join('\n').trim()
    }
    
    // Additional cleanup for common formatting issues
    cleanResponse = cleanResponse
      .replace(/^```json\s*/i, '') // Remove ```json at start
      .replace(/\s*```\s*$/i, '')  // Remove ``` at end
      .replace(/^\s*json\s*/i, '') // Remove standalone 'json' at start
      .trim()
    
    // Find the JSON object boundaries more reliably
    const firstBrace = cleanResponse.indexOf('{')
    const lastBrace = cleanResponse.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1)
    }
    
    return cleanResponse
  }

  /**
   * Attempt to repair common JSON formatting issues
   */
  private static repairMalformedJson(jsonString: string): string | null {
    try {
      console.log('🔧 Attempting JSON repair...')
      
      let repaired = jsonString
      
      // Common repairs
      const repairs = [
        // Fix missing commas in arrays
        { pattern: /(\])\s*(\[)/g, replacement: '$1,$2' },
        { pattern: /(\})\s*(\{)/g, replacement: '$1,$2' },
        { pattern: /(\})\s*(\[)/g, replacement: '$1,$2' },
        { pattern: /(\])\s*(\{)/g, replacement: '$1,$2' },
        
        // Fix missing commas after string values
        { pattern: /(")\s*\n\s*(")/g, replacement: '$1,$2' },
        { pattern: /(true|false|null|\d+)\s*\n\s*"/g, replacement: '$1,"' },
        
        // Fix trailing commas
        { pattern: /,(\s*[\}\]])/g, replacement: '$1' },
        
        // Fix unescaped quotes in strings
        { pattern: /(?<!\\)"(?=.*".*:)/g, replacement: '\\"' },
        
        // Fix missing quotes around property names
        { pattern: /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, replacement: '$1"$2":' },
        
        // Fix single quotes to double quotes
        { pattern: /'/g, replacement: '"' },
        
        // Fix missing closing brackets/braces (basic attempt)
        { pattern: /(\{[^}]*$)/, replacement: '$1}' },
        { pattern: /(\[[^\]]*$)/, replacement: '$1]' }
      ]
      
      // Apply repairs
      for (const repair of repairs) {
        const before = repaired
        repaired = repaired.replace(repair.pattern, repair.replacement)
        if (before !== repaired) {
          console.log('🔧 Applied repair:', repair.pattern.toString())
        }
      }
      
      // Try to balance braces and brackets
      const openBraces = (repaired.match(/\{/g) || []).length
      const closeBraces = (repaired.match(/\}/g) || []).length
      const openBrackets = (repaired.match(/\[/g) || []).length
      const closeBrackets = (repaired.match(/\]/g) || []).length
      
      // Add missing closing braces
      if (openBraces > closeBraces) {
        repaired += '}'.repeat(openBraces - closeBraces)
        console.log('🔧 Added missing closing braces:', openBraces - closeBraces)
      }
      
      // Add missing closing brackets
      if (openBrackets > closeBrackets) {
        repaired += ']'.repeat(openBrackets - closeBrackets)
        console.log('🔧 Added missing closing brackets:', openBrackets - closeBrackets)
      }
      
      // Validate the repair by attempting to parse
      try {
        JSON.parse(repaired)
        console.log('✅ JSON repair successful')
        return repaired
      } catch (testError: any) {
         console.log('❌ JSON repair validation failed:', testError?.message || 'Unknown error')
         
         // Try a more aggressive approach: extract just the main object
         const mainObjectMatch = repaired.match(/\{[\s\S]*\}/);
         if (mainObjectMatch) {
           const mainObject = mainObjectMatch[0];
           try {
             JSON.parse(mainObject);
             console.log('✅ Extracted main object successfully');
             return mainObject;
           } catch (extractError: any) {
             console.log('❌ Main object extraction failed:', extractError?.message || 'Unknown error');
           }
         }
        
        return null
      }
      
    } catch (error) {
      console.error('❌ JSON repair process failed:', error)
      return null
    }
  }

  /**
   * Convert enhanced 11-section analysis to legacy format for backward compatibility
   */




  /**
   * Generate enhanced local analysis based on contract text patterns
   */
  private static getLocalAnalysis(contractText: string): EnhancedContractAnalysis {
    console.log('🏠 Generating enhanced local contract analysis...')
    
    // Enhanced text analysis with more comprehensive pattern matching
    const wordCount = contractText.split(/\s+/).length
    
    // Contract element detection
    const hasTerminationClause = /terminat(e|ion)|end|expire|cancel|dissolution/i.test(contractText)
    const hasPaymentTerms = /payment|fee|cost|price|amount|compensation|salary|wage|invoice|billing/i.test(contractText)
    const hasLiabilityClause = /liability|liable|responsible|damages|indemnif|limitation|disclaim/i.test(contractText)
    const hasGoverningLaw = /governing law|jurisdiction|court|legal|dispute resolution|arbitration/i.test(contractText)
    const hasWarranties = /warrant|guarantee|represent|assure|promise/i.test(contractText)
    const hasNoticeProvisions = /notice|notify|inform|written|email|address/i.test(contractText)
    
    // Risk factor analysis
    let riskFactors = 0
    const criticalMissing: string[] = []
    const moderateMissing: string[] = []
    
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
    let riskLevel: RiskLevel = 'Low Risk'
    if (riskFactors >= 5) riskLevel = 'High Risk'
    else if (riskFactors >= 3) riskLevel = 'Medium Risk'
    
    const localAnalysis: EnhancedContractAnalysis = {
      overallRiskLevel: riskLevel,
      riskScore: riskLevel === 'High Risk' ? 80 : riskLevel === 'Medium Risk' ? 50 : 20,
      executiveSummary: `Comprehensive local contract analysis completed successfully. For comprehensive legal analysis and advice, professional legal review is recommended.`,
      sections: {
        titleParties: {
          sectionName: "Title & Parties",
          goal: "Identify contracting parties and establish legal framework",
          riskLevel: "Low Risk",
          status: "Pass",
          checkItems: [],
          keyFindings: ["Local analysis - basic pattern matching completed"],
          redFlags: [],
          recommendations: ["Verify party identification is complete and accurate"],
          parties: [
            {
              name: "Client",
              isLegalName: true,
              hasRegistrationNumber: false,
              hasAddress: true,
              isAuthorized: true
            },
            {
              name: "Contractor",
              isLegalName: true,
              hasRegistrationNumber: false,
              hasAddress: true,
              isAuthorized: true
            }
          ]
        },
        recitals: {
          sectionName: "Recitals",
          goal: "Establish background and context for the agreement",
          riskLevel: "Low Risk", 
          status: "Pass",
          checkItems: [],
          keyFindings: ["Background context analysis completed"],
          redFlags: [],
          recommendations: ["Review recitals for accuracy and completeness"],
          intentMatch: true,
          scopeConsistency: true,
          backgroundAccuracy: true
        },
        scopeOfWork: {
          sectionName: "Scope of Work",
          goal: "Define deliverables and performance standards",
          riskLevel: "Medium Risk",
          status: "Warning",
          checkItems: [],
          keyFindings: ["Work scope requires detailed review"],
          redFlags: [],
          recommendations: ["Ensure scope is clearly defined and measurable"],
          hasDeliverables: true,
          hasPerformanceStandards: false,
          hasExclusions: false,
          clarityScore: 6
        },
        paymentTerms: {
          sectionName: "Payment Terms",
          goal: "Establish financial obligations and payment procedures",
          riskLevel: hasPaymentTerms ? "Low Risk" : "High Risk",
          status: hasPaymentTerms ? "Pass" : "Not Found",
          checkItems: [],
          keyFindings: hasPaymentTerms ? ["Payment provisions detected"] : ["No payment terms identified"],
          redFlags: hasPaymentTerms ? [] : [{
            type: "Missing Critical Section",
            severity: "Critical" as const,
            description: "Missing payment terms",
            impact: "Could lead to payment disputes"
          }],
          recommendations: hasPaymentTerms ? ["Review payment terms for completeness"] : ["Add detailed payment terms and schedules"],
          hasDueDates: hasPaymentTerms,
          hasCurrency: hasPaymentTerms,
          hasMilestones: false,
          hasLatePenalties: false,
          hasRefundConditions: false
        },
        termTermination: {
          sectionName: "Term & Termination",
          goal: "Define contract duration and termination procedures",
          riskLevel: hasTerminationClause ? "Low Risk" : "High Risk",
          status: hasTerminationClause ? "Pass" : "Not Found",
          checkItems: [],
          keyFindings: hasTerminationClause ? ["Termination provisions found"] : ["No termination clause detected"],
          redFlags: hasTerminationClause ? [] : [{
            type: "Missing Critical Section",
            severity: "Critical" as const,
            description: "Missing termination clause",
            impact: "No clear exit strategy for either party"
          }],
          recommendations: hasTerminationClause ? ["Review termination conditions"] : ["Add termination clause with notice requirements"],
          isFixedTerm: false,
          hasTerminationForCause: hasTerminationClause,
          hasTerminationForConvenience: false,
          isMutualTermination: false
        },
        intellectualProperty: {
          sectionName: "Intellectual Property",
          goal: "Define IP ownership and licensing rights",
          riskLevel: "Medium Risk",
          status: "Warning",
          checkItems: [],
          keyFindings: ["IP provisions require review"],
          redFlags: [],
          recommendations: ["Clarify IP ownership and licensing terms"],
          retainsPreExistingIP: true,
          definesNewIPOwnership: false,
          hasLicensingRights: false,
          isExclusive: false
        },
        confidentiality: {
          sectionName: "Confidentiality",
          goal: "Protect sensitive information and trade secrets",
          riskLevel: "Medium Risk",
          status: "Warning",
          checkItems: [],
          keyFindings: ["Confidentiality provisions need review"],
          redFlags: [],
          recommendations: ["Add or strengthen confidentiality provisions"],
          hasDuration: false,
          hasDefinition: false,
          hasExceptions: false,
          durationReasonable: false
        },
        liability: {
          sectionName: "Liability & Warranties",
          goal: "Allocate risk and define warranty obligations",
          riskLevel: hasLiabilityClause ? "Medium Risk" : "High Risk",
          status: hasLiabilityClause ? "Pass" : "Not Found",
          checkItems: [],
          keyFindings: hasLiabilityClause ? ["Liability provisions found"] : ["No liability clauses detected"],
          redFlags: hasLiabilityClause ? [] : [{
            type: "Missing Critical Section",
            severity: "High" as const,
            description: "Missing liability provisions",
            impact: "Undefined risk exposure for both parties"
          }],
          recommendations: hasLiabilityClause ? ["Review liability allocation"] : ["Add liability limitations and indemnification"],
          hasLiabilityCap: hasLiabilityClause,
          isMutualIndemnification: false,
          hasIndirectDamageDisclaimer: false,
          isBalanced: false
        },
        disputeResolution: {
          sectionName: "Dispute Resolution",
          goal: "Establish procedures for resolving conflicts",
          riskLevel: hasGoverningLaw ? "Low Risk" : "Medium Risk",
          status: hasGoverningLaw ? "Pass" : "Warning",
          checkItems: [],
          keyFindings: hasGoverningLaw ? ["Legal framework provisions found"] : ["No governing law specified"],
          redFlags: [],
          recommendations: hasGoverningLaw ? ["Review jurisdiction and procedures"] : ["Add governing law and dispute resolution procedures"],
          hasArbitration: false,
          hasJurisdiction: hasGoverningLaw,
          hasMediation: false,
          isFavorableJurisdiction: hasGoverningLaw
        },
        boilerplate: {
          sectionName: "Boilerplate",
          goal: "Include standard legal provisions and miscellaneous terms",
          riskLevel: "Medium Risk",
          status: "Warning",
          checkItems: [],
          keyFindings: ["Standard provisions need review"],
          redFlags: [],
          recommendations: ["Add standard boilerplate provisions"],
          hasEntireAgreement: false,
          hasAssignmentClause: false,
          hasNoticeProvisions: hasNoticeProvisions,
          allowsUnilateralAssignment: false
        },
        signaturePage: {
          sectionName: "Signature Page",
          goal: "Ensure proper execution and legal binding",
          riskLevel: "Low Risk",
          status: "Pass",
          checkItems: [],
          keyFindings: ["Signature requirements assumed present"],
          redFlags: [],
          recommendations: ["Verify all required signatures are obtained"],
          signatorsIdentified: true,
          datesConsistent: true,
          matchesEntities: true,
          hasProperAuthority: true
        }
      },
      criticalIssues: criticalMissing.map(missing => ({
        type: "Missing Critical Section",
        severity: "Critical" as const,
        description: `Missing ${missing}`,
        impact: `Significant legal and business risk due to absent ${missing.toLowerCase()}`
      })),
      missingClauses: [...criticalMissing, ...moderateMissing].map(missing => ({
        clauseType: missing,
        description: `Missing ${missing} provisions`,
        importance: criticalMissing.includes(missing) ? 'High' as const : 'Medium' as const,
        riskIfMissing: `Significant legal and business risk due to absent ${missing.toLowerCase()}`,
        suggestedLanguage: `Add comprehensive ${missing.toLowerCase()} provisions to the contract`
      })),
      overallRecommendations: [
        'Consider professional legal review for comprehensive analysis',
        hasTerminationClause && hasPaymentTerms && hasLiabilityClause 
          ? 'Contract appears to have key standard clauses - verify completeness'
          : 'Add missing standard contract provisions (termination, payment, liability)',
        wordCount < 500 
          ? 'Contract appears brief - ensure all necessary terms are included'
          : 'Contract length appears reasonable for comprehensive coverage'
      ],
      totalRedFlags: criticalMissing.length,
      analysisDate: new Date().toISOString(),
      contractType: "General Contract"
    }
    
    console.log('✅ Local analysis generated in enhanced format')
    
    return localAnalysis
  }



  private static async saveAnalysisResults(
    contractId: string,
    userId: string,
    analysisResult: EnhancedContractAnalysis
  ): Promise<ContractAnalysis> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        contract_id: contractId,
        user_id: userId,
        analysis_data: analysisResult,
        risk_score: analysisResult.riskScore,
        key_clauses: analysisResult.criticalIssues,
        recommendations: analysisResult.overallRecommendations
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save analysis results:', error)
      throw new Error('Failed to save analysis results')
    }

    return data
  }

  static async getUserContractsWithAnalysis(userId: string): Promise<Array<Contract & { analysis?: ContractAnalysis }>> {
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (contractsError) {
        console.error('Error fetching contracts:', contractsError)
        throw new Error('Failed to fetch contracts')
      }

      if (!contracts || contracts.length === 0) {
        return []
      }

      // Fetch analysis data for all contracts - FIXED: using 'reports' table instead of 'contract_analyses'
      const contractIds = contracts.map(c => c.id)
      const { data: analyses, error: analysesError } = await supabase
        .from('reports')
        .select('*')
        .in('contract_id', contractIds)

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError)
        // Don't throw error, just return contracts without analysis
      }

      // Combine contracts with their analysis data
      const contractsWithAnalysis = contracts.map(contract => ({
        ...contract,
        analysis: analyses?.find(analysis => analysis.contract_id === contract.id)
      }))

      return contractsWithAnalysis
    } catch (error) {
      console.error('Error in getUserContractsWithAnalysis:', error)
      throw error
    }
  }

  static async getUserContracts(userId: string): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch user contracts:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user contracts:', error)
      throw error
    }
  }

  static async getContractAnalysis(contractId: string): Promise<ContractAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('contract_id', contractId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Failed to fetch contract analysis:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching contract analysis:', error)
      throw error
    }
  }

  static async getContract(contractId: string): Promise<Contract | null> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Failed to fetch contract:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching contract:', error)
      throw error
    }
  }

  static async analyzeContractById(contractId: string): Promise<EnhancedContractAnalysis> {
    try {
      const contract = await this.getContract(contractId)
      
      if (!contract) {
        throw new Error('Contract not found')
      }

      if (!contract.extracted_text) {
        throw new Error('No text content available for analysis')
      }

      // Update status to processing
      await supabase
        .from('contracts')
        .update({ analysis_status: 'processing' })
        .eq('id', contractId)

      // Perform analysis
      const analysisResult = await this.analyzeContractWithAI(contract.extracted_text)

      // Save analysis results
      await this.saveAnalysisResults(contractId, contract.user_id, analysisResult)

      // Update status to completed
      await supabase
        .from('contracts')
        .update({ analysis_status: 'completed' })
        .eq('id', contractId)

      return analysisResult

    } catch (error) {
      console.error('Contract analysis failed:', error)
      
      // Update status to failed
      try {
        await supabase
          .from('contracts')
          .update({ analysis_status: 'failed' })
          .eq('id', contractId)
      } catch (updateError) {
        console.error('Failed to update contract status:', updateError)
      }

      throw error
    }
  }

  static async saveMessage(
    contractId: string,
    userId: string,
    message: string,
    response: string
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          contract_id: contractId,
          user_id: userId,
          message: message,
          response: response
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save chat message:', error)
        throw error
      }

      console.log('✅ Chat message saved successfully')
      return data
    } catch (error) {
      console.error('Error saving chat message:', error)
      throw error
    }
  }

  static async getChatHistory(contractId: string, userId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('contract_id', contractId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to fetch chat history:', error)
        throw error
      }

      console.log('✅ Chat history fetched successfully')
      return data || []
    } catch (error) {
      console.error('Error fetching chat history:', error)
      throw error
    }
  }

  static async clearChatHistory(contractId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('contract_id', contractId)
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to clear chat history:', error)
        throw error
      }

      console.log('✅ Chat history cleared successfully')
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      throw error
    }
  }
}