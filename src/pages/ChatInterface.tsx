import React, { useState, useRef, useEffect } from 'react'
import { Send, FileText, Loader2, Trash2, Download, Search } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Header from '../components/layout/Header'
import { useAuth } from '../contexts/AuthContext'
import { messageService } from '../services/messageService'
import { isContractCredited } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  relevantSections?: string[]
}

interface Contract {
  id: string
  title: string
  file_name: string
  extracted_text?: string
  created_at: string
  analysis_status: string
}

const ChatInterface: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoadingContract, setIsLoadingContract] = useState(true)
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load contract data when component mounts
  useEffect(() => {
    const loadContract = async () => {
      if (!contractId) {
        setIsLoadingContract(false)
        return
      }

      try {
        const { ContractService } = await import('../lib/contractService')
        const contractData = await ContractService.getContract(contractId)
        
        if (contractData) {
          setContract(contractData)
          console.log('📄 Contract loaded:', {
            id: contractData.id,
            title: contractData.title,
            hasExtractedText: !!contractData.extracted_text,
            textLength: contractData.extracted_text?.length || 0
          })
        }
      } catch (error) {
        console.error('Error loading contract:', error)
      } finally {
        setIsLoadingContract(false)
      }
    }

    loadContract()
  }, [contractId])

  // Load chat history when contract is loaded
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!contract || !user || isLoadingContract) return

      setIsLoadingChatHistory(true)
      try {
        // Load messages using the new MessageService
        const dbMessages = await messageService.loadMessages(contract.id)
        const count = await messageService.getMessageCount(contract.id)
        setMessageCount(count)
        
        if (dbMessages && dbMessages.length > 0) {
          // Convert database messages to UI messages
          const uiMessages: Message[] = dbMessages.map(msg => ({
            id: msg.id,
            type: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            relevantSections: msg.role === 'assistant' ? ['Contract Analysis'] : undefined
          }))
          
          setMessages(uiMessages)
          console.log('💬 Chat history loaded:', {
            contractId: contract.id,
            messageCount: uiMessages.length
          })
        } else {
          // No chat history, initialize with welcome message
          initializeWelcomeMessage()
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        // If chat history fails to load, show welcome message
        initializeWelcomeMessage()
      } finally {
        setIsLoadingChatHistory(false)
      }
    }

    loadChatHistory()
  }, [contract, user, isLoadingContract])

  // Initialize welcome message based on contract state
  const initializeWelcomeMessage = () => {
    if (contract && contract.extracted_text) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Hello! I've analyzed your contract "${contract.title}" and I'm ready to help you understand its contents. You can ask me questions about specific clauses, terms, risks, or any other aspects of the contract.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } else if (contract && !contract.extracted_text) {
      const errorMessage: Message = {
        id: 'error',
        type: 'ai',
        content: 'I notice that the contract text could not be extracted. Please try uploading the contract again or ensure it\'s in a supported format (PDF, DOCX).',
        timestamp: new Date()
      }
      setMessages([errorMessage])
    } else {
      const noContractMessage: Message = {
        id: 'no-contract',
        type: 'ai',
        content: 'Please upload a contract first to start our conversation. I\'ll be able to help you analyze and understand your contract once it\'s uploaded.',
        timestamp: new Date()
      }
      setMessages([noContractMessage])
    }
  }

  // Save message to database using new MessageService
  const saveMessageToDatabase = async (message: Message) => {
    if (!contract || !user || message.id === 'welcome' || message.id === 'error' || message.id === 'no-contract') {
      return // Don't save system messages
    }

    try {
      await messageService.saveMessage(
        contract.id,
        message.type === 'user' ? 'user' : 'assistant',
        message.content
      )
      
      // Update message count
      const count = await messageService.getMessageCount(contract.id)
      setMessageCount(count)
      
      console.log('💾 Message saved to database:', {
        contractId: contract.id,
        messageType: message.type,
        messageId: message.id
      })
    } catch (error) {
      console.error('Error saving message to database:', error)
      // Don't block the UI if database save fails
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Build context-aware prompt with conversation history
   */
  const buildContextualPrompt = async (userMessage: string): Promise<string> => {
    if (!contract) return userMessage

    // Get recent conversation context
    const conversationContext = await messageService.getConversationContext(contract.id, 10)
    
    let prompt = `You are analyzing the following contract:

Contract Title: ${contract.title}

Full Contract Text:
${contract.extracted_text}

---`

    // Include recent conversation history
    if (conversationContext.length > 0) {
      prompt += '\n\nPrevious conversation:\n'
      conversationContext.forEach(msg => {
        const speaker = msg.role === 'user' ? 'User' : 'Assistant'
        prompt += `${speaker}: ${msg.content}\n`
      })
      prompt += '\n---\n'
    }

    // Add current user question
    prompt += `\n\nUser's current question: ${userMessage}

Please provide a helpful response based on the contract and our conversation.`

    return prompt
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !contract || !contract.extracted_text) return

    const userMsgCount = await messageService.getUserMessageCount(contract.id)
    const freeChatLimit = 5
    const credited = user?.id ? isContractCredited(user.id, contract.id) : false
    if (!credited && userMsgCount >= freeChatLimit) {
      const limitMessage: Message = {
        id: 'limit-reached',
        type: 'ai',
        content: `Free tier includes ${freeChatLimit} questions per contract. Buy credits to continue chatting and unlock full analysis.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, limitMessage])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage('')
    setIsLoading(true)

    // Save user message to database
    await saveMessageToDatabase(userMessage)

    // Check if user is requesting emojis and handle with formal policy response
    const emojiRequestPattern = /emoji|emoticon|smiley|😀|😊|🙂|👍|❤️|💯|🔥|✨|🎉|🚀|💪|👏|🤝|📈|💼|⭐|✅|❌|⚠️|🔍|📊|💡|🎯|🏆|📝|📋|🔧|⚙️|🛠️|🎨|🌟|💎|🔑|🎪|🎭|🎨|🎵|🎶|🎸|🎤|🎧|🎬|🎮|🎲|🎯|🎪|🎭|🎨|🎵|🎶|🎸|🎤|🎧|🎬|🎮|🎲/i
    
    if (emojiRequestPattern.test(currentInput)) {
      const formalPolicyResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I maintain a formal communication style without emojis to ensure professional standards in our contract analysis discussions. This helps maintain the serious and professional nature of legal document review. I\'m happy to assist you with any contract-related questions using clear, professional language.',
        timestamp: new Date(),
        relevantSections: ['Communication Policy']
      }
      
      setMessages(prev => [...prev, formalPolicyResponse])
      await saveMessageToDatabase(formalPolicyResponse)
      setIsLoading(false)
      return
    }

    try {
      // Import Claude service dynamically
      const { claudeService } = await import('../lib/claude')
      
      // Build context-aware prompt
      const contextualPrompt = await buildContextualPrompt(currentInput)

      console.log('🤖 Sending message to Claude with context-aware prompt:', {
        contractId: contract.id,
        contractTitle: contract.title,
        textLength: contract.extracted_text.length,
        userMessage: currentInput,
        hasConversationHistory: true
      })

      // Get response from Claude with contextual prompt
      const claudeResponse = await claudeService.sendMessage(
        [{ role: 'user', content: contextualPrompt }],
        '' // Context is already included in the prompt
      )

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: claudeResponse,
        timestamp: new Date(),
        relevantSections: ['Contract Analysis']
      }
      
      setMessages(prev => [...prev, aiResponse])
      
      // Save AI response to database
      await saveMessageToDatabase(aiResponse)
    } catch (error) {
      console.error('Error getting Claude response:', error)
      
      // Enhanced error logging for debugging
      let errorMessage = 'I apologize, but I encountered an error while processing your request. Please try again.'
      
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        
        // Provide more specific error messages based on error type
        if (error.message.includes('API key')) {
          errorMessage = 'AI service authentication error. Please contact support.'
        } else if (error.message.includes('model')) {
          errorMessage = 'AI model configuration error. Please contact support.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a few moments.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        }
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
      
      // Save error response to database
      await saveMessageToDatabase(errorResponse)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Clear chat history
   */
  const handleClearChat = async () => {
    if (!contract) return
    
    if (!confirm('Are you sure you want to clear this chat history? This cannot be undone.')) {
      return
    }

    try {
      await messageService.clearContractMessages(contract.id)
      setMessages([])
      setMessageCount(0)
      initializeWelcomeMessage()
      console.log('🗑️ Chat history cleared')
    } catch (error) {
      console.error('Failed to clear chat:', error)
      alert('Failed to clear chat history.')
    }
  }

  /**
   * Export chat history
   */
  const handleExportChat = async () => {
    if (!contract) return

    try {
      const exportData = await messageService.exportChatHistory(contract.id)
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-history-${contract.title}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log('📥 Chat history exported')
    } catch (error) {
      console.error('Failed to export chat:', error)
      alert('Failed to export chat history.')
    }
  }

  /**
   * Search messages
   */
  const handleSearch = async () => {
    if (!contract || !searchQuery.trim()) return

    try {
      const searchResults = await messageService.searchMessages(contract.id, searchQuery)
      const uiMessages: Message[] = searchResults.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        relevantSections: msg.role === 'assistant' ? ['Contract Analysis'] : undefined
      }))
      
      setMessages(uiMessages)
      console.log(`🔍 Search completed: ${uiMessages.length} results for "${searchQuery}"`)
    } catch (error) {
      console.error('Search failed:', error)
      alert('Search failed. Please try again.')
    }
  }

  /**
   * Reset to full chat history
   */
  const handleResetSearch = async () => {
    if (!contract) return
    
    try {
      const dbMessages = await messageService.loadMessages(contract.id)
      const uiMessages: Message[] = dbMessages.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        relevantSections: msg.role === 'assistant' ? ['Contract Analysis'] : undefined
      }))
      
      setMessages(uiMessages)
      setSearchQuery('')
      setShowSearch(false)
    } catch (error) {
      console.error('Failed to reset search:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingContract) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading contract...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingChatHistory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg min-h-[70vh] sm:min-h-[60vh] md:h-[calc(100vh-12rem)] flex flex-col">
          {/* Chat Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-4">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Chat with AI
                </h1>
                <p className="text-sm text-gray-600">
                  About: {contract?.title || 'Contract'} • {messageCount} messages
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search messages"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {messageCount > 0 && (
                <>
                  <button
                    onClick={handleExportChat}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export chat history"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={handleClearChat}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear chat history"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="border-b px-6 py-3 bg-gray-50 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search messages..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={handleResetSearch}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {!isLoadingChatHistory && messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-600">
                  Ask me anything about this contract
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-2xl md:max-w-3xl rounded-lg px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.type === 'ai' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 text-gray-900" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 text-gray-900" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-base font-semibold mb-2 text-gray-900" {...props} />,
                            h5: ({node, ...props}) => <h5 className="text-sm font-semibold mb-1 text-gray-900" {...props} />,
                            h6: ({node, ...props}) => <h6 className="text-xs font-semibold mb-1 text-gray-900" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-800" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-3 space-y-1 text-gray-800" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-3 space-y-1 text-gray-800" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1 text-gray-800" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-700 bg-gray-50 py-2" {...props} />,
                            a: ({node, href, ...props}) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            code: ({node, inline, ...props}: any) =>
                              inline ? (
                                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
                              ) : (
                                <code className="block bg-gray-100 p-3 rounded my-2 font-mono text-sm text-gray-800 border border-gray-200" {...props} />
                              ),
                            pre: ({node, ...props}) => <pre className="bg-gray-100 p-3 rounded my-2 overflow-x-auto border border-gray-200" {...props} />,
                            table: ({node, ...props}) => <table className="min-w-full divide-y divide-gray-200 my-3 border border-gray-200" {...props} />,
                            thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-900" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-2 text-sm text-gray-800" {...props} />,
                            hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {message.id === 'limit-reached' && (
                        <div className="mt-2">
                          <button
                            onClick={() => navigate('/pricing')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Buy Credits
                          </button>
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        <span className="text-gray-600">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t px-6 py-4 flex-shrink-0">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value)
                    // Auto-resize textarea
                    const textarea = e.target as HTMLTextAreaElement
                    textarea.style.height = 'auto'
                    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    contract && contract.extracted_text
                      ? 'Ask me anything about this contract...'
                      : 'Please upload a contract first...'
                  }
                  disabled={!contract || !contract.extracted_text || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '48px',
                    maxHeight: '120px',
                    height: '48px'
                  }}
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !contract || !contract.extracted_text || isLoading}
                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-12 flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface