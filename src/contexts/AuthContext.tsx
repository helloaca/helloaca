import React, { createContext, useContext, useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { AuthUser, supabase } from '../lib/supabase'
import { setUserCredits, refreshMonthlyCreditsForPlan } from '../lib/utils'
import type { UserProfile } from '../lib/supabase'
import { trackAuth, setUserProperties } from '../lib/analytics'
import mixpanel from 'mixpanel-browser'

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isRehydrating: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRehydrating, setIsRehydrating] = useState(false)

  const handleError = (error: Error) => {
    console.error('Authentication error:', error)
    toast.error(error.message)
  }

  // Cache keys for persistent storage
  const CACHE_KEYS = {
    USER: 'auth_user',
    PROFILE: 'auth_profile',
    SESSION: 'auth_session'
  }

  // Helper functions for persistent storage
  const cacheUserData = (user: AuthUser, profile: UserProfile | null, session: Session) => {
    try {
      localStorage.setItem(CACHE_KEYS.USER, JSON.stringify(user))
      if (profile) {
        localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile))
      }
      localStorage.setItem(CACHE_KEYS.SESSION, JSON.stringify(session))
    } catch (error) {
      console.warn('Failed to cache user data:', error)
      toast.error('Failed to save session data. Some features may not work properly.')
    }
  }

  const getCachedUserData = () => {
    try {
      const cachedUser = localStorage.getItem(CACHE_KEYS.USER)
      const cachedProfile = localStorage.getItem(CACHE_KEYS.PROFILE)
      const cachedSession = localStorage.getItem(CACHE_KEYS.SESSION)
      
      return {
        user: cachedUser ? JSON.parse(cachedUser) : null,
        profile: cachedProfile ? JSON.parse(cachedProfile) : null,
        session: cachedSession ? JSON.parse(cachedSession) : null
      }
    } catch (error) {
      console.warn('Failed to get cached user data:', error)
      toast.error('Failed to restore session data. Please try refreshing the page.')
      return { user: null, profile: null, session: null }
    }
  }

  const clearCachedUserData = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.USER)
      localStorage.removeItem(CACHE_KEYS.PROFILE)
      localStorage.removeItem(CACHE_KEYS.SESSION)
    } catch (error) {
      console.warn('Failed to clear cached user data:', error)
    }
  }



  // Initialize auth state with improved timeout protection
  useEffect(() => {
    let isMounted = true
    let initTimeout: ReturnType<typeof setTimeout>
    
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...')
      
      try {
        // First, try to get cached data for immediate UI response
        const cachedData = getCachedUserData()
        if (cachedData.user && cachedData.session) {
          console.log('📦 Using cached auth data')
          setUser(cachedData.user)
          setProfile(cachedData.profile)
          setSession(cachedData.session)
          // Immediately allow UI to proceed while background revalidation happens
          setLoading(false)
        }

        // Create a timeout promise that resolves (doesn't reject) after delay
        const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => {
          initTimeout = setTimeout(() => {
            // Silently handle timeout without warning - authentication is working with cached data
            resolve({ timedOut: true })
          }, 10000)
        })

        // Create the session fetch promise with optimized retry logic
        const sessionPromise = new Promise<{ session: any; error: any; timedOut?: never }>((resolve, reject) => {
          (async () => {
            try {
              let retryCount = 0
              const maxRetries = 1
              while (retryCount <= maxRetries) {
                try {
                  const { data: { session }, error } = await supabase.auth.getSession()
                  resolve({ session, error })
                  return
                } catch (err) {
                  retryCount++
                  if (retryCount > maxRetries) {
                    reject(err)
                  } else {
                    console.log(`🔄 Retrying session fetch (${retryCount}/${maxRetries})`)
                    await new Promise(r => setTimeout(r, 500))
                  }
                }
              }
            } catch (error) {
              reject(error)
            }
          })()
        })

        // Race between session fetch and timeout
        const result = await Promise.race([sessionPromise, timeoutPromise])

        if (isMounted) {
          if ('timedOut' in result) {
            // Timeout occurred - use cached data if available (silently)
            if (cachedData.user && cachedData.session) {
              setLoading(false)
              setIsRehydrating(false)
            } else {
              // No cached data, set to logged out state
              setUser(null)
              setProfile(null)
              setSession(null)
              setLoading(false)
              setIsRehydrating(false)
            }
          } else {
            // Session fetch completed
            if (result.error) {
              throw result.error
            }

            if (result.session) {
              console.log('✅ Active session found')
              await handleAuthStateChange(result.session, true)
            } else {
              console.log('❌ No active session')
              clearCachedUserData()
              setUser(null)
              setProfile(null)
              setSession(null)
            }
            
            setLoading(false)
            setIsRehydrating(false)
          }
        }

      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
        
        if (isMounted) {
          // Try to use cached data as fallback
          const cachedData = getCachedUserData()
          if (cachedData.user && cachedData.session) {
            console.log('🔄 Falling back to cached data')
            setUser(cachedData.user)
            setProfile(cachedData.profile)
            setSession(cachedData.session)
          } else {
            // Clear everything if no cache available
            clearCachedUserData()
            setUser(null)
            setProfile(null)
            setSession(null)
          }
          
          setLoading(false)
          setIsRehydrating(false)
          
          // Show error for actual failures (not timeouts)
          toast.error('Authentication initialization failed. Please try refreshing the page.')
        }
      } finally {
        if (initTimeout) {
          clearTimeout(initTimeout)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes with error boundary
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        if (!isMounted) return
        
        try {
          if (event === 'SIGNED_IN' && session) {
            await handleAuthStateChange(session, true)
          } else if (event === 'SIGNED_OUT') {
            clearCachedUserData()
            setUser(null)
            setProfile(null)
            setSession(null)
            setLoading(false)
            setIsRehydrating(false)
            // Reset Mixpanel identity on logout to prevent cross-user data mixing
            mixpanel.reset()
          } else if (event === 'TOKEN_REFRESHED' && session) {
            setSession(session)
            // Update cached session
            const cachedData = getCachedUserData()
            if (cachedData.user && cachedData.profile) {
              cacheUserData(cachedData.user, cachedData.profile, session)
            }
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error)
          // Don't show error toast for auth state changes to avoid spam
          // Just ensure loading state is resolved
          if (isMounted) {
            setLoading(false)
            setIsRehydrating(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      if (initTimeout) {
        clearTimeout(initTimeout)
      }
      subscription.unsubscribe()
    }
  }, [])

  const handleAuthStateChange = async (session: Session, shouldFetchFresh = false) => {
    console.log('🔄 Handling auth state change for user:', session.user.email)
    
    // Add timeout protection for profile fetching
    const profileTimeout = setTimeout(() => {
      // Silently handle timeout without warning - profile is working with cached data
      if (loading || isRehydrating) {
        setLoading(false)
        setIsRehydrating(false)
      }
    }, 8000) // Reduced to 8 second timeout for profile operations
    
    try {
      setSession(session)
      
      if (session.user) {
        // Set basic user info
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          name: typeof session.user.user_metadata?.name === 'string' 
            ? session.user.user_metadata.name 
            : session.user.user_metadata?.firstName && session.user.user_metadata?.lastName
              ? `${String(session.user.user_metadata.firstName)} ${String(session.user.user_metadata.lastName)}`
              : session.user.email?.split('@')[0] || 'User',
          firstName: typeof session.user.user_metadata?.firstName === 'string' 
            ? session.user.user_metadata.firstName 
            : undefined,
          lastName: typeof session.user.user_metadata?.lastName === 'string' 
            ? session.user.user_metadata.lastName 
            : undefined,
          plan: session.user.user_metadata?.plan || 'free'
        }
        setUser(authUser)
        const prevDistinct = mixpanel.get_distinct_id()
        if (prevDistinct && prevDistinct !== authUser.id) {
          mixpanel.alias(authUser.id, prevDistinct)
        }
        mixpanel.identify(authUser.id)
        // Create/update Mixpanel user profile immediately after identification
        mixpanel.people.set({
          $email: authUser.email,
          $name: authUser.name,
          plan: authUser.plan
        })
        // Persist plan as a super property on events
        mixpanel.register({ plan: authUser.plan })
        // Send a confirmation event so Users page shows a recent event tied to this profile
        mixpanel.track('User Profile Set', { plan: authUser.plan })

        try {
          // Check if we need to fetch profile data
          const cachedData = getCachedUserData()
          
          // Always try to use cached profile first to prevent flicker
          if (cachedData.profile) {
            console.log('📦 Using cached profile data')
            setProfile(cachedData.profile)
            // Update cache with new session
            cacheUserData(authUser, cachedData.profile, session)
          }
          
          // Then fetch fresh data if needed
          if (shouldFetchFresh || !cachedData.profile) {
            console.log('🔄 Fetching fresh profile data')
            const { data: existingProfile, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (error && error.code === 'PGRST116') {
              // Profile doesn't exist, create it
              console.log('➕ Creating new user profile')
              const firstName = session.user.user_metadata?.firstName || ''
              const lastName = session.user.user_metadata?.lastName || ''
              const plan = session.user.user_metadata?.plan || 'free'
              
              const avatarSeed = session.user.id
              const { error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  first_name: firstName,
                  last_name: lastName,
                  plan: plan as 'free' | 'pro' | 'team' | 'business' | 'enterprise',
                  company: null,
                  role: null,
                  timezone: null,
                  avatar_seed: avatarSeed
                })
              
              if (createError) {
                console.error('❌ Error creating user profile:', createError)
                handleError(new Error(`Error creating user profile: ${createError.message}`))
              } else {
                // Fetch the created profile
                const { data: createdProfile } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single()
                if (createdProfile) {
                  console.log('✅ Profile created successfully')
                  setProfile(createdProfile)
                  try { setUserCredits(createdProfile.id, createdProfile.credits_balance ?? 0); refreshMonthlyCreditsForPlan(createdProfile.id, createdProfile.plan as any) } catch { /* noop */ }
                  // Set user properties for analytics
                  setUserProperties({
                    user_id: createdProfile.id,
                    plan: createdProfile.plan,
                    company: createdProfile.company || undefined
                  })
                  // Cache the new data
                  cacheUserData(authUser, createdProfile, session)
                }
              }
            } else if (existingProfile) {
              let updatedProfile = existingProfile
              if (!existingProfile.avatar_seed) {
                const seed = session.user.id
                const { error: updateErr, data } = await supabase
                  .from('user_profiles')
                  .update({ avatar_seed: seed })
                  .eq('id', session.user.id)
                  .select()
                  .single()
                if (!updateErr && data) {
                  updatedProfile = data
                }
              }
              setProfile(updatedProfile)
              try { setUserCredits(updatedProfile.id, updatedProfile.credits_balance ?? 0); refreshMonthlyCreditsForPlan(updatedProfile.id, updatedProfile.plan as any) } catch { /* noop */ }
              setUserProperties({
                user_id: updatedProfile.id,
                plan: updatedProfile.plan,
                company: updatedProfile.company || undefined
              })
              cacheUserData(authUser, updatedProfile, session)
            }
          }
        } catch (err) {
          console.error('❌ Error fetching profile:', err)
          handleError(err as Error)
          // If fetch fails, try to get cached profile
          const cachedData = getCachedUserData()
          if (!cachedData.profile) {
            // Create a minimal profile from user data if no cache
            console.log('🔄 Creating minimal profile from user metadata')
            const minimalProfile: UserProfile = {
              id: session.user.id,
              first_name: session.user.user_metadata?.firstName || null,
              last_name: session.user.user_metadata?.lastName || null,
              email: session.user.email!,
              plan: (session.user.user_metadata?.plan || 'free') as 'free' | 'pro' | 'team' | 'business' | 'enterprise',
              plan_expires_at: null,
              company: null,
              role: null,
              timezone: null,
              avatar_seed: session.user.id,
              credits_balance: 0,
              notify_email_reports: false,
              notify_analysis_complete: false,
              notify_weekly_digest: false,
              notify_low_credits: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(minimalProfile as UserProfile)
            cacheUserData(authUser, minimalProfile as UserProfile, session)
          }
        }
      } else {
        // Clear user data if no session
        setUser(null)
        setProfile(null)
        clearCachedUserData()
      }
    } catch (error) {
      console.error('❌ Error in handleAuthStateChange:', error)
      // Ensure loading states are cleared even on error
      setLoading(false)
      setIsRehydrating(false)
    } finally {
      // Clear the timeout and ensure loading states are resolved
      clearTimeout(profileTimeout)
      setLoading(false)
      setIsRehydrating(false)
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName
          }
        }
      })
      if (error) {
        return { success: false, error: error.message }
      }
      // Track successful sign up
      trackAuth.signUp('email')
      mixpanel.track('Sign Up', {
        email,
        signup_method: 'email'
      })
      toast.success('Account created successfully! Please check your email to verify your account.')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Please enter a valid email address' }
      }

      const timeout = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), 20000))
      const result = await Promise.race([
        (async () => {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          })
          return { error }
        })(),
        timeout
      ])

      if ('timedOut' in result) {
        return { success: false, error: 'Network timeout during sign in. Please try again.' }
      }

      if (result.error) {
        let errorMessage = result.error.message
        if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the verification link before signing in.'
        } else if (result.error.message.includes('Rate limit')) {
          errorMessage = 'Too many login attempts. Please try again in a few minutes.'
        }
        return { success: false, error: errorMessage }
      }

      trackAuth.signIn('email')
      mixpanel.track('Sign In', {
        email,
        login_method: 'email',
        success: true
      })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during sign in'
      mixpanel.track('Sign In', {
        email,
        login_method: 'email',
        success: false
      })
      return { success: false, error: errorMessage }
    }
  }

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) {
        return { success: false, error: error.message }
      }
      // Track successful Google sign in
      trackAuth.signIn('google')
      mixpanel.track('Sign In', {
        login_method: 'google',
        success: true
      })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      mixpanel.track('Sign In', {
        login_method: 'google',
        success: false
      })
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000))
      await Promise.race([
        (async () => {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
        })(),
        timeout
      ])
    } catch (err) {
      // Swallow sign-out errors to ensure UI can proceed
    } finally {
      trackAuth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      clearCachedUserData()
      // Clear Mixpanel state on explicit sign out
      mixpanel.reset()
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) {
        return { success: false, error: error.message }
      }
      toast.success('Password reset email sent!')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) throw new Error('No authenticated user')
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
      
      if (error) throw error
      
      // Update local profile state
      if (profile) {
        const updatedProfile = { ...profile, ...updates }
        setProfile(updatedProfile)
        // Update cache
        if (user && session) {
          cacheUserData(user, updatedProfile, session)
        }
      }
      
      toast.success('Profile updated successfully!')
      return { success: true }
    } catch (err) {
      const e = err as Error
      const msg = e?.message || ''
      if (updates?.plan && /plan_check|check constraint|invalid input value/i.test(msg)) {
        try {
          await supabase.auth.updateUser({ data: { plan: updates.plan } })
          const updatedUser = { ...(user as any), plan: updates.plan }
          setUser(updatedUser)
          if (profile) {
            const updatedProfile = { ...profile }
            setProfile(updatedProfile)
          }
          if (session) {
            cacheUserData(updatedUser, profile || null as any, session)
          }
          toast.success('Plan activated')
          return { success: true }
        } catch (metaErr) {
          handleError(metaErr as Error)
          return { success: false, error: 'Failed to activate plan' }
        }
      }
      handleError(e)
      return { success: false, error: e?.message || 'Failed to update profile' }
    }
  }

  const refreshProfile = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !session) {
      return { success: false, error: 'No authenticated user' }
    }
    try {
      const { data: existingProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      if (existingProfile) {
        setProfile(existingProfile)
        try { setUserCredits(existingProfile.id, existingProfile.credits_balance ?? 0) } catch { /* noop */ }
        const planMeta = (session.user.user_metadata?.plan as 'free' | 'pro' | 'team' | 'business' | 'enterprise' | undefined)
        const nextPlan = (planMeta || existingProfile.plan) as 'free' | 'pro' | 'team' | 'business' | 'enterprise'
        setUser({
          ...user,
          plan: nextPlan
        })
        setUserProperties({
          user_id: existingProfile.id,
          plan: nextPlan,
          company: existingProfile.company || undefined
        })
        cacheUserData({ ...user, plan: nextPlan }, existingProfile, session)
      }
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh profile'
      console.error('Error refreshing profile:', err)
      try {
        const planMeta = (session.user.user_metadata?.plan as 'free' | 'pro' | 'team' | 'business' | 'enterprise' | undefined)
        if (planMeta) {
          setUser({ ...user, plan: planMeta })
          cacheUserData({ ...user, plan: planMeta }, profile || null as any, session)
        }
      } catch { /* noop */ }
      return { success: false, error: errorMessage }
    }
  }

  // Compute isAuthenticated based on user and session state
  const isAuthenticated = Boolean(user && session)

  const value = {
    user,
    profile,
    session,
    loading,
    isRehydrating,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}