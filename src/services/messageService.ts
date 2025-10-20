import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  contract_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}

export class MessageService {
  /**
   * Load all messages for a specific contract
   */
  async loadMessages(contractId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      console.log(`📥 Loaded ${data?.length || 0} messages for contract ${contractId}`);
      return data || [];
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
  }

  /**
   * Save a new message to the database
   */
  async saveMessage(
    contractId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: any
  ): Promise<Message> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const messageData = {
        contract_id: contractId,
        user_id: user.id,
        role,
        content,
        metadata: metadata || {}
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`💾 Saved ${role} message to database`);
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Save multiple messages at once (batch operation)
   */
  async saveMessages(contractId: string, messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const messagesData = messages.map(msg => ({
        contract_id: contractId,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        metadata: {}
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messagesData);

      if (error) throw error;
      console.log(`💾 Batch saved ${messages.length} messages`);
    } catch (error) {
      console.error('Error batch saving messages:', error);
      throw error;
    }
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      console.log(`🗑️ Deleted message ${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Clear all messages for a contract (if user wants to start fresh)
   */
  async clearContractMessages(contractId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('contract_id', contractId);

      if (error) throw error;
      console.log(`🗑️ Cleared all messages for contract ${contractId}`);
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  }

  /**
   * Get message count for a contract
   */
  async getMessageCount(contractId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contractId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(contractId: string, query: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Load messages with pagination
   */
  async loadMessagesPaginated(contractId: string, page = 1, pageSize = 50): Promise<Message[]> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading paginated messages:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time message updates (for future multi-user features)
   */
  subscribeToMessages(contractId: string, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`contract_${contractId}_messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${contractId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Export chat history as JSON
   */
  async exportChatHistory(contractId: string): Promise<string> {
    try {
      const messages = await this.loadMessages(contractId);
      const exportData = {
        contractId,
        exportDate: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        }))
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting chat history:', error);
      throw error;
    }
  }

  /**
   * Get conversation context for AI (recent messages)
   */
  async getConversationContext(contractId: string, maxMessages = 10): Promise<Array<{role: string, content: string}>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('role, content')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(maxMessages);

      if (error) throw error;
      
      // Reverse to get chronological order
      return (data || []).reverse();
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }
}

export const messageService = new MessageService();