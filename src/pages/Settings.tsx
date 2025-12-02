import React, { useState, useEffect, useCallback } from 'react'
import { 
  User, 
  Bell, 
  CreditCard, 
  Users, 
  Shield, 
  Download,
  Trash2,
  Edit3,
  Plus,
  Crown,
  Loader2,
  ArrowLeft,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import Avatar from '../components/ui/Avatar'
import { getUserCredits } from '@/lib/utils'

const Settings: React.FC = () => {
  const { user, profile, updateProfile, signOut, refreshProfile, session } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'team' | 'notifications' | 'security'>('profile')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    timezone: 'EST',
    language: 'English'
  })
  const [notifications, setNotifications] = useState({
    emailReports: !!profile?.notify_email_reports,
    analysisComplete: !!profile?.notify_analysis_complete,
    weeklyDigest: !!profile?.notify_weekly_digest,
    securityAlerts: !!profile?.notify_low_credits,
    teamUpdates: true
  })
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState(0)

  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [isMethodModalOpen, setMethodModalOpen] = useState(false)
  const [processingMethod, setProcessingMethod] = useState<null | 'card' | 'crypto'>(null)
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isEnable2FAOpen, setEnable2FAOpen] = useState(false)
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [isEnrolling2FA, setEnrolling2FA] = useState(false)
  const [isVerifying2FA, setVerifying2FA] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null)
  const [isDeleteStep1Open, setDeleteStep1Open] = useState(false)
  const [isDeleteStep2Open, setDeleteStep2Open] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [isBillingHistoryOpen, setBillingHistoryOpen] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[] | null>(null)
  const [isCancelFeedbackOpen, setCancelFeedbackOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelComeBack, setCancelComeBack] = useState('')
  const [isCancelSubmitting, setCancelSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [creditsBalance, setCreditsBalance] = useState(0)

  const loadPaystackScript = useCallback(async () => {
    if ((window as any).PaystackPop) return
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Paystack script'))
      document.body.appendChild(script)
    })
  }, [])

  const handleSubscribe = useCallback(async () => {
    try {
      if (!user) {
        toast.error('Please sign in to subscribe')
        navigate('/login')
        return
      }
      if (['pro','team','business','enterprise'].includes(String(user?.plan)) || ['pro','team','business','enterprise'].includes(String(profile?.plan))) {
        toast.info('You already have an active Pro plan')
        return
      }
      const testMode = String(import.meta.env.VITE_PAYSTACK_TEST_MODE || '')
      if (testMode === 'mock') {
        try {
          const result = await updateProfile({ plan: 'pro' })
          if (!result.success) {
            await supabase.auth.updateUser({ data: { plan: 'pro' } })
          }
          await refreshProfile()
          toast.success('Subscription activated (mock)')
          return
        } catch {
          toast.error('Mock activation failed')
          return
        }
      }

      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      const planCode = import.meta.env.VITE_PAYSTACK_PLAN_CODE
      if (!publicKey) {
        toast.error('Payment is not configured')
        return
      }

      setIsLoadingPayment(true)
      setProcessingMethod('card')
      try {
        await loadPaystackScript()
      } catch {
        setIsLoadingPayment(false)
        setProcessingMethod(null)
        toast.error('Network error loading payment library')
        return
      }

      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop || typeof PaystackPop.setup !== 'function') {
        setIsLoadingPayment(false)
        setProcessingMethod(null)
        toast.error('Payment library failed to load')
        return
      }

      let amountKobo: number | undefined
      if (!planCode) {
        try {
          const rateRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN')
          const rateJson = await rateRes.json().catch(() => null)
          const rate = typeof rateJson?.rates?.NGN === 'number' ? rateJson.rates.NGN : null
          const ngn = Math.round(((rate || 1500) * 3))
          amountKobo = ngn * 100
        } catch {
          amountKobo = 1500 * 3 * 100
        }
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: String(user.email),
        ...(planCode ? { plan: planCode } : { amount: amountKobo, currency: 'NGN' }),
        reference: `PRO-${Date.now()}`,
        channels: ['card'],
        metadata: { plan: 'pro' },
        callback: (response: any) => {
          (async () => {
            try {
              const base = import.meta.env.VITE_API_ORIGIN || 'https://helloaca.xyz'
              const res = await fetch(`${base}/api/paystack-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: response.reference })
              })
              const data = await res.json()
              if (data?.status === 'success') {
                await updateProfile({ plan: 'pro' })
                await refreshProfile()
                toast.success('Subscription activated')
              } else {
                toast.error('Payment verification failed')
              }
            } catch {
              toast.error('Could not verify payment')
            } finally {
              setIsLoadingPayment(false)
              setProcessingMethod(null)
            }
          })()
        },
        onClose: function () {
          setIsLoadingPayment(false)
          setProcessingMethod(null)
          toast.info('Payment canceled')
        }
      })
      setMethodModalOpen(false)
      handler.openIframe()
    } catch (err) {
      setIsLoadingPayment(false)
      setProcessingMethod(null)
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed')
    }
  }, [user, navigate, loadPaystackScript, profile])

  const handleSubscribeCrypto = useCallback(async () => {
    try {
      if (!user) {
        toast.error('Please sign in to subscribe')
        navigate('/login')
        return
      }
      if (String(user?.plan) === 'pro' || String(profile?.plan) === 'pro') {
        toast.info('You already have an active Pro plan')
        return
      }
      const testMode = String(import.meta.env.VITE_PAYSTACK_TEST_MODE || '')
      if (testMode === 'mock') {
        try {
          const result = await updateProfile({ plan: 'pro' })
          if (!result.success) {
            await supabase.auth.updateUser({ data: { plan: 'pro' } })
          }
          await refreshProfile()
          toast.success('Subscription activated (mock)')
          return
        } catch {
          toast.error('Mock activation failed')
          return
        }
      }

      setIsLoadingPayment(true)
      setProcessingMethod('crypto')
      const base = import.meta.env.VITE_API_ORIGIN || window.location.origin
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      let data: any = null
      try {
        const res = await fetch(`${base}/api/coinbase-create-charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email }),
          signal: controller.signal
        })
        data = await res.json().catch(() => null)
        clearTimeout(timer)
        const url = data?.hosted_url
        if (res.ok && url) {
          setMethodModalOpen(false)
          window.location.href = url
          return
        }
        const message = typeof data?.error === 'string' ? data.error : 'Failed to start crypto payment'
        toast.error(message)
      } catch {
        clearTimeout(timer)
        toast.error('Network error starting crypto payment')
      }
    } finally {
      setIsLoadingPayment(false)
      setProcessingMethod(null)
    }
  }, [user, navigate, profile])

  const handleChangePassword = async () => {
    try {
      if (!currentPassword) {
        toast.error('Enter your current password')
        return
      }
      const reauth = await supabase.auth.signInWithPassword({ email: String(user?.email), password: currentPassword })
      if (reauth.error) {
        setFailedPasswordAttempts((c) => c + 1)
        toast.error('Current password is incorrect')
        return
      }
      if (!newPassword || newPassword !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error('Failed to change password')
        return
      }
      setChangePasswordOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setFailedPasswordAttempts(0)
      toast.success('Password updated')
    } catch {
      toast.error('Failed to change password')
    }
  }

  const startEnable2FA = async () => {
    try {
      setEnrolling2FA(true)
      const timeout = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), 8000))
      const enrollPromise = (supabase as any).auth.mfa.enroll({ factorType: 'totp' })
      const result: any = await Promise.race([enrollPromise, timeout])
      if ('timedOut' in result) {
        toast.error('Network timeout starting 2FA. Please try again.')
        return
      }
      if (result?.error) {
        toast.error('Failed to start 2FA')
        return
      }
      setFactorId(result?.data?.id || null)
      setTotpUri(result?.data?.totp?.uri || null)
      setEnable2FAOpen(true)
    } catch {
      toast.error('Failed to start 2FA')
    } finally {
      setEnrolling2FA(false)
    }
  }

  const verify2FA = async () => {
    try {
      setVerifying2FA(true)
      if (!factorId || !totpCode) {
        toast.error('Enter the code from your app')
        return
      }
      const timeout = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), 8000))
      const verifyPromise = (supabase as any).auth.mfa.verify({ factorId, code: totpCode })
      const verifyResult: any = await Promise.race([verifyPromise, timeout])
      if ('timedOut' in verifyResult) {
        toast.error('Network timeout verifying code. Please try again.')
        return
      }
      if (verifyResult?.error) {
        toast.error('Invalid code')
        return
      }
      setEnable2FAOpen(false)
      setTotpUri(null)
      setTotpCode('')
      setFactorId(null)
      toast.success('2FA enabled')
    } catch {
      toast.error('Failed to enable 2FA')
    } finally {
      setVerifying2FA(false)
    }
  }

  const loadMfaStatus = useCallback(async () => {
    try {
      const timeout = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), 6000))
      const listPromise = (supabase as any).auth.mfa.listFactors()
      const result: any = await Promise.race([listPromise, timeout])
      if ('timedOut' in result) return
      const totp = Array.isArray(result?.data) ? result.data.find((f: any) => f.factorType === 'totp') : null
      setTotpEnabled(!!totp)
      setTotpFactorId(totp?.id || null)
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    loadMfaStatus()
  }, [loadMfaStatus])

  const disable2FA = async () => {
    try {
      if (!totpFactorId) {
        toast.error('No TOTP factor found')
        return
      }
      const timeout = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), 8000))
      const unenrollPromise = (supabase as any).auth.mfa.unenroll({ factorId: totpFactorId })
      const res: any = await Promise.race([unenrollPromise, timeout])
      if ('timedOut' in res) {
        toast.error('Network timeout disabling 2FA. Please try again.')
        return
      }
      if (res?.error) {
        toast.error('Failed to disable 2FA')
        return
      }
      setTotpEnabled(false)
      setTotpFactorId(null)
      toast.success('2FA disabled')
    } catch {
      toast.error('Failed to disable 2FA')
    }
  }

  const viewBillingHistory = async () => {
    try {
      if (!user?.email) {
        toast.error('No user email found')
        return
      }
      const baseEnv = import.meta.env.VITE_API_ORIGIN
      const base = baseEnv && baseEnv.length > 0
        ? baseEnv
        : window.location.origin
      const [cardRes, cryptoRes] = await Promise.all([
        fetch(`${base}/api/paystack-history?email=${encodeURIComponent(String(user.email))}`),
        fetch(`${base}/api/coinbase-list-charges?email=${encodeURIComponent(String(user.email))}`)
      ])
      const [cardJson, cryptoJson] = await Promise.all([cardRes.json(), cryptoRes.json()])
      const card = Array.isArray(cardJson?.data) ? cardJson.data.map((tx: any) => ({
        method: 'card',
        reference: tx.reference,
        status: tx.status,
        amount: typeof tx.amount === 'number' ? (tx.amount / 100).toFixed(2) : tx.amount,
        currency: 'USD',
        created_at: tx.paid_at || tx.created_at,
        explorer_url: null
      })) : []
      const crypto = Array.isArray(cryptoJson?.data) ? cryptoJson.data.map((c: any) => {
        const created = c.created_at ? new Date(c.created_at).getTime() : 0
        const ageMs = Date.now() - created
        const isComplete = ['success','completed','paid'].includes(String(c.status))
        const isExpired = !isComplete && ageMs > 24 * 60 * 60 * 1000
        return {
          method: 'crypto',
          reference: c.reference,
          status: isExpired ? 'expired' : c.status,
          amount: c.amount,
          currency: c.currency,
          created_at: c.created_at,
          explorer_url: isExpired ? null : c.explorer_url,
          hosted_url: isExpired ? null : c.hosted_url
        }
      }) : []
      const combined = [...card, ...crypto].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      setBillingHistory(combined)
    } catch {
      setBillingHistory([])
    }
  }

  useEffect(() => {
    if (isBillingHistoryOpen) viewBillingHistory()
  }, [isBillingHistoryOpen])

  const cancelSubscription = async () => {
    try {
      const base = import.meta.env.VITE_API_ORIGIN || 'https://helloaca.xyz'
      const res = await fetch(`${base}/api/paystack-cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(user?.email) })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        if (res.status === 404) {
          // No provider subscription found; downgrade locally
          const result = await updateProfile({ plan: 'free' })
          if (result.success) {
            await refreshProfile()
            toast.info('No provider subscription found. Plan downgraded locally.')
          } else {
            toast.error(result.error || 'Failed to cancel subscription locally')
          }
          return
        }
        toast.error(j?.error || 'Provider cancellation failed')
        return
      }
      const result = await updateProfile({ plan: 'free' })
      if (result.success) {
        await refreshProfile()
        toast.success('Subscription canceled')
      } else {
        toast.error(result.error || 'Failed to cancel subscription locally')
      }
    } catch {
      toast.error('Failed to cancel subscription')
    }
  }

  const submitCancellationFeedback = async (proceed: boolean) => {
    try {
      setCancelSubmitting(true)
      const base = import.meta.env.VITE_API_ORIGIN || 'https://helloaca.xyz'
      await fetch(`${base}/api/cancel-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(user?.email || ''),
          plan: String(profile?.plan || user?.plan || 'free'),
          reason: cancelReason,
          comeback: cancelComeBack
        })
      }).catch(() => {})
      if (proceed) {
        await cancelSubscription()
      }
      setCancelFeedbackOpen(false)
      setCancelReason('')
      setCancelComeBack('')
    } catch { void 0 }
    finally {
      setCancelSubmitting(false)
    }
  }

  const exportUserData = async () => {
    try {
      setIsExporting(true)
      if (!user?.id) {
        toast.error('Please sign in to export data')
        return
      }
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
      const payload = {
        user: { id: user.id, email: user.email, plan: String(profile?.plan || user?.plan || 'free') },
        contracts: contracts || [],
        reports: reports || []
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'helloaca-data.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const deleteAccount = async () => {
    try {
      if (deletePhrase.trim().toLowerCase() !== 'delete my account') {
        toast.error('Type the exact phrase to confirm')
        return
      }
      if (!user?.id) return
      const base = import.meta.env.VITE_API_ORIGIN || 'https://helloaca.xyz'
      const res = await fetch(`${base}/api/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ userId: user.id, email: user.email, token: session?.access_token })
      })
      if (res.ok) {
        toast.success('Account deleted')
        await signOut()
        navigate('/')
      } else {
        const msg = await res.json().catch(() => null)
        toast.error(typeof msg?.error === 'string' ? msg.error : 'Failed to delete account')
      }
    } catch {
      toast.error('Failed to delete account')
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('helloaca:notification_prefs')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setNotifications((prev) => ({ ...prev, ...parsed }))
        }
      }
    } catch { void 0 }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('helloaca:notification_prefs', JSON.stringify(notifications))
    } catch { void 0 }
  }, [notifications])

  // Load user data on component mount
  useEffect(() => {
    if (user || profile) {
      setProfileData({
        firstName: profile?.first_name || user?.firstName || '',
        lastName: profile?.last_name || user?.lastName || '',
        email: user?.email || '',
        company: profile?.company || user?.company || '',
        role: profile?.role || user?.role || '',
        timezone: profile?.timezone || user?.timezone || 'EST',
        language: 'English'
      })
    }
  }, [user, profile])

  useEffect(() => {
    if (user?.id) {
      setCreditsBalance(getUserCredits(user.id))
    }
  }, [user?.id])

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'subscription' as const, label: 'Credits', icon: CreditCard },
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield }
  ]

  const teamMembers = [
    { 
      id: 1, 
      name: (user?.firstName && user?.lastName) ? `${String(user.firstName)} ${String(user.lastName)}` : user?.name || 'User', 
      email: user?.email || '', 
      role: 'Owner', 
      avatar: (() => {
        const firstName = user?.firstName ? String(user.firstName) : ''
        const lastName = user?.lastName ? String(user.lastName) : ''
        const name = user?.name ? String(user.name) : ''
        
        const firstInitial = firstName?.[0] || name?.[0] || 'U'
        const lastInitial = lastName?.[0] || ''
        
        return `${firstInitial}${lastInitial}`
      })(), 
      status: 'active' 
    }
  ]

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = async (setting: string) => {
    const next = !notifications[setting as keyof typeof notifications]
    setNotifications(prev => ({ ...prev, [setting]: next }))
    try {
      const updates: any = {}
      if (setting === 'emailReports') updates.notify_email_reports = next
      if (setting === 'analysisComplete') updates.notify_analysis_complete = next
      if (setting === 'weeklyDigest') updates.notify_weekly_digest = next
      if (setting === 'securityAlerts') updates.notify_low_credits = next
      await updateProfile(updates)
    } catch { /* noop */ }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const result = await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        company: profileData.company,
        role: profileData.role,
        timezone: profileData.timezone
      })
      
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      toast.success('Signed out successfully!')
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              type="text"
              value={profileData.company}
              onChange={(e) => handleProfileUpdate('company', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={profileData.role}
              onChange={(e) => handleProfileUpdate('role', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={profileData.timezone}
              onChange={(e) => handleProfileUpdate('timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            >
              {/* UTC-12 to UTC-11 */}
              <option value="BIT">Baker Island Time (UTC-12)</option>
              <option value="NUT">Niue Time (UTC-11)</option>
              
              {/* UTC-10 to UTC-9 */}
              <option value="HST">Hawaii-Aleutian Standard Time (UTC-10)</option>
              <option value="AKST">Alaska Standard Time (UTC-9)</option>
              
              {/* UTC-8 to UTC-7 */}
              <option value="PST">Pacific Standard Time - PST (UTC-8)</option>
              <option value="MST">Mountain Standard Time - MST (UTC-7)</option>
              
              {/* UTC-6 to UTC-5 */}
              <option value="CST">Central Standard Time - CST (UTC-6)</option>
              <option value="EST">Eastern Standard Time - EST (UTC-5)</option>
              
              {/* UTC-4 to UTC-3 */}
              <option value="AST">Atlantic Standard Time (UTC-4)</option>
              <option value="NST">Newfoundland Standard Time (UTC-3:30)</option>
              <option value="ART">Argentina Time (UTC-3)</option>
              
              {/* UTC-2 to UTC-1 */}
              <option value="GST">South Georgia Time (UTC-2)</option>
              <option value="AZOT">Azores Time (UTC-1)</option>
              
              {/* UTC+0 */}
              <option value="GMT">Greenwich Mean Time - GMT (UTC+0)</option>
              <option value="WET">Western European Time - WET (UTC+0)</option>
              
              {/* UTC+1 to UTC+2 */}
              <option value="CET">Central European Time - CET (UTC+1)</option>
              <option value="WAT">West Africa Time (UTC+1)</option>
              <option value="EET">Eastern European Time - EET (UTC+2)</option>
              <option value="CAT">Central Africa Time (UTC+2)</option>
              
              {/* UTC+3 to UTC+4 */}
              <option value="MSK">Moscow Standard Time (UTC+3)</option>
              <option value="EAT">East Africa Time (UTC+3)</option>
              <option value="IRST">Iran Standard Time (UTC+3:30)</option>
              <option value="GST_GULF">Gulf Standard Time (UTC+4)</option>
              <option value="AFT">Afghanistan Time (UTC+4:30)</option>
              
              {/* UTC+5 to UTC+6 */}
              <option value="PKT">Pakistan Standard Time (UTC+5)</option>
              <option value="IST">India Standard Time - IST (UTC+5:30)</option>
              <option value="NPT">Nepal Time (UTC+5:45)</option>
              <option value="BST">Bangladesh Standard Time (UTC+6)</option>
              
              {/* UTC+7 to UTC+8 */}
              <option value="ICT">Indochina Time (UTC+7)</option>
              <option value="CST_CHINA">China Standard Time - CST (UTC+8)</option>
              <option value="SGT">Singapore Standard Time (UTC+8)</option>
              <option value="PST_PHIL">Philippine Standard Time (UTC+8)</option>
              
              {/* UTC+9 to UTC+10 */}
              <option value="JST">Japan Standard Time - JST (UTC+9)</option>
              <option value="KST">Korea Standard Time (UTC+9)</option>
              <option value="ACST">Australian Central Standard Time (UTC+9:30)</option>
              <option value="AEST">Australian Eastern Standard Time (UTC+10)</option>
              <option value="VLAT">Vladivostok Time (UTC+10)</option>
              
              {/* UTC+11 to UTC+12 */}
              <option value="SBT">Solomon Islands Time (UTC+11)</option>
              <option value="NZST">New Zealand Standard Time (UTC+12)</option>
              <option value="FJT">Fiji Time (UTC+12)</option>
              
              {/* UTC+13 to UTC+14 */}
              <option value="TOT">Tonga Time (UTC+13)</option>
              <option value="LINT">Line Islands Time (UTC+14)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
        <Button onClick={handleSaveProfile} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credits &amp; Billing</h3>
        <Card className="p-5 sm:p-6 border-2 border-[#4ECCA3]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center min-w-0">
              <Crown className="w-6 h-6 text-[#4ECCA3] mr-3" />
              <div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900">Usage-Based Access</h4>
                <p className="text-sm sm:text-base text-gray-600">Credits: {creditsBalance} • 1 free analysis/month • No subscription</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">Member since</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#4ECCA3]">0</p>
              <p className="text-xs sm:text-sm text-gray-600">Contracts this month</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#4ECCA3]">1</p>
              <p className="text-xs sm:text-sm text-gray-600">Free monthly allowance</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#4ECCA3]">0</p>
              <p className="text-xs sm:text-sm text-gray-600">Reports generated</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#4ECCA3]">{creditsBalance > 0 ? 'Unlimited' : 'Limited'}</p>
              <p className="text-xs sm:text-sm text-gray-600">AI chat on credited contracts</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/pricing')}>Buy Credits</Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setBillingHistoryOpen(true)}>View Billing History</Button>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Credits</h3>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">Buy credits as needed. One credit covers one full contract analysis plus chat.</p>
            <Button className="w-full sm:w-auto" onClick={() => navigate('/pricing')}>Go to Pricing</Button>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar seed={profile?.avatar_seed || user?.id || String(member.id)} size={40} className="w-10 h-10 rounded-full mr-4" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.role === 'Owner' 
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'Admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-[#4ECCA3] hover:text-[#3DBB90]">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {member.role !== 'Owner' && (
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Permissions</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Contract Upload</p>
              <p className="text-sm text-gray-500">Allow team members to upload contracts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Report Generation</p>
              <p className="text-sm text-gray-500">Allow team members to generate reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Team Management</p>
              <p className="text-sm text-gray-500">Allow admins to manage team members</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <Card className="p-6">
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {key === 'emailReports' && 'Email Reports'}
                    {key === 'analysisComplete' && 'Analysis Complete'}
                    {key === 'weeklyDigest' && 'Weekly Digest'}
                    {key === 'securityAlerts' && 'Security Alerts'}
                    {key === 'teamUpdates' && 'Team Updates'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {key === 'emailReports' && 'Receive reports via email when analysis is complete'}
                    {key === 'analysisComplete' && 'Get notified when contract analysis finishes'}
                    {key === 'weeklyDigest' && 'Weekly summary of your contract analysis activity'}
                    {key === 'securityAlerts' && 'Low credit alerts and important account notifications'}
                    {key === 'teamUpdates' && 'Updates about team member activity and changes'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={value}
                    onChange={() => handleNotificationToggle(key)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password &amp; Authentication</h3>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Manage your account password</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setChangePasswordOpen(true)}>Change Password</Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${totpEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {totpEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {totpEnabled && <span className="text-xs text-gray-500">Authenticator: TOTP</span>}
                </div>
              </div>
              {totpEnabled ? (
                <Button variant="outline" className="w-full sm:w-auto" onClick={disable2FA} disabled={isVerifying2FA}>
                  Disable 2FA
                </Button>
              ) : (
                <Button variant="outline" className="w-full sm:w-auto" onClick={startEnable2FA} disabled={isEnrolling2FA}>
                  {isEnrolling2FA ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : null}
                  Enable 2FA
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-500">Sign out of your account on this device</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data &amp; Privacy</h3>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download all your contracts and analysis data</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto" onClick={exportUserData} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isExporting ? 'Exporting…' : 'Export'}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50" onClick={() => setDeleteStep1Open(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and team settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-3 sm:p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                        activeTab === tab.id
                          ? 'bg-[#4ECCA3] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-5 sm:p-8">
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'subscription' && renderSubscriptionTab()}
              {activeTab === 'team' && renderTeamTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
            </Card>
          </div>
        </div>
        {isSigningOut && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
              <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-gray-700" />
              <p className="text-gray-900 font-medium">Signing you out…</p>
              <p className="text-sm text-gray-600 mt-1">Please wait a moment</p>
            </div>
          </div>
        )}
        {isMethodModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!isLoadingPayment) setMethodModalOpen(false) }}>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close" onClick={() => setMethodModalOpen(false)} disabled={isLoadingPayment} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose payment method</h3>
              <p className="text-gray-600 mb-6">Select how you want to subscribe to Pro.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleSubscribe} disabled={isLoadingPayment || processingMethod === 'crypto'} className='w-full py-3 px-6 rounded-lg font-medium text-center transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'>
                  {processingMethod === 'card' ? 'Processing…' : 'Card'}
                </button>
                <button onClick={handleSubscribeCrypto} disabled={isLoadingPayment || processingMethod === 'card'} className='w-full py-3 px-6 rounded-lg font-medium text-center transition-colors bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed'>
                  {processingMethod === 'crypto' ? 'Processing…' : 'Crypto'}
                </button>
              </div>
            </div>
          </div>
        )}
        {isBillingHistoryOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBillingHistoryOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-4 sm:p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Billing History</h3>
                <button onClick={() => setBillingHistoryOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
              {!billingHistory && (
                <div className="py-6 text-center text-gray-600">Loading…</div>
              )}
              {billingHistory && billingHistory.length === 0 && (
                <div className="py-6 text-center text-gray-600">No transactions found</div>
              )}
              {billingHistory && billingHistory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Explorer</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {billingHistory.map((tx: any) => (
                        <tr key={`${tx.method}-${tx.reference}`}>
                          <td className="px-4 py-3 text-sm text-gray-900 break-all">{tx.reference}</td>
                          <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${['success','completed','paid'].includes(String(tx.status)) ? 'bg-green-100 text-green-800' : (String(tx.status) === 'expired' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800')}`}>{tx.status}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-900">{tx.amount ? `$${tx.amount}` : '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{tx.method === 'card' ? 'Card' : 'Crypto'}</td>
                          <td className="px-4 py-3 text-sm">{(tx.explorer_url && tx.status !== 'expired') ? (<a href={tx.explorer_url} target="_blank" rel="noreferrer" className="text-[#4ECCA3] hover:text-[#3DBB90]">View</a>) : ((tx.hosted_url && tx.status !== 'expired') ? (<a href={tx.hosted_url} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-800">Charge</a>) : '-')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {isCancelFeedbackOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCancelFeedbackOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
              <p className="text-sm text-gray-600 mb-4">We’re sorry to see you go. Please share your feedback.</p>
              <div className="space-y-3">
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for canceling" className="w-full min-h-[90px] px-4 py-3 border border-gray-300 rounded-lg" />
                <textarea value={cancelComeBack} onChange={(e) => setCancelComeBack(e.target.value)} placeholder="What could bring you back?" className="w-full min-h-[90px] px-4 py-3 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setCancelFeedbackOpen(false)} disabled={isCancelSubmitting}>Keep Subscription</Button>
                <Button onClick={() => submitCancellationFeedback(true)} disabled={isCancelSubmitting}>
                  {isCancelSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continue to Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setChangePasswordOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-3">
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                {failedPasswordAttempts >= 3 && (
                  <p className="text-sm text-gray-600">Having trouble? <a href="/forgot-password" className="text-[#4ECCA3] hover:text-[#3DBB90]">Visit the forgotten password page</a>.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
                <Button onClick={handleChangePassword}>Update</Button>
              </div>
            </div>
          </div>
        )}
        {isEnable2FAOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEnable2FAOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enable Two-Factor Authentication</h3>
              {totpUri ? (
                <div className="space-y-4">
                  <img alt="QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`} className="mx-auto" />
                  <p className="text-sm text-gray-600 break-all">{totpUri}</p>
                  <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="Enter 6-digit code" className="w-full px-4 py-3 border border-gray-300 rounded-lg" disabled={isVerifying2FA} />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEnable2FAOpen(false)}>Cancel</Button>
                    <Button onClick={verify2FA} disabled={isVerifying2FA || !totpCode}>
                      {isVerifying2FA ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : null}
                      {isVerifying2FA ? 'Verifying…' : 'Verify'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEnable2FAOpen(false)}>Close</Button>
                </div>
              )}
            </div>
          </div>
        )}
        {isDeleteStep1Open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteStep1Open(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Account</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to delete your account?</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteStep1Open(false)}>No</Button>
                <Button onClick={() => { setDeleteStep1Open(false); setDeleteStep2Open(true) }}>Yes</Button>
              </div>
            </div>
          </div>
        )}
        {isDeleteStep2Open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteStep2Open(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-700 mb-4">Type <span className="text-red-600 font-semibold">"delete my account"</span> to confirm.</p>
              <input type="text" value={deletePhrase} onChange={(e) => setDeletePhrase(e.target.value)} placeholder="delete my account" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-red-600 placeholder-red-400" />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setDeleteStep2Open(false)}>Cancel</Button>
                <Button onClick={deleteAccount}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings