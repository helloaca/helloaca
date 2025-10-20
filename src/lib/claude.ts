import Anthropic from '@anthropic-ai/sdk'

const claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY

if (!claudeApiKey) {
  throw new Error('VITE_CLAUDE_API_KEY is not set in environment variables')
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
      // Prepare system message with contract context if available
      const systemMessage = contractContext 
        ? `You are an AI assistant specialized in contract analysis. You have access to the following contract content: ${contractContext}. Please provide helpful, accurate responses about the contract terms, obligations, and any questions the user might have.`
        : 'You are an AI assistant specialized in contract analysis. Please provide helpful responses about contract-related questions.'

      const requestOptions: any = {
        model: 'claude-sonnet-4-5',
        max_tokens: 2000, // Increased for contract analysis
        system: systemMessage,
        messages: messages,
        temperature: 0.2 // Lower temperature for more consistent JSON output
      }

      // Add response_format for JSON-only responses when requested
      if (forceJsonResponse) {
        // Note: Anthropic Claude doesn't support response_format like OpenAI
        // But we can enforce JSON through system prompts
        requestOptions.system = systemMessage + '\n\nIMPORTANT: You must respond ONLY with valid JSON. Do not include any text outside the JSON object.'
      }

      const response = await anthropic.messages.create(requestOptions)

      // Extract the text content from Claude's response
      const textContent = response.content.find(content => content.type === 'text')
      return textContent?.text || 'I apologize, but I was unable to generate a response.'
    } catch (error: any) {
      console.error('Claude API Error:', error)
      
      // Better error handling for model deprecation and other API issues
      if (error.status === 404 && error.message?.includes('model')) {
        throw new Error('AI model is outdated. Please contact support to update the system.')
      } else if (error.status === 401) {
        throw new Error('Authentication failed. Please check your API key configuration.')
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.')
      } else if (error.status >= 500) {
        throw new Error('Claude API is temporarily unavailable. Please try again later.')
      }
      
      throw new Error('Failed to get response from Claude API')
    }
  }
}