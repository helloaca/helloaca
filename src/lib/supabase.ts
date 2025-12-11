/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          plan: 'free' | 'pro' | 'team' | 'business' | 'enterprise'
          plan_expires_at: string | null
          company: string | null
          role: string | null
          timezone: string | null
          avatar_seed: string | null
          credits_balance: number | null
          notify_email_reports: boolean | null
          notify_analysis_complete: boolean | null
          notify_weekly_digest: boolean | null
          notify_low_credits: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          plan?: 'free' | 'pro' | 'team' | 'business' | 'enterprise'
          plan_expires_at?: string | null
          company?: string | null
          role?: string | null
          timezone?: string | null
          avatar_seed?: string | null
          credits_balance?: number | null
          notify_email_reports?: boolean | null
          notify_analysis_complete?: boolean | null
          notify_weekly_digest?: boolean | null
          notify_low_credits?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          plan?: 'free' | 'pro' | 'team' | 'business' | 'enterprise'
          plan_expires_at?: string | null
          company?: string | null
          role?: string | null
          timezone?: string | null
          avatar_seed?: string | null
          credits_balance?: number | null
          notify_email_reports?: boolean | null
          notify_analysis_complete?: boolean | null
          notify_weekly_digest?: boolean | null
          notify_low_credits?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string
          analysis_json: any
          status: 'uploaded' | 'processing' | 'analyzed' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url: string
          analysis_json?: any
          status?: 'uploaded' | 'processing' | 'analyzed' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          analysis_json?: any
          status?: 'uploaded' | 'processing' | 'analyzed' | 'error'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          contract_id: string
          user_id: string
          message: string
          response: string
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          user_id: string
          message: string
          response: string
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          user_id?: string
          message?: string
          response?: string
          metadata?: any
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          contract_id: string
          user_id: string
          report_url: string
          report_type: 'standard' | 'white-label'
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          user_id: string
          report_url: string
          report_type?: 'standard' | 'white-label'
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          user_id?: string
          report_url?: string
          report_type?: 'standard' | 'white-label'
          created_at?: string
        }
      }
    }
  }
}

// Type helpers
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Report = Database['public']['Tables']['reports']['Row']

// Auth types
export interface AuthUser {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  plan?: 'free' | 'pro' | 'team' | 'business' | 'enterprise'
  company?: string
  role?: string
  timezone?: string
  createdAt?: string
}

// Utility functions for common operations
export const authHelpers = {
  // Sign up new user
  async signUp(email: string, password: string, userData: { firstName: string; lastName: string; plan?: 'free' | 'pro' | 'team' | 'business' | 'enterprise' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          plan: userData.plan || 'free'
        }
      }
    })
    return { data, error }
  },

  // Sign in user
  async signIn(email: string, password: string, rememberMe: boolean = false) {
    // Configure session storage based on rememberMe preference
    if (rememberMe) {
      // Use localStorage for persistent sessions
      supabase.auth.setSession = supabase.auth.setSession
    } else {
      // For non-persistent sessions, we'll rely on the default behavior
      // The session will still persist due to our global config, but we could
      // implement additional logic here if needed for temporary sessions
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }
}

// Database helpers
export const dbHelpers = {
  // User profile operations
  async createUserProfile(userId: string, email: string, firstName: string, lastName: string, plan: 'free' | 'pro' | 'team' | 'business' | 'enterprise' = 'free') {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        plan
      })
    return { data, error }
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
    return { data, error }
  },

  // Contract operations
  async createContract(userId: string, fileName: string, fileUrl: string) {
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        status: 'uploaded'
      })
    return { data, error }
  },

  async getUserContracts(userId: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async updateContract(contractId: string, updates: Partial<Contract>) {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', contractId)
    return { data, error }
  },

  // Message operations
  async createMessage(contractId: string, userId: string, message: string, response: string, metadata: any = {}) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        contract_id: contractId,
        user_id: userId,
        message,
        response,
        metadata
      })
    return { data, error }
  },

  async getContractMessages(contractId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true })
    return { data, error }
  }
}

// Storage helpers
export const storageHelpers = {
  // Upload contract file
  async uploadContract(userId: string, file: File) {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${userId}/${fileName}`
    
    const { error } = await supabase.storage
      .from('contracts')
      .upload(filePath, file)
    
    if (error) return { data: null, error }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath)
    
    return { data: { path: filePath, publicUrl }, error: null }
  },

  // Delete contract file
  async deleteContract(filePath: string) {
    const { error } = await supabase.storage
      .from('contracts')
      .remove([filePath])
    return { error }
  }
}