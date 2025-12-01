import Anthropic from '@anthropic-ai/sdk'
import mixpanel from 'mixpanel-browser'

const claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY

if (!claudeApiKey) {
  throw new Error('Claude API key not found. Set VITE_CLAUDE_API_KEY or VITE_ANTHROPIC_API_KEY')
}

const anthropic = new Anthropic({
  apiKey: claudeApiKey,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from backend
})

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export const claudeService = {
  async sendMessage(messages: ClaudeMessage[], contractContext?: string, forceJsonResponse?: boolean): Promise<string> {
    try {
      console.log('🤖 Claude API Request - Messages:', messages.length, 'Context:', !!contractContext)
      const start = performance.now()
      mixpanel.track('AI Prompt Sent', {
        message_count: messages.length,
        has_contract_context: !!contractContext,
        force_json: !!forceJsonResponse
      })
      
      // Prepare system message with contract context if available and strict no-emoji policy
      const baseSystemMessage = contractContext 
        ? `You are an AI assistant specialized in contract analysis. You have access to the following contract content: ${contractContext}. Provide helpful, accurate responses about the contract.`
        : 'You are an AI assistant specialized in contract analysis. Provide helpful responses about contract-related questions.'
      
      // Add strict no-emoji policy to system message with rich formatting allowed
      const systemMessage = `${baseSystemMessage}

IMPORTANT COMMUNICATION POLICY:
- You must not use emojis in your responses under any circumstances
- You are encouraged to use rich text formatting including: **bold**, *italic*, \`code\`, > quotes, [links](url), lists, and headers
- Use markdown formatting to enhance readability and emphasize key points
- Structure your responses with clear sections using headers (##, ###)
- Use bullet points and numbered lists for clarity
- If a user requests emojis, politely explain that you maintain a formal communication style without emojis to ensure professional standards
- Keep all responses professional, well-formatted, and emoji-free
- Maintain a formal, business-appropriate tone at all times`

      // Try multiple model names to find the correct one
      const envModelsRaw = (import.meta.env.VITE_CLAUDE_MODELS || '')
        .split(',')
        .map((m: string) => m.trim())
        .filter((m: string) => !!m)
      const models = envModelsRaw.length > 0
        ? envModelsRaw
        : [
            'claude-3-5-sonnet',
            'claude-3-5-haiku'
          ]
      
      let lastError: any = null
      
      for (const model of models) {
        try {
          console.log(`🔄 Trying model: ${model}`)
          
          const requestOptions: any = {
            model: model,
            max_tokens: 2000,
            system: systemMessage,
            messages: messages.map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }] })),
            temperature: 0.1
          }

          if (forceJsonResponse) {
            requestOptions.system = systemMessage + '\n\nYou MUST return ONLY valid JSON. No explanations. No Markdown. No commentary. If you cannot produce valid JSON, return {}.'
          }

          const response = await anthropic.messages.create(requestOptions)

          // Extract the text content from Claude's response
          const textContent = response.content.find(content => content.type === 'text')
          console.log(`✅ Successfully used model: ${model}`)
          const duration = performance.now() - start
          mixpanel.track('AI Response Sent', {
            api_response_time: duration,
            api_tokens_used: (response as any)?.usage?.output_tokens
          })
          return textContent?.text || 'I apologize, but I was unable to generate a response.'
          
        } catch (modelError: any) {
          console.log(`❌ Model ${model} failed:`, modelError.message)
          lastError = modelError
          continue // Try next model
        }
      }
      
      // If all models failed, throw the last error with detailed information
      console.error('❌ All Claude models failed')
      throw lastError
      
    } catch (error: any) {
      console.error('Claude API Error:', error)
      console.error('Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        headers: error.headers
      })
      
      mixpanel.track('API Error', {
        error_message: error.message,
        error_type: 'claude_api',
        status: error.status
      })
      
      // Better error handling for model deprecation and other API issues
      if (error.status === 404 && error.message?.includes('model')) {
        throw new Error('AI model is not available. All attempted models failed. Please contact support to update the system.')
      } else if (error.status === 401) {
        throw new Error('Claude API authentication failed. Please check your API key configuration.')
      } else if (error.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again in a few moments.')
      } else if (error.status >= 500) {
        throw new Error('Claude API is temporarily unavailable. Please try again later.')
      } else if (error.message) {
        throw new Error(`Claude API error: ${error.message}`)
      }
      
      throw new Error('Failed to get response from Claude API')
    }
  }
}