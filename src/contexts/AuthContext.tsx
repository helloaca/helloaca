import { createContext, useContext, useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { AuthUser, UserProfile, supabase } from '../lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isRehydrating: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
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

  // Cache keys for sessionStorage
  const CACHE_KEYS = {
    USER: 'auth_user',
    PROFILE: 'auth_profile',
    SESSION: 'auth_session'
  }

  // Helper functions for sessionStorage
  const cacheUserData = (user: AuthUser, profile: UserProfile | null, session: Session) => {
    try {
      sessionStorage.setItem(CACHE_KEYS.USER, JSON.stringify(user))
      if (profile) {
        sessionStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile))
      }
      sessionStorage.setItem(CACHE_KEYS.SESSION, JSON.stringify(session))
    } catch (error) {
      console.warn('Failed to cache user data:', error)
      toast.error('Failed to save session data. Some features may not work properly.')
    }
  }

  const getCachedUserData = () => {
    try {
      const cachedUser = sessionStorage.getItem(CACHE_KEYS.USER)
      const cachedProfile = sessionStorage.getItem(CACHE_KEYS.PROFILE)
      const cachedSession = sessionStorage.getItem(CACHE_KEYS.SESSION)
      
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
      sessionStorage.removeItem(CACHE_KEYS.USER)
      sessionStorage.removeItem(CACHE_KEYS.PROFILE)
      sessionStorage.removeItem(CACHE_KEYS.SESSION)
    } catch (error) {
      console.warn('Failed to clear cached user data:', error)
    }
  }



  // Initialize auth state with timeout protection
  useEffect(() => {
    let isMounted = true
    let initTimeout: NodeJS.Timeout
    
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...')
      
      try {
        // Set a maximum timeout for initialization (10 seconds)
        const initPromise = new Promise<void>(async (resolve, reject) => {
          try {
            // First, try to get cached data for immediate UI response
            const cachedData = getCachedUserData()
            if (cachedData.user && cachedData.session) {
              console.log('📦 Using cached auth data')
              setUser(cachedData.user)
              setProfile(cachedData.profile)
              setSession(cachedData.session)
              setIsRehydrating(true)
            }

            // Get current session from Supabase
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error) {
              throw error
            }

            if (isMounted) {
              if (session) {
                console.log('✅ Active session found')
                await handleAuthStateChange(session, true)
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
            
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        // Race between initialization and timeout
        await Promise.race([
          initPromise,
          new Promise<never>((_, reject) => {
            initTimeout = setTimeout(() => {
              reject(new Error('Authentication initialization timeout'))
            }, 10000) // 10 second timeout
          })
        ])

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
          
          // Only show error if it's not a timeout (timeout is handled gracefully)
          if (!(error as Error).message.includes('timeout')) {
            toast.error('Authentication initialization failed. Some features may not work properly.')
          }
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
      console.warn('⚠️ Profile fetch timeout, continuing with cached data')
      setLoading(false)
      setIsRehydrating(false)
    }, 8000) // 8 second timeout for profile operations
    
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
              
              const { error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  first_name: firstName,
                  last_name: lastName,
                  plan: plan as 'free' | 'pro' | 'business',
                  company: null,
                  role: null,
                  timezone: null
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
                  // Cache the new data
                  cacheUserData(authUser, createdProfile, session)
                }
              }
            } else if (existingProfile) {
              console.log('✅ Profile loaded successfully')
              setProfile(existingProfile)
              // Cache the data
              cacheUserData(authUser, existingProfile, session)
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
            const minimalProfile = {
              id: session.user.id,
              first_name: session.user.user_metadata?.firstName || null,
              last_name: session.user.user_metadata?.lastName || null,
              email: session.user.email!,
              plan: (session.user.user_metadata?.plan || 'free') as 'free' | 'pro' | 'business',
              company: null,
              role: null,
              timezone: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(minimalProfile)
            cacheUserData(authUser, minimalProfile, session)
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
      toast.success('Account created successfully! Please check your email to verify your account.')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      setSession(null)
      clearCachedUserData()
    } catch (err) {
      handleError(err as Error)
      throw err
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
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
      handleError(err as Error)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
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
    signOut,
    resetPassword,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}