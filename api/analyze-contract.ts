import { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_CLAUDE_API_KEY,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { contractText, contractId } = req.body

    // Validate request body
    if (!contractText || typeof contractText !== 'string') {
      return res.status(400).json({ error: 'Contract text is required' })
    }

    if (contractText.length > 100000) {
      return res.status(400).json({ error: 'Contract text too long (max 100,000 characters)' })
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY && !process.env.VITE_CLAUDE_API_KEY) {
      console.error('Missing Anthropic API key')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    console.log('🤖 Starting AI contract analysis for contract:', contractId)
    console.log('📄 Contract text length:', contractText.length, 'characters')

    // Build analysis prompt
    const prompt = buildAnalysisPrompt(contractText)

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    if (!response.content || !response.content[0] || response.content[0].type !== 'text') {
      console.error('❌ Invalid Claude API response structure:', response)
      throw new Error('Invalid response structure from Claude API')
    }

    const aiResponse = response.content[0].text
    console.log('✅ Claude API response received')
    console.log('🔍 AI response length:', aiResponse.length, 'characters')

    // Parse and validate the AI response
    let parsedAnalysis
    try {
      parsedAnalysis = parseAnalysisResponse(aiResponse)
      console.log('✅ AI response parsed successfully')
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      console.log('🔍 Raw AI response preview:', aiResponse.substring(0, 500) + '...')
      
      // Return fallback analysis
      return res.status(200).json(getFallbackAnalysis())
    }

    // Validate the parsed analysis
    try {
      validateAnalysis(parsedAnalysis)
      console.log('✅ Analysis validation passed')
    } catch (validationError) {
      console.error('❌ Analysis validation failed:', validationError)
      return res.status(200).json(getFallbackAnalysis())
    }

    // Return successful analysis
    return res.status(200).json({
      success: true,
      analysis: parsedAnalysis,
      contractId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Contract analysis error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({ error: 'Unauthorized - Invalid API key' })
      } else if (error.message.includes('rate limit')) {
        return res.status(429).json({ error: 'Rate limit exceeded - Please try again later' })
      } else if (error.message.includes('timeout')) {
        return res.status(408).json({ error: 'Request timeout - Please try again' })
      }
    }

    // Return fallback analysis for any other errors
    return res.status(200).json(getFallbackAnalysis())
  }
}

function buildAnalysisPrompt(contractText: string): string {
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

Remember: Return ONLY the JSON object, no markdown formatting, no code blocks, no explanatory text. Provide substantial, meaningful analysis - not placeholder content.`
}

function parseAnalysisResponse(response: string): any {
  try {
    // Clean the response - remove any markdown code blocks or extra text
    let jsonString = response.trim()
    
    // Remove markdown code blocks if present
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Find the JSON object boundaries
    const firstBrace = jsonString.indexOf('{')
    const lastBrace = jsonString.lastIndexOf('}')
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response')
    }
    
    // Extract just the JSON part
    jsonString = jsonString.substring(firstBrace, lastBrace + 1)
    
    const parsed = JSON.parse(jsonString)
    console.log('✅ JSON parsed successfully')
    
    return parsed
  } catch (error) {
    console.error('❌ JSON parsing failed:', error)
    throw new Error(`Failed to parse AI response as JSON: ${error}`)
  }
}

function validateAnalysis(analysis: any): void {
  const requiredFields = ['overallRiskLevel', 'keyFindings', 'recommendations', 'missingClauses', 'clauseAnalysis', 'riskSummary']
  
  for (const field of requiredFields) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (!['Low Risk', 'Medium Risk', 'High Risk'].includes(analysis.overallRiskLevel)) {
    throw new Error('Invalid overallRiskLevel value')
  }
  
  if (!Array.isArray(analysis.keyFindings) || analysis.keyFindings.length === 0) {
    throw new Error('keyFindings must be a non-empty array')
  }
  
  if (!Array.isArray(analysis.clauseAnalysis) || analysis.clauseAnalysis.length === 0) {
    throw new Error('clauseAnalysis must be a non-empty array')
  }
  
  if (!analysis.riskSummary || typeof analysis.riskSummary !== 'object') {
    throw new Error('riskSummary must be an object')
  }
  
  const requiredRiskFields = ['legal', 'financial', 'operational']
  for (const field of requiredRiskFields) {
    if (!(field in analysis.riskSummary)) {
      throw new Error(`Missing required riskSummary field: ${field}`)
    }
  }
}

function getFallbackAnalysis(): any {
  return {
    success: true,
    analysis: {
      overallRiskLevel: 'Medium Risk',
      keyFindings: [
        {
          title: 'Analysis System Temporarily Unavailable',
          description: 'The automated contract analysis system encountered an issue while processing your document. This may be due to temporary service disruption, document formatting issues, or system maintenance. Please try uploading your contract again in a few minutes.'
        },
        {
          title: 'Manual Review Recommended',
          description: 'While the automated system is unavailable, we recommend having your contract reviewed by a qualified legal professional, especially if this is a time-sensitive agreement. Manual review can provide comprehensive analysis that automated systems may miss.'
        },
        {
          title: 'Document Processing Issue',
          description: 'The system was unable to complete the standard risk assessment process for your contract. This could indicate complex document structure, unusual formatting, or temporary technical difficulties. Consider reformatting the document or trying again later.'
        }
      ],
      recommendations: [
        'Try re-uploading your contract in a few minutes',
        'Ensure your document is in a supported format (PDF, DOC, DOCX)',
        'Contact support if the issue persists',
        'Consider manual legal review for urgent contracts'
      ],
      missingClauses: [
        'Automated clause detection temporarily unavailable'
      ],
      clauseAnalysis: [
        {
          title: 'System Status Notice',
          content: 'Automated clause analysis is currently unavailable due to technical issues.',
          analysis: 'The AI-powered clause analysis feature is temporarily experiencing difficulties. This system normally identifies key contract provisions, assesses their risk levels, and provides specific recommendations for improvement. The unavailability does not reflect any issues with your contract content.',
          riskLevel: 'none',
          issues: ['Automated analysis temporarily unavailable'],
          suggestions: [
            'Try re-uploading your contract in a few minutes',
            'Ensure your document is in a supported format (PDF, DOC, DOCX)',
            'Contact support if the issue persists',
            'Consider manual legal review for urgent contracts'
          ]
        }
      ],
      riskSummary: {
        legal: 'The automated contract analysis system is temporarily unavailable. This is a technical issue with our analysis service, not a problem with your contract.',
        financial: 'Unable to assess financial risks due to system unavailability. Manual review recommended for financial terms.',
        operational: 'Operational risk assessment unavailable. Please try again or contact support for manual analysis options.'
      }
    },
    timestamp: new Date().toISOString(),
    fallback: true
  }
}