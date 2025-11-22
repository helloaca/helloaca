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
  Check,
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

const Settings: React.FC = () => {
  const { user, profile, updateProfile, signOut, refreshProfile } = useAuth()
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
    emailReports: true,
    analysisComplete: true,
    weeklyDigest: false,
    securityAlerts: true,
    teamUpdates: true
  })
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
  const [isDeleteStep1Open, setDeleteStep1Open] = useState(false)
  const [isDeleteStep2Open, setDeleteStep2Open] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [isBillingHistoryOpen, setBillingHistoryOpen] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[] | null>(null)

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
      if (String(user?.plan) === 'pro' || String(profile?.plan) === 'pro') {
        toast.info('You already have an active Pro plan')
        return
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

      const handler = PaystackPop.setup({
        key: publicKey,
        email: String(user.email),
        ...(planCode ? { plan: planCode } : { amount: 300 }),
        reference: `PRO-${Date.now()}`,
        channels: ['card'],
        metadata: { plan: 'pro' },
        callback: (response: any) => {
          ;(async () => {
            try {
              const base = import.meta.env.VITE_API_ORIGIN || (window.location.hostname.endsWith('ngrok-free.app') ? 'https://helloaca.xyz' : '')
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

      setIsLoadingPayment(true)
      setProcessingMethod('crypto')
      const base = import.meta.env.VITE_API_ORIGIN || (window.location.hostname.endsWith('ngrok-free.app') ? 'https://helloaca.xyz' : '')
      const res = await fetch(`${base}/api/coinbase-create-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })
      const data = await res.json()
      const url = data?.hosted_url
      if (url) {
        setMethodModalOpen(false)
        window.location.href = url
        return
      }
      toast.error('Failed to start crypto payment')
    } catch {
      toast.error('Failed to start crypto payment')
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
      const { data, error } = await (supabase as any).auth.mfa.enroll({ factorType: 'totp' })
      if (error) {
        toast.error('Failed to start 2FA')
        return
      }
      setFactorId(data?.id || null)
      setTotpUri(data?.totp?.uri || null)
      setEnable2FAOpen(true)
    } catch {
      toast.error('Failed to start 2FA')
    }
  }

  const verify2FA = async () => {
    try {
      if (!factorId || !totpCode) {
        toast.error('Enter the code from your app')
        return
      }
      const { error } = await (supabase as any).auth.mfa.challenge({ factorId })
      if (error) {
        toast.error('Failed to challenge 2FA')
        return
      }
      const { error: vErr } = await (supabase as any).auth.mfa.verify({ factorId, code: totpCode })
      if (vErr) {
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
    }
  }

  const viewBillingHistory = async () => {
    try {
      if (!user?.email) {
        toast.error('No user email found')
        return
      }
      const base = import.meta.env.VITE_API_ORIGIN || (window.location.hostname.endsWith('ngrok-free.app') ? 'https://helloaca.xyz' : '')
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
      const result = await updateProfile({ plan: 'free', plan_expires_at: null })
      if (result.success) {
        await refreshProfile()
        toast.success('Subscription canceled')
      } else {
        toast.error(result.error || 'Failed to cancel subscription')
      }
    } catch {
      toast.error('Failed to cancel subscription')
    }
  }

  const exportUserData = async () => {
    try {
      if (!user?.id) return
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
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch {
      toast.error('Failed to export data')
    }
  }

  const deleteAccount = async () => {
    try {
      if (deletePhrase.trim().toLowerCase() !== 'delete my account') {
        toast.error('Type the exact phrase to confirm')
        return
      }
      if (!user?.id) return
      const base = import.meta.env.VITE_API_ORIGIN || (window.location.hostname.endsWith('ngrok-free.app') ? 'https://helloaca.xyz' : '')
      const res = await fetch(`${base}/api/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })
      if (res.ok) {
        toast.success('Account deleted')
        await signOut()
        navigate('/')
      } else {
        toast.error('Failed to delete account')
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
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('helloaca:notification_prefs', JSON.stringify(notifications))
    } catch {}
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

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
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
        const firstName = user?.firstName ? String(user.firstName) : '';
        const lastName = user?.lastName ? String(user.lastName) : '';
        const name = user?.name ? String(user.name) : '';
        
        const firstInitial = firstName?.[0] || name?.[0] || 'U';
        const lastInitial = lastName?.[0] || '';
        
        return `${firstInitial}${lastInitial}`;
      })(), 
      status: 'active' 
    }
  ]

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (setting: string) => {
    setNotifications(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }))
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
      await signOut()
      toast.success('Signed out successfully!')
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
        <Card className="p-6 border-2 border-[#4ECCA3]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Crown className="w-6 h-6 text-[#4ECCA3] mr-3" />
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{String(profile?.plan || user?.plan) === 'pro' ? 'Pro Plan' : 'Free Plan'}</h4>
                <p className="text-gray-600">
                  {String(profile?.plan || user?.plan) === 'pro' ? '$3/month • Billed monthly' : 'Free forever'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-semibold text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">0</p>
              <p className="text-sm text-gray-600">Contracts this month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">
                {String(profile?.plan || user?.plan) === 'free' ? '1' : '∞'}
              </p>
              <p className="text-sm text-gray-600">Monthly limit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">0</p>
              <p className="text-sm text-gray-600">Reports generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">
                {String(profile?.plan || user?.plan) === 'free' ? '0' : '∞'}
              </p>
              <p className="text-sm text-gray-600">AI chat messages</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => setMethodModalOpen(true)}>Change Plan</Button>
            <Button variant="outline" onClick={() => setBillingHistoryOpen(true)}>View Billing History</Button>
            {String(profile?.plan || user?.plan) !== 'free' && (
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={cancelSubscription}>
                Cancel Subscription
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'month',
              features: ['1 contract per month', 'Basic AI-powered analysis'],
              current: String(profile?.plan || user?.plan) === 'free'
            },
            {
              name: 'Pro',
              price: '$3',
              period: 'month',
              features: ['Unlimited contracts', 'Full AI analysis suite'],
              current: String(profile?.plan || user?.plan) === 'pro'
            }
          ].map((plan) => (
            <Card key={plan.name} className={`p-6 ${plan.current ? 'ring-2 ring-[#4ECCA3]' : ''}`}>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center justify-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#4ECCA3] mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.current ? "outline" : "primary"}
                  className="w-full"
                  disabled={plan.current}
                  onClick={() => {
                    if (!plan.current && plan.name === 'Pro') setMethodModalOpen(true)
                  }}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
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
                      <div className="w-10 h-10 bg-[#4ECCA3] rounded-full flex items-center justify-center text-white font-semibold mr-4">
                        {String(member.avatar)}
                      </div>
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
                    {key === 'securityAlerts' && 'Important security and account notifications'}
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Manage your account password</p>
              </div>
              <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>Change Password</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" onClick={startEnable2FA}>Enable 2FA</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-500">Sign out of your account on this device</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download all your contracts and analysis data</p>
              </div>
              <Button variant="outline" onClick={exportUserData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setDeleteStep1Open(true)}>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#4ECCA3] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'subscription' && renderSubscriptionTab()}
              {activeTab === 'team' && renderTeamTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
            </Card>
          </div>
        </div>
        {isMethodModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { if (!isLoadingPayment) setMethodModalOpen(false) }}>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close" onClick={() => setMethodModalOpen(false)} disabled={isLoadingPayment} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose payment method</h3>
              <p className="text-gray-600 mb-6">Select how you want to subscribe to Pro.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleSubscribe} disabled={isLoadingPayment || processingMethod === 'crypto'} className={`w-full py-3 px-6 rounded-lg font-medium text-center transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {processingMethod === 'card' ? 'Processing…' : 'Card'}
                </button>
                <button onClick={handleSubscribeCrypto} disabled={isLoadingPayment || processingMethod === 'card'} className={`w-full py-3 px-6 rounded-lg font-medium text-center transition-colors bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {processingMethod === 'crypto' ? 'Processing…' : 'Crypto'}
                </button>
              </div>
            </div>
          </div>
        )}
        {isBillingHistoryOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setBillingHistoryOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
        {isChangePasswordOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setChangePasswordOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEnable2FAOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enable Two-Factor Authentication</h3>
              {totpUri ? (
                <div className="space-y-4">
                  <img alt="QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`} className="mx-auto" />
                  <p className="text-sm text-gray-600 break-all">{totpUri}</p>
                  <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="Enter 6-digit code" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEnable2FAOpen(false)}>Cancel</Button>
                    <Button onClick={verify2FA}>Verify</Button>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteStep1Open(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteStep2Open(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
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