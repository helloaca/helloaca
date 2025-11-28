import { supabase } from './supabase'
import { FileProcessor, ProcessedFile } from './fileProcessor'
import { claudeService } from './claude'
import { 
  EnhancedContractAnalysis, 
  validateEnhancedAnalysis,
  LegacyAnalysisData
} from '../types/contractAnalysis'
import jsPDF from 'jspdf'

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
  analysis_data?: EnhancedContractAnalysis & LegacyAnalysisData
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
    let currentContractId: string | null = null
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

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', userId)
        .single()

      if (profile?.plan === 'free') {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        const endOfMonth = new Date(startOfMonth)
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)

        const { count } = await supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startOfMonth.toISOString())
          .lt('created_at', endOfMonth.toISOString())

        if ((count || 0) >= 1) {
          throw new Error('Free plan limit reached for this month')
        }
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

      currentContractId = contractData.id

      // Stage 4: Analyze contract
      onProgress?.('Analyzing contract...', 60)
      const TIMEOUT_MS = 45000
      const analysisResult = await Promise.race([
        this.analyzeContractWithAI(processedFile.text),
        new Promise<EnhancedContractAnalysis>((resolve) => {
          setTimeout(() => {
            resolve(this.generateLocalAnalysis(processedFile.text))
          }, TIMEOUT_MS)
        })
      ])

      // Stage 5: Save analysis results
      onProgress?.('Saving analysis...', 80)
      if (!currentContractId) {
        throw new Error('Contract ID is missing after insertion')
      }
      const analysisData = await this.saveAnalysisResults(currentContractId, userId, analysisResult)

      // Stage 6: Update contract status
      onProgress?.('Finalizing...', 90)
      await supabase
        .from('contracts')
        .update({ analysis_status: 'completed' })
        .eq('id', currentContractId)

      onProgress?.('Complete!', 100)

      return {
        contractId: currentContractId as string,
        analysisId: analysisData.id
      }

    } catch (error) {
      console.error('Contract upload and analysis failed:', error)
      try {
        if (typeof currentContractId === 'string' && currentContractId) {
          await supabase
            .from('contracts')
            .update({ analysis_status: 'failed' })
            .eq('id', currentContractId)
        }
      } catch (updateError) {
        console.error('Failed to update contract status on error:', updateError)
      }
      onProgress?.('Failed', 100)
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
      // Create comprehensive enhanced analysis prompt
      const analysisPrompt = `You are a senior contract attorney with 25+ years of experience. Analyze this contract comprehensively and provide enhanced analysis with executive summary, detailed risk assessment, clause analysis, legal insights, and actionable recommendations.

CONTRACT TEXT TO ANALYZE:
${contractText}

PROVIDE COMPREHENSIVE CONTRACT ANALYSIS WITH ENHANCED STRUCTURE:

1. **EXECUTIVE SUMMARY**
   - Overall risk assessment (1-100 score)
   - Key findings summary (3-4 sentences)
   - Critical issues identified
   - Contract type classification
   - Business impact assessment

2. **DETAILED RISK ASSESSMENT**
   - Overall risk level (Low/Medium/High/Critical)
   - Risk score (1-100)
   - Risk distribution by category
   - Critical vs moderate risks
   - Risk mitigation priorities
   - Time-sensitive issues

3. **COMPREHENSIVE CLAUSE ANALYSIS**
   Analyze across these 11 critical sections:
   
   A. **TITLE & PARTIES**
      Goal: Confirm legal identities and authority
      Check: Legal names, registration numbers, addresses, authorized signatories
      🚩 RED FLAG: Missing business registration or unauthorized signatures
   
   B. **RECITALS (Background/Whereas)**
      Goal: Understand deal intent and context
      Check: Background matches verbal agreement, no scope broadening
      🚩 RED FLAG: Intent mismatch with contract terms
   
   C. **SCOPE OF WORK/SERVICES**
      Goal: Define exact deliverables and standards
      Check: Clear deliverables, performance standards/KPIs, exclusions, acceptance criteria
      🚩 RED FLAG: Vague wording like "as needed" or "to satisfaction of company"
   
   D. **PAYMENT TERMS**
      Goal: Ensure payment happens
      Check: Due dates, currency, milestones, late penalties, refund conditions, invoicing
      🚩 RED FLAG: "Payment upon client acceptance" - if never accepted, never paid
   
   E. **TERM & TERMINATION**
      Goal: Define start/end and exit strategy
      Check: Fixed vs open-ended, termination for cause/convenience, mutual rights, notice periods
      🚩 RED FLAG: Only one side can terminate at will - that's servitude, not partnership
   
   F. **INTELLECTUAL PROPERTY**
      Goal: Protect client's creations
      Check: Pre-existing IP retention, new IP ownership, licensing rights, exclusivity
      🚩 RED FLAG: "All work product belongs to company" - loses pre-existing assets
   
   G. **CONFIDENTIALITY/NON-DISCLOSURE**
      Goal: Protect sensitive info without eternal silence
      Check: Duration, definition of confidential info, exceptions, reasonable scope
      🚩 RED FLAG: "Confidentiality survives indefinitely" - eternal silence
   
   H. **LIABILITY, INDEMNIFICATION & WARRANTIES**
      Goal: Decide who pays when things blow up
      Check: Liability caps, mutual indemnification, indirect damage disclaimers, warranty scope
      🚩 RED FLAG: One-sided indemnification for all losses regardless of fault
   
   I. **DISPUTE RESOLUTION/GOVERNING LAW**
      Goal: Know where/how fights are settled
      Check: Arbitration vs court, jurisdiction, mediation steps, venue
      🚩 RED FLAG: Foreign jurisdiction when client is local - stacks odds against you
   
   J. **BOILERPLATE & MISCELLANEOUS**
      Goal: Catch sneaky provisions
      Check: Entire agreement clause, assignment rights, notice provisions, amendments
      🚩 RED FLAG: Unilateral assignment without consent
   
   K. **SIGNATURE PAGE**
      Goal: Final sanity check
      Check: Signatories identified, consistent dates, match entities from Section 1, proper authority
      🚩 RED FLAG: Missing titles or unauthorized signatures = voidable contract

4. **LEGAL INSIGHTS & RECOMMENDATIONS**
   - Jurisdiction-specific legal considerations
   - Role-based advice (client vs contractor perspectives)
   - Contextual recommendations based on contract type
   - Time-sensitive action items
   - Priority-based recommendation categories

5. **ACTIONABLE RECOMMENDATIONS**
   - Immediate actions required
   - Medium-term improvements
   - Long-term strategic considerations
   - Risk mitigation strategies
   - Negotiation priorities

6. **MISSING CLAUSES IDENTIFICATION**
   - Critical missing provisions
   - Recommended additional clauses
   - Standard industry practices
   - Risk exposure from omissions

RESPONSE FORMAT - Return ONLY this enhanced JSON structure:

{
  "metadata": {
    "contractId": "[unique identifier]",
    "analysisId": "[analysis identifier]",
    "userId": "[user identifier]",
    "userRole": "client" | "contractor" | "legal_counsel",
    "analysisDate": "[ISO 8601 timestamp]",
    "contractType": "[contract type]",
    "wordCount": [number],
    "version": "1.0"
  },
  "executive_summary": {
    "overall_risk_level": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
    "risk_score": [number 1-100],
    "summary": "[3-4 sentence summary of overall risk and key concerns]",
    "key_findings": ["[key finding 1]", "[key finding 2]", "[key finding 3]"],
    "immediate_actions": ["[action 1]", "[action 2]"],
    "contract_overview": {
      "parties": [
        {
          "name": "[party name]",
          "type": "[party type]",
          "role": "[party role]"
        }
      ],
      "contract_value": "[estimated value]",
      "duration": "[contract duration]",
      "key_purpose": "[primary purpose]"
    }
  },
  "risk_assessment": {
    "overall_risk_score": [number 1-100],
    "risk_level": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
    "risk_categories": {
      "financial": {
        "score": [number 1-100],
        "level": "Low" | "Medium" | "High" | "Critical",
        "description": "[financial risk description]"
      },
      "legal": {
        "score": [number 1-100],
        "level": "Low" | "Medium" | "High" | "Critical",
        "description": "[legal risk description]"
      },
      "operational": {
        "score": [number 1-100],
        "level": "Low" | "Medium" | "High" | "Critical",
        "description": "[operational risk description]"
      },
      "strategic": {
        "score": [number 1-100],
        "level": "Low" | "Medium" | "High" | "Critical",
        "description": "[strategic risk description]"
      }
    },
    "critical_risks": [
      {
        "category": "[risk category]",
        "description": "[risk description]",
        "impact": "Low" | "Medium" | "High" | "Critical",
        "probability": "Low" | "Medium" | "High",
        "mitigation": "[mitigation strategy]"
      }
    ],
    "risk_trends": "[risk trend analysis]",
    "mitigation_summary": "[overall mitigation recommendations]"
  },
  "clause_analysis": {
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
      "goal": "Include standard legal provisions and miscellaneous terms",
      "riskLevel": "Medium Risk",
      "status": "Warning",
      "checkItems": [],
      "keyFindings": ["Standard provisions need review"],
      "redFlags": [],
      "recommendations": ["Add standard boilerplate provisions"],
      "hasEntireAgreement": false,
      "hasAssignmentClause": false,
      "hasNoticeProvisions": hasNoticeProvisions,
      "allowsUnilateralAssignment": false
    },
    "signaturePage": {
      "sectionName": "Signature Page",
      "goal": "Ensure proper execution and legal binding",
      "riskLevel": "Low Risk",
      "status": "Pass",
      "checkItems": [],
      "keyFindings": ["Signature requirements assumed present"],
      "redFlags": [],
      "recommendations": ["Verify all required signatures are obtained"],
      "signatorsIdentified": true,
      "datesConsistent": true,
      "matchesEntities": true,
      "hasProperAuthority": true
    }
  },
  "legal_insights": {
    "jurisdiction_advice": [
      {
        "jurisdiction": "[jurisdiction name]",
        "applicable_laws": ["[law 1]", "[law 2]"],
        "compliance_requirements": ["[requirement 1]", "[requirement 2]"],
        "risk_factors": ["[risk 1]", "[risk 2]"],
        "recommendations": ["[recommendation 1]", "[recommendation 2]"]
      }
    ],
    "role_specific_advice": [
      {
        "role": "client" | "contractor" | "legal_counsel",
        "perspective": "[role perspective description]",
        "key_concerns": ["[concern 1]", "[concern 2]"],
        "advantages": ["[advantage 1]", "[advantage 2]"],
        "risks": ["[risk 1]", "[risk 2]"],
        "negotiation_points": ["[point 1]", "[point 2]"]
      }
    ],
    "contextual_recommendations": [
      {
        "category": "immediate" | "medium_term" | "strategic",
        "priority": "critical" | "high" | "medium" | "low",
        "title": "[recommendation title]",
        "description": "[detailed description]",
        "justification": "[why this matters]",
        "implementation": "[how to implement]",
        "time_sensitivity": "urgent" | "soon" | "flexible"
      }
    ]
  },
  "recommendations": {
    "action_items": [
      {
        "id": "[unique identifier]",
        "title": "[action title]",
        "description": "[detailed description]",
        "priority": "critical" | "high" | "medium" | "low",
        "category": "legal" | "financial" | "operational" | "strategic",
        "status": "pending" | "in_progress" | "completed",
        "due_date": "[ISO 8601 date]",
        "assigned_to": "[responsible party]",
        "estimated_effort": "[effort estimate]",
        "potential_impact": "[impact description]",
        "dependencies": ["[dependency 1]", "[dependency 2]"]
      }
    ],
    "negotiation_priorities": [
      {
        "clause": "[clause name]",
        "priority": "critical" | "high" | "medium" | "low",
        "current_issue": "[current problem]",
        "proposed_solution": "[suggested change]",
        "fallback_position": "[alternative solution]",
        "deal_breaker": boolean
      }
    ],
    "missing_clauses": [
      {
        "clause_type": "[clause type]",
        "importance": "critical" | "high" | "medium" | "low",
        "standard_practice": boolean,
        "risk_exposure": "[risk description]",
        "recommended_language": "[suggested clause text]",
        "industry_context": "[industry specific context]"
      }
    ]
  },
  "export_data": {
    "chart_data": [
      {
        "chart_type": "risk_distribution" as const,
        "title": "Risk Distribution Analysis",
        "data": [
          { category: "Financial", score: hasPaymentTerms ? 30 : 80 },
          { category: "Legal", score: !hasGoverningLaw ? 70 : 40 },
          { category: "Operational", score: !hasTerminationClause ? 85 : 35 },
          { category: "Strategic", score: !hasLiabilityClause ? 75 : 45 }
        ],
        description: "Risk scores by category based on clause presence"
      }
    ],
    "annotations": [
      {
        "section": 'Payment Terms',
        "comment": hasPaymentTerms ? 'Standard payment provisions identified' : 'Missing payment terms - critical gap',
        position: { start: 0, end: 100 }
      }
    ]
  }
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
        return this.generateLocalAnalysis(contractText)
      }

      // Validate the structure using the comprehensive validation function
      if (!validateEnhancedAnalysis(enhancedAnalysis)) {
        console.error('❌ AI response structure validation failed')
        console.log('🔄 Falling back to local analysis due to structure validation error')
        return this.generateLocalAnalysis(contractText)
      }

      console.log('✅ Comprehensive AI-powered contract analysis completed successfully')
      console.log(`📊 Risk Assessment Score: ${enhancedAnalysis.risk_assessment?.overall_score ?? 0} (Key risk score: ${enhancedAnalysis.executive_summary?.key_metrics?.risk_score ?? 0})`)
      console.log(`🔍 Critical Clauses Found: ${enhancedAnalysis.clause_analysis?.critical_clauses?.length ?? 0}`)
      console.log(`📋 Action Items Identified: ${enhancedAnalysis.legal_insights?.action_items?.length ?? 0}`)
      console.log(`📋 Missing Clauses Identified: ${enhancedAnalysis.clause_analysis?.missing_clauses?.length ?? 0}`)
      
      return enhancedAnalysis

    } catch (error) {
      console.error('❌ AI analysis failed:', error)
      console.log('🔄 Falling back to local analysis due to AI error')
      
      // Fallback to local analysis if AI fails
      return this.generateLocalAnalysis(contractText)
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
  private static generateLocalAnalysis(contractText: string): EnhancedContractAnalysis {
    // Basic text metrics
    const wordCount = (contractText || '').trim().split(/\s+/).filter(Boolean).length

    // Clause presence detection
    const hasTerminationClause = /terminat(e|ion)|end|expire|cancel|dissolution/i.test(contractText)
    const hasPaymentTerms = /payment|fee|cost|price|amount|compensation|invoice|billing/i.test(contractText)
    const hasLiabilityClause = /liability|liable|damages|indemnif|limitation|disclaim/i.test(contractText)
    const hasGoverningLaw = /governing law|jurisdiction|court|dispute resolution|arbitration/i.test(contractText)
    const hasWarranties = /warrant(y|ies)|guarantee|represent/i.test(contractText)
    const hasNoticeProvisions = /notice|notify|written|email|address/i.test(contractText)

    // Simple risk scoring
    let score = 20
    let riskDistribution = { critical: 0, high: 0, medium: 0, low: 0, safe: 0 }
    const missing: string[] = []

    if (!hasPaymentTerms) { score += 30; riskDistribution.high += 1; missing.push('Payment Terms') }
    if (!hasTerminationClause) { score += 25; riskDistribution.high += 1; missing.push('Termination') }
    if (!hasLiabilityClause) { score += 25; riskDistribution.high += 1; missing.push('Liability') }
    if (!hasGoverningLaw) { score += 15; riskDistribution.medium += 1; missing.push('Governing Law') }
    if (!hasNoticeProvisions) { score += 10; riskDistribution.medium += 1; missing.push('Notice') }
    if (!hasWarranties) { score += 10; riskDistribution.medium += 1; missing.push('Warranties') }

    const overallScore = Math.min(100, score)

    // Map to SafetyRating and Complexity
    const safetyRating: 'Safe' | 'Moderate' | 'Risky' | 'Dangerous' = overallScore < 40 ? 'Safe' : overallScore < 60 ? 'Moderate' : overallScore < 80 ? 'Risky' : 'Dangerous'
    const complexityLevel: 'Simple' | 'Standard' | 'Complex' = wordCount < 500 ? 'Simple' : wordCount < 1500 ? 'Standard' : 'Complex'

    const now = new Date().toISOString()

    const riskLabel = overallScore < 40 ? 'low' : overallScore < 70 ? 'medium' : overallScore < 90 ? 'high' : 'critical'

    const analysis: EnhancedContractAnalysis = {
      metadata: {
        analysisId: `analysis-${Date.now()}`,
        contractId: `local-${Date.now()}`,
        userId: 'local',
        analysisDate: now,
        contractType: 'Service Agreement',
        pageCount: 1,
        wordCount,
        processingTime: 0.2
      },
      executive_summary: {
        contract_overview: {
          type: 'Service Agreement',
          parties: [
            { name: 'Client', type: 'Company', role: 'Client', legal_status: 'Verified' },
            { name: 'Service Provider', type: 'Company', role: 'Service Provider', legal_status: 'Verified' }
          ],
          effective_date: now.split('T')[0],
          contract_term: 'Not specified',
          jurisdiction: hasGoverningLaw ? 'Specified' : 'Unspecified',
          governing_law: hasGoverningLaw ? 'Present' : 'Missing',
          total_value: hasPaymentTerms ? 'Specified' : undefined,
          purpose_summary: 'Automatically generated local analysis summary'
        },
        // UI-friendly optional fields used by ExecutiveSummary component
        overall_risk_level: riskLabel,
        risk_score: overallScore,
        summary: missing.length
          ? `Detected potential gaps: ${missing.join(', ')}. Review and add standard provisions to reduce risk.`
          : 'Key protections present with no major gaps detected.',
        key_findings: [
          hasPaymentTerms ? 'Payment terms specified.' : 'Payment terms missing.',
          hasTerminationClause ? 'Termination provisions present.' : 'Termination clause missing.',
          hasLiabilityClause ? 'Liability and indemnity addressed.' : 'Liability/indemnity missing or limited.'
        ],
        immediate_actions: missing.length
          ? missing.map(m => `Add ${m} clause with standard protections.`)
          : ['Verify fairness of terms and confirm governing law.'],
        key_metrics: {
          risk_score: overallScore,
          safety_rating: safetyRating,
          complexity_level: complexityLevel,
          estimated_review_time: complexityLevel === 'Simple' ? '10-20 minutes' : complexityLevel === 'Standard' ? '20-40 minutes' : '40-90 minutes'
        },
        quick_insights: {
          biggest_risk: missing[0] || 'None detected',
          strongest_protection: hasLiabilityClause ? 'Liability provisions present' : 'Limited protections',
          most_important_clause: 'Payment Terms',
          negotiation_priority: missing.length ? 'Add missing critical clauses' : 'Verify fairness of terms'
        }
      },
      risk_assessment: {
        overall_score: overallScore,
        risk_level: riskLabel,
        // Legacy/UI alias for older components
        overall_risk_score: overallScore,
        risk_distribution: riskDistribution,
        category_breakdown: [
          { category: 'Financial', score: hasPaymentTerms ? 30 : 80, risk_level: hasPaymentTerms ? 'Low' : 'High', clause_count: 1, key_issues: hasPaymentTerms ? [] : ['Missing payment terms'], recommendations: hasPaymentTerms ? [] : ['Add detailed payment provisions'] },
          { category: 'Legal', score: hasGoverningLaw ? 40 : 70, risk_level: hasGoverningLaw ? 'Medium' : 'High', clause_count: 1, key_issues: hasGoverningLaw ? [] : ['No governing law'], recommendations: hasGoverningLaw ? [] : ['Specify governing law and venue'] },
          { category: 'Operational', score: hasTerminationClause ? 35 : 85, risk_level: hasTerminationClause ? 'Low' : 'High', clause_count: 1, key_issues: hasTerminationClause ? [] : ['No termination clause'], recommendations: hasTerminationClause ? [] : ['Add termination with notice'] }
        ],
        // Provide legacy alias to match UI expectations
        risk_categories: [
          { category: 'Financial', score: hasPaymentTerms ? 30 : 80, risk_level: hasPaymentTerms ? 'Low' : 'High', clause_count: 1, key_issues: hasPaymentTerms ? [] : ['Missing payment terms'], recommendations: hasPaymentTerms ? [] : ['Add detailed payment provisions'] },
          { category: 'Legal', score: hasGoverningLaw ? 40 : 70, risk_level: hasGoverningLaw ? 'Medium' : 'High', clause_count: 1, key_issues: hasGoverningLaw ? [] : ['No governing law'], recommendations: hasGoverningLaw ? [] : ['Specify governing law and venue'] },
          { category: 'Operational', score: hasTerminationClause ? 35 : 85, risk_level: hasTerminationClause ? 'Low' : 'High', clause_count: 1, key_issues: hasTerminationClause ? [] : ['No termination clause'], recommendations: hasTerminationClause ? [] : ['Add termination with notice'] }
        ],
        trend_analysis: {
          vs_industry_average: -5,
          vs_similar_contracts: -10,
          risk_trajectory: overallScore < 60 ? 'Improving' : overallScore < 80 ? 'Stable' : 'Declining'
        }
      },
      clause_analysis: {
        total_clauses: 10,
        analyzed_clauses: 6,
        clauses_by_section: [
          {
            section_name: 'Payment Terms',
            section_type: 'Financial',
            clauses: [],
            section_risk_score: hasPaymentTerms ? 30 : 75,
            summary: hasPaymentTerms ? 'Payment terms found.' : 'Missing payment terms.'
          },
          {
            section_name: 'Term & Termination',
            section_type: 'Operational',
            clauses: [],
            section_risk_score: hasTerminationClause ? 35 : 85,
            summary: hasTerminationClause ? 'Termination provisions present.' : 'Missing termination.'
          }
        ],
        critical_clauses: missing.filter(m => ['Payment Terms','Termination','Liability'].includes(m)).map((m, i) => ({
          clause_id: `crit-${i}`,
          clause_type: m,
          risk_level: 'Critical',
          issues: [`Missing ${m}`],
          immediate_actions: [`Add ${m} provisions`],
          escalation_required: false,
          legal_review_recommended: true
        })),
        missing_clauses: missing.map(m => ({
          clauseType: m,
          description: `Missing ${m} clause`,
          importance: 'High',
          riskIfMissing: `Exposure due to absent ${m.toLowerCase()}`,
          suggestedLanguage: `Include standard ${m.toLowerCase()} provisions`
        }))
      },
      legal_insights: {
        contextual_recommendations: [
          {
            id: 'rec-1',
            category: 'Risk Mitigation',
            priority: 'High',
            title: 'Add missing critical clauses',
            description: 'Include payment, termination, and liability provisions.',
            implementation_steps: ['Draft clauses', 'Negotiate terms', 'Update contract'],
            estimated_impact: 'Reduce high-risk exposure',
            time_sensitivity: 'Immediate',
            user_role_context: 'Small Business'
          }
        ],
        jurisdiction_specific: [
          {
            jurisdiction: 'General',
            specific_considerations: ['Venue selection', 'Arbitration vs court'],
            legal_requirements: ['Specify governing law'],
            compliance_notes: ['Ensure enforceability']
          }
        ],
        role_based_advice: [
          {
            role: 'Small Business',
            specific_guidance: ['Clarify scope and deliverables'],
            common_pitfalls: ['Ambiguous payment triggers'],
            negotiation_tips: ['Cap liability', 'Mutual indemnification']
          }
        ],
        action_items: [
          {
            id: 'ai-1',
            title: 'Draft Payment Terms',
            description: 'Add clear payment schedule and late fee policy.',
            priority: 'High',
            status: 'Pending',
            due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString()
          }
        ]
      },
      export_data: {
        pdf_template: 'default-pdf',
        word_template: 'default-docx',
        annotations: [],
        charts_data: [
          { chart_type: 'risk_distribution', data: Object.entries(riskDistribution), configuration: {} }
        ]
      }
    }

    return analysis
  }

  private static async saveAnalysisResults(
    contractId: string,
    userId: string,
    analysisResult: EnhancedContractAnalysis
  ): Promise<ContractAnalysis> {
    const legacy = toLegacyAnalysis(analysisResult)
    const { data, error } = await supabase
      .from('reports')
      .insert({
        contract_id: contractId,
        user_id: userId,
        analysis_data: { ...analysisResult, ...legacy },
        risk_score: analysisResult.executive_summary.key_metrics.risk_score,
        key_clauses: analysisResult.clause_analysis.missing_clauses.map(clause => clause.clauseType),
        recommendations: [
          ...analysisResult.legal_insights.action_items.map(item => item.description),
          ...analysisResult.legal_insights.contextual_recommendations.map(rec => rec.description)
        ]
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
        .select('id,user_id,title,file_name,file_size,upload_date,analysis_status,created_at,updated_at')
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
        .select('id,contract_id,user_id,risk_score,created_at,updated_at')
        .in('contract_id', contractIds)

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError)
        // Don't throw error, just return contracts without analysis
      }

      // Combine contracts with their analysis data and merge legacy fields if needed
      const contractsWithAnalysis = contracts.map(contract => {
        let analysis: any = analyses?.find(a => a.contract_id === contract.id)
        if (analysis?.analysis_data && validateEnhancedAnalysis(analysis.analysis_data)) {
          analysis.analysis_data = { 
            ...analysis.analysis_data, 
            ...toLegacyAnalysis(analysis.analysis_data as EnhancedContractAnalysis)
          }
        }
        return { ...contract, analysis }
      })

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
          // Fallback: attempt to build analysis from contract record if reports entry missing
          const contract = await this.getContract(contractId)
          if (contract) {
            // Prefer any existing analysis_json if present; otherwise generate local analysis
            let enhanced: EnhancedContractAnalysis | null = null
            try {
              if ((contract as any).analysis_json) {
                const aj = (contract as any).analysis_json
                // Minimal mapping into EnhancedContractAnalysis
                const now = new Date().toISOString()
                enhanced = {
                  metadata: {
                    analysisId: `fallback-${contract.id}`,
                    contractId: contract.id,
                    userId: contract.user_id,
                    analysisDate: now,
                    contractType: 'Unknown',
                    pageCount: 1,
                    wordCount: (contract.extracted_text || '').split(/\s+/).filter(Boolean).length,
                    processingTime: 0
                  },
                  executive_summary: {
                    contract_overview: {
                      type: 'Unknown',
                      parties: [],
                      effective_date: now.split('T')[0],
                      contract_term: 'Unknown',
                      jurisdiction: 'Unknown',
                      governing_law: 'Unknown',
                      purpose_summary: aj.summary || aj.structuredAnalysis?.summary || 'No summary available'
                    },
                    overall_risk_level: (aj.riskLevel || aj.structuredAnalysis?.overallRiskLevel || 'medium')?.toString().toLowerCase(),
                    risk_score: aj.riskScore ?? 0,
                    summary: aj.summary || aj.structuredAnalysis?.summary || 'No summary available',
                    key_findings: aj.structuredAnalysis?.keyFindings?.map((f: any) => f.title || f.description) || [],
                    immediate_actions: aj.recommendations?.map((r: any) => r.description) || [],
                    key_metrics: {
                      risk_score: aj.riskScore ?? 0,
                      safety_rating: 'Moderate',
                      complexity_level: 'Standard',
                      estimated_review_time: '20-40 minutes'
                    },
                    quick_insights: {
                      biggest_risk: (aj.potentialIssues?.[0]?.issue) || 'Not available',
                      strongest_protection: 'Not available',
                      most_important_clause: 'Not available',
                      negotiation_priority: 'Review recommendations'
                    }
                  },
                  risk_assessment: {
                    overall_score: aj.riskScore ?? 0,
                    risk_distribution: { critical: 0, high: 0, medium: 0, low: 0, safe: 0 },
                    category_breakdown: [],
                    trend_analysis: { vs_industry_average: 0, vs_similar_contracts: 0, risk_trajectory: 'Stable' }
                  },
                  clause_analysis: {
                    total_clauses: 0,
                    analyzed_clauses: 0,
                    clauses_by_section: [],
                    critical_clauses: [],
                    missing_clauses: (aj.potentialIssues || []).map((pi: any) => ({
                      clauseType: pi.issue,
                      description: pi.recommendation || 'Potential issue',
                      importance: 'Medium',
                      riskIfMissing: 'Unknown',
                      suggestedLanguage: 'N/A'
                    }))
                  },
                  legal_insights: {
                    contextual_recommendations: (aj.recommendations || []).map((r: any, idx: number) => ({
                      id: `rec-${idx}`,
                      category: r.category || 'Risk Mitigation',
                      priority: (r.priority || 'Medium'),
                      title: r.action || 'Recommendation',
                      description: r.description || 'Review clause',
                      implementation_steps: [],
                      estimated_impact: 'Moderate',
                      time_sensitivity: 'Short-term',
                      user_role_context: 'Small Business'
                    })),
                    jurisdiction_specific: [],
                    role_based_advice: [],
                    action_items: []
                  },
                  export_data: { pdf_template: 'default-pdf', word_template: 'default-docx', annotations: [], charts_data: [] }
                }
              } else if (contract.extracted_text) {
                enhanced = this.generateLocalAnalysis(contract.extracted_text)
              }
            } catch {}

            if (enhanced) {
              const saved = await this.saveAnalysisResults(contract.id, contract.user_id, enhanced)
              return saved
            }
          }
          return null
        }
        console.error('Failed to fetch contract analysis:', error)
        throw error
      }

      // Merge legacy fields for compatibility
      if (data?.analysis_data && validateEnhancedAnalysis(data.analysis_data)) {
        data.analysis_data = { 
          ...data.analysis_data, 
          ...toLegacyAnalysis(data.analysis_data as EnhancedContractAnalysis)
        }
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

  static async downloadAnalysisReport(contractId: string): Promise<void> {
    try {
      const contract = await this.getContract(contractId)
      const analysis = await this.getContractAnalysis(contractId)

      if (!contract || !analysis) {
        throw new Error('Contract or analysis not found')
      }

      const data = analysis.analysis_data as EnhancedContractAnalysis
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      doc.setFillColor('#4ECCA3')
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 48, 'F')
      doc.setTextColor('#000000')
      doc.setFontSize(20)
      doc.text('HelloACA', 40, 30)
      doc.setFontSize(12)
      doc.text(`Contract Report: ${contract.title}`, 160, 30)
      doc.setTextColor('#111827')
      let y = 96
      const subtitle = `Contract Report: ${contract.title}`
      const ensurePage = () => { if (y > 780) { doc.addPage(); doc.setFillColor('#4ECCA3'); doc.rect(0, 0, doc.internal.pageSize.getWidth(), 48, 'F'); doc.setTextColor('#000000'); doc.setFontSize(20); doc.text('HelloACA', 40, 30); doc.setFontSize(12); doc.text(subtitle, 160, 30); doc.setTextColor('#111827'); y = 96 } }
      const addText = (text: string) => {
        const wrapped = doc.splitTextToSize(text, 515)
        wrapped.forEach((t: string) => { ensurePage(); doc.text(t, 40, y); y += 18 })
      }
      const addHeading = (text: string) => {
        doc.setFillColor('#4ECCA3')
        doc.rect(40, y - 12, 6, 18, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(text, 60, y)
        doc.setFont('helvetica', 'normal')
        y += 30
      }
      const addLabelValue = (label: string, value: string) => {
        ensurePage()
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 40, y)
        doc.setFont('helvetica', 'normal')
        doc.text(value, 120, y)
        y += 18
      }
      const addItalicPara = (text: string) => {
        const lines = doc.splitTextToSize(text, 515)
        doc.setFont('times', 'italic')
        doc.setFontSize(12)
        lines.forEach((t: string) => { ensurePage(); doc.text(t, 40, y); y += 18 })
        doc.setFont('helvetica', 'normal')
        y += 8
      }
      const overview = (data?.executive_summary as any)?.contract_overview?.purpose_summary || ''
      if (overview) { addHeading('Executive Summary'); addItalicPara(overview) }
      const score = analysis.risk_score ?? data?.executive_summary?.key_metrics?.risk_score
      if (typeof score === 'number') { addHeading('Key Metrics'); addLabelValue('Risk Score', String(score)) }
      const dist = data?.risk_assessment?.risk_distribution
      if (dist) { addLabelValue('Risk Distribution', `Critical ${dist.critical}, High ${dist.high}, Medium ${dist.medium}, Low ${dist.low}, Safe ${dist.safe}`) }
      const missing = data?.clause_analysis?.missing_clauses || []
      if (missing.length > 0) { addHeading('Missing Clauses'); missing.map(m => m.clauseType).forEach(item => addText(`• ${item}`)); y += 8 }
      const recs = [
        ...(data?.legal_insights?.contextual_recommendations || []).map(r => `• ${r.title}: ${r.description}`),
        ...(data?.legal_insights?.action_items || []).map(a => `• ${a.title}: ${a.description}`)
      ]
      if (recs.length > 0) {
        addHeading('Recommendations')
        recs.forEach(addText)
        y += 8
      }
      const w = doc.internal.pageSize.getWidth()
      const h = doc.internal.pageSize.getHeight()
      doc.setFontSize(10)
      doc.setTextColor('#6B7280')
      doc.text('© 2025 HelloACA • helloaca.xyz', 40, h - 24)
      doc.setDrawColor('#E5E7EB')
      doc.line(40, h - 36, w - 40, h - 36)
      doc.setTextColor('#111827')
      doc.save(`contract-analysis-${contract.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
      
      console.log('✅ Analysis PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download analysis report:', error)
      throw error
    }
  }
}

// Legacy adapter: map EnhancedContractAnalysis to legacy analysis_data shape used by UI
function toLegacyAnalysis(analysis: EnhancedContractAnalysis): LegacyAnalysisData {
  const overall_risk_level = (() => {
    const score = analysis.risk_assessment?.overall_score ?? analysis.executive_summary.key_metrics.risk_score
    const safety = analysis.executive_summary.key_metrics.safety_rating
    if (safety === 'Dangerous' || score >= 80) return 'Critical'
    if (safety === 'Risky' || score >= 60) return 'High'
    if (safety === 'Moderate' || score >= 40) return 'Medium'
    return 'Low'
  })()

  const criticalIssues = (analysis.clause_analysis?.critical_clauses || []).map(cc => ({
    category: cc.clause_type,
    description: cc.issues[0] || 'Critical issue detected',
    severity: 'Critical' as const,
    impact: 'High',
    recommendation: cc.immediate_actions[0] || 'Immediate action required'
  }))

  const missingClauses = (analysis.clause_analysis?.missing_clauses || []).map(mc => ({
    clauseType: mc.clauseType,
    description: mc.description,
    importance: mc.importance,
    riskIfMissing: mc.riskIfMissing,
    suggestedLanguage: mc.suggestedLanguage
  }))

  const overallRecommendations = [
    ...(analysis.legal_insights?.contextual_recommendations || []).map(r => r.description),
    ...(analysis.legal_insights?.action_items || []).map(a => a.description)
  ]

  const sections = (analysis.clause_analysis?.clauses_by_section || []).reduce((acc: any, section) => {
    acc[section.section_name] = {
      keyFindings: section.summary ? [section.summary] : [],
      recommendations: section.clauses.flatMap(c => {
        const recs = c.recommendations || []
        return recs.map((r: any) => typeof r === 'string' ? r : r.description)
      }),
      redFlags: section.clauses
        .filter(c => c.risk_level === 'High' || c.risk_level === 'Critical')
        .map(c => {
          const firstRec = (c.recommendations || [])[0] as any
          const recText = typeof firstRec === 'string' ? firstRec : firstRec?.description
          return ({ type: section.section_type, description: c.ai_summary, severity: c.risk_level === 'Critical' ? 'Critical' : 'High', impact: 'High', recommendation: recText || 'Review clause' })
        }),
    }
    return acc
  }, {})

  const chart_data = analysis.export_data?.charts_data || []

  return {
    overall_risk_level,
    riskScore: analysis.executive_summary.key_metrics.risk_score,
    executiveSummary: analysis.executive_summary.contract_overview?.purpose_summary,
    criticalIssues,
    missingClauses,
    overallRecommendations,
    sections,
    chart_data
  }
}