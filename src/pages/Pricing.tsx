import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Check, ArrowLeft, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserCredits, addUserCredits } from '@/lib/utils'
import { toast } from 'sonner'
// import mixpanel from 'mixpanel-browser'

const Pricing: React.FC = () => {
  const navigate = useNavigate()
  
  const auth = useAuth() as any
  const user = auth.user as { id: string; email: string; plan?: 'free' | 'pro' | 'team' | 'business' | 'enterprise' } | null
  const [isLoading, setIsLoading] = useState(false)
  const [isMethodModalOpen, setMethodModalOpen] = useState(false)
  const [processingMethod, setProcessingMethod] = useState<null | 'card' | 'crypto'>(null)
  const [selectedBundle, setSelectedBundle] = useState<{ credits: number; priceUSD: number } | null>(null)
  const [creditBalance, setCreditBalance] = useState<number>(0)
  // Removed: customCredits; using predefined bundles in modal
  const [isSubModalOpen, setSubModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ plan: 'pro'|'team'|'business'|'enterprise'; period: 'monthly'|'yearly'; priceUSD: number } | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly'|'yearly'>('monthly')
  const [isBundleModalOpen, setBundleModalOpen] = useState(false)
  const [isWaitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistPlans, setWaitlistPlans] = useState<Array<'team'|'business'|'enterprise'>>([])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMethodModalOpen && !isLoading) {
        setMethodModalOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMethodModalOpen, isLoading])

  useEffect(() => {
    if (user?.id) {
      setCreditBalance(getUserCredits(user.id))
    }
  }, [user?.id])

  useEffect(() => {
    if (isWaitlistOpen) {
      setWaitlistEmail(String(user?.email || ''))
    }
  }, [isWaitlistOpen, user?.email])

  const bundles = [
    { credits: 1, priceUSD: 2, popular: false as const },
    { credits: 5, priceUSD: 9, popular: true as const },
    { credits: 10, priceUSD: 15, popular: false as const }
  ]

  // Removed: custom pricing calculator; using fixed bundles
  // Removed inline custom credits UI; modal uses predefined bundles

  

  const loadFlutterwaveScript = useCallback(async () => {
    if ((window as any).FlutterwaveCheckout) return
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.flutterwave.com/v3.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Flutterwave script'))
      document.body.appendChild(script)
    })
  }, [])

  const startFlutterwaveCreditsCheckout = useCallback(async () => {
    try {
      if (!user || !selectedBundle) { toast.error('No bundle selected'); return }
      const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY
      if (!publicKey) { toast.error('Payment is not configured'); return }
      setIsLoading(true)
      setProcessingMethod('card')
      await loadFlutterwaveScript()
      const txRef = `CREDITS-${selectedBundle.credits}-${Date.now()}`
      const baseEnv = import.meta.env.VITE_API_ORIGIN
      const baseUrl = baseEnv && baseEnv.length > 0 ? baseEnv : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'https://preview.helloaca.xyz' : window.location.origin)
      const preferredCurrency = String(import.meta.env.VITE_FLUTTERWAVE_DEFAULT_CURRENCY || 'USD').toUpperCase()
      
      const fxRateNgn = Number(String(import.meta.env.VITE_FX_USD_TO_NGN_RATE || '1600'))
      const amountLocal = preferredCurrency === 'NGN' ? Math.round(selectedBundle.priceUSD * fxRateNgn) : selectedBundle.priceUSD
      ;(window as any).FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount: amountLocal,
        currency: preferredCurrency,
        payment_options: 'card',
        // Avoid enforcing country to let checkout pick correct auth model for card BIN
        redirect_url: `${baseUrl}/api/flutterwave-verify?tx_ref=${encodeURIComponent(txRef)}&email=${encodeURIComponent(user.email)}&return_to=%2Fdashboard`,
        customer: { email: String(user.email) },
        meta: { userId: user.id, credits: selectedBundle.credits },
        customizations: { title: 'HelloACA', description: `${selectedBundle.credits} credits`, logo: `${baseUrl}/logo.png` },
        onclose: () => { setIsLoading(false); setProcessingMethod(null) }
      })
      setMethodModalOpen(false)
    } catch (e) {
      setIsLoading(false)
      setProcessingMethod(null)
      toast.error('Network error starting payment')
    }
  }, [user, selectedBundle, loadFlutterwaveScript])

  const startFlutterwaveSubscribeCheckout = useCallback(async () => {
    try {
      if (!user || !selectedPlan) { toast.error('Please sign in and select a plan'); return }
      const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY
      if (!publicKey) { toast.error('Payment is not configured'); return }
      setIsLoading(true)
      setProcessingMethod('card')
      await loadFlutterwaveScript()
      const txRef = `SUB-${String(selectedPlan.plan).toUpperCase()}-${String(selectedPlan.period).toUpperCase()}-${Date.now()}`
      const baseEnv = import.meta.env.VITE_API_ORIGIN
      const baseUrl = baseEnv && baseEnv.length > 0 ? baseEnv : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'https://preview.helloaca.xyz' : window.location.origin)
      const preferredCurrency2 = String(import.meta.env.VITE_FLUTTERWAVE_DEFAULT_CURRENCY || 'USD').toUpperCase()
      
      const fxRateNgn2 = Number(String(import.meta.env.VITE_FX_USD_TO_NGN_RATE || '1600'))
      const amountLocal2 = preferredCurrency2 === 'NGN' ? Math.round(selectedPlan.priceUSD * fxRateNgn2) : selectedPlan.priceUSD
      ;(window as any).FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount: amountLocal2,
        currency: preferredCurrency2,
        payment_options: 'card',
        // Avoid enforcing country to let checkout pick correct auth model for card BIN
        redirect_url: `${baseUrl}/api/flutterwave-verify?tx_ref=${encodeURIComponent(txRef)}&email=${encodeURIComponent(user.email)}&return_to=%2Fdashboard`,
        customer: { email: String(user.email) },
        meta: { userId: user.id, plan: selectedPlan.plan, period: selectedPlan.period },
        customizations: { title: 'Helloaca', description: `${selectedPlan.plan} subscription (${selectedPlan.period})`, logo: `${baseUrl}/logo.png` },
        onclose: () => { setIsLoading(false); setProcessingMethod(null) }
      })
      setSubModalOpen(false)
    } catch (e) {
      setIsLoading(false)
      setProcessingMethod(null)
      toast.error('Network error starting payment')
    }
  }, [user, selectedPlan, loadFlutterwaveScript])

  

  const handleBuyCredits = useCallback(async () => {
    try {
      if (!user) {
        toast.error('Please sign in to purchase credits')
        navigate('/login')
        return
      }
      if (!selectedBundle) {
        toast.error('No bundle selected')
        return
      }
      const testMode = String(import.meta.env.VITE_PAYSTACK_TEST_MODE || '')
      if (testMode === 'mock') {
        try {
          addUserCredits(user.id, selectedBundle.credits)
          setCreditBalance(getUserCredits(user.id))
          setMethodModalOpen(false)
          toast.success(`Added ${selectedBundle.credits} credits (mock)`) 
          return
        } catch {
          toast.error('Mock credit purchase failed')
          return
        }
      }

      await startFlutterwaveCreditsCheckout()
    } catch (err) {
      setIsLoading(false)
      setProcessingMethod(null)
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed')
    }
  }, [user, navigate, selectedBundle, startFlutterwaveCreditsCheckout])

  // Crypto callback flow will be implemented when crypto is enabled

  const handleBuyCreditsCrypto = useCallback(async () => {
    try {
      if (!user) {
        toast.error('Please sign in to purchase credits')
        navigate('/login')
        return
      }
      if (!selectedBundle) {
        toast.error('No bundle selected')
        return
      }

      setIsLoading(true)
      setProcessingMethod('crypto')
      const base = import.meta.env.VITE_API_ORIGIN || window.location.origin
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      let data: any = null
      try {
        const res = await fetch(`${base}/api/coinbase-create-charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email, amount_usd: selectedBundle.priceUSD, credits: selectedBundle.credits }),
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
      setIsLoading(false)
      setProcessingMethod(null)
    }
  }, [user, navigate, selectedBundle])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showAuth={true} />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pricing & Plans
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Choose pay‑per‑use credits or a subscription plan that fits your team.
            </p>

            {user && (
              <div className={'inline-flex items-center gap-3 px-4 py-2 rounded-full mb-6 bg-gray-100 text-gray-800'}>
                <span className="font-medium">Credits: {creditBalance}</span>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">1 free analysis per month</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">No subscription required</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Buy more only when needed</span>
              </div>
            </div>
          </div>

          {/* Plans Side-by-Side */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${billingPeriod==='monthly' ? 'bg-white shadow' : ''}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${billingPeriod==='yearly' ? 'bg-white shadow' : ''}`}
              >
                Annually
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 mb-16 items-stretch">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col relative">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Pay‑Per‑Use</h3>
                <p className="text-gray-600">Buy credits as needed</p>
              </div>
            
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />One credit = one analysis + chat</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />No subscription</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />Personal contract library</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />PDF export</li>
              </ul>
              <div className="mt-auto">
                <button
                  onClick={() => setBundleModalOpen(true)}
                  className="w-full py-3 px-6 rounded-lg font-medium bg-transparent border border-[#5ACEA8] text-[#5ACEA8] hover:bg-[#5ACEA8]/10"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing…' : 'Buy credits'}
                </button>
              </div>
            </div>

            {([
              { plan: 'pro' as const, title: 'Pro', monthly: 10, features: ['5 credits/month','1 seat','Full analysis','Chat with contract','Negotiation playbook','PDF export','Rollover up to 10'] },
              { plan: 'team' as const, title: 'Team', monthly: 0, features: ['Custom pricing','Seats','Shared library','Team dashboard','Basic analytics','Centralized billing'] },
              { plan: 'business' as const, title: 'Business', monthly: 0, features: ['Custom pricing','Approval workflows','Advanced analytics','Custom templates','Version comparison','White‑label reports','Priority support'] },
              { plan: 'enterprise' as const, title: 'Enterprise', monthly: 0, features: ['Custom pricing','Custom risk frameworks','API access','SSO/SAML','Integrations','Audit trail','SLA 99.9%','Account manager'] }
            ]).map((p) => {
              const isDisabled = p.plan === 'team' || p.plan === 'business' || p.plan === 'enterprise'
              return (
              <div key={p.plan} className={`bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col relative ${isDisabled ? 'opacity-60 grayscale' : ''}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{p.title}</h3>
                    <p className="text-gray-600">{p.plan==='pro' ? (billingPeriod==='monthly' ? `$${p.monthly}/month` : `$${p.monthly*12}/year`) : 'Coming Soon...'}</p>
                  </div>
                  {p.plan==='pro' && (
                    <span className="absolute -top-3 right-4 text-xs px-2 py-1 rounded-full bg-[#4ECCA3] text-white shadow">Most popular</span>
                  )}
                </div>
                <ul className="space-y-2 text-sm mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />{f}</li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {isDisabled ? (
                    <button
                      onClick={() => { setWaitlistPlans([p.plan]); setWaitlistOpen(true) }}
                      className="w-full h-11 px-6 rounded-lg font-medium bg-[#4ECCA3] text-white leading-none whitespace-nowrap"
                    >
                      Join waitlist
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelectedPlan({ plan: p.plan, period: billingPeriod, priceUSD: billingPeriod==='monthly' ? p.monthly : p.monthly*12 }); setSubModalOpen(true) }}
                      className="w-full py-3 px-6 rounded-lg font-medium bg-[#5ACEA8] text-white hover:bg-[#49C89A]"
                    >
                      Get started
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How do credits work?
                </h3>
                <p className="text-gray-600 mb-6">
                  One credit covers one full contract analysis plus chat. Buy credits as needed—no subscription, no commitment.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Do credits expire?
                </h3>
                <p className="text-gray-600">
                  Credits do not expire. They stay in your account until you use them.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-gray-600 mb-6">
                  Not yet, we will soon start offering custom solutions for large organizations including 
                  on-premise deployment, custom integrations, and dedicated support.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Do you have a free option?
                </h3>
                <p className="text-gray-600">
                  Yes. Every account includes 1 free analysis per month—no credit card required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

  {isMethodModalOpen && selectedBundle && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!isLoading) setMethodModalOpen(false)
          }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setMethodModalOpen(false)}
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose payment method</h3>
            <p className="text-gray-600 mb-6">Buying {selectedBundle.credits} credit{selectedBundle.credits > 1 ? 's' : ''} for ${selectedBundle.priceUSD}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleBuyCredits}
                disabled={isLoading || processingMethod === 'crypto'}
                className={`w-full py-3 px-6 rounded-lg font-medium text-center transition-colors ${
                  'bg-[#4ECCA3] text-white hover:bg-[#4ECCA3]/90 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {processingMethod === 'card' ? 'Processing…' : 'Card'}
              </button>
              <button
                onClick={handleBuyCreditsCrypto}
                disabled={true}
                className={`w-full py-3 px-6 rounded-lg font-medium text-center transition-colors ${
                  'bg-gray-300 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
  )}

  {isBundleModalOpen && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!isLoading) setBundleModalOpen(false) }}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close" onClick={() => setBundleModalOpen(false)} disabled={isLoading} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select credits</h3>
        <p className="text-gray-600 mb-6">Choose a bundle. You can pay with card or crypto.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {bundles.map((b) => (
            <button
              key={`bundle-${b.credits}`}
              onClick={() => { setSelectedBundle(b); setBundleModalOpen(false); setMethodModalOpen(true) }}
                className={`relative text-left rounded-2xl border ${b.popular ? 'border-[#4ECCA3] ring-2 ring-[#4ECCA3]/30' : 'border-gray-200'} bg-white hover:bg-gray-50 p-5 pt-7 transition-shadow`}
            >
              {b.popular && (
                <span className="absolute -top-3 right-3 text-xs px-2 py-1 rounded-full bg-[#4ECCA3] text-white shadow">Best value</span>
              )}
              <div className="text-2xl font-bold text-gray-900 mb-1">${b.priceUSD}</div>
              <div className="text-sm text-gray-600">{b.credits} credit{b.credits>1?'s':''}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

      {isSubModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!isLoading) setSubModalOpen(false) }}>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={() => setSubModalOpen(false)} disabled={isLoading} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Subscribe to {selectedPlan.plan} ({selectedPlan.period})</h3>
            <p className="text-gray-600 mb-4">Total: ${selectedPlan.priceUSD}</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={async () => { await startFlutterwaveSubscribeCheckout() }} disabled={isLoading} className="py-3 px-6 rounded-lg font-medium bg-[#4ECCA3] text-white hover:bg-[#4ECCA3]/90 disabled:opacity-50">Card</button>
            </div>
          </div>
        </div>
      )}

      {isWaitlistOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!isLoading) setWaitlistOpen(false) }}>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={() => setWaitlistOpen(false)} disabled={isLoading} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Join the waitlist</h3>
            <p className="text-gray-600 mb-4">We’ll notify you when these plans are available.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!waitlistEmail || waitlistPlans.length === 0) { toast.error('Email and at least one plan are required'); return }
                try {
                  setIsLoading(true)
                  const baseEnv = import.meta.env.VITE_API_ORIGIN
                  const base = baseEnv && baseEnv.length > 0 ? baseEnv : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'https://preview.helloaca.xyz' : window.location.origin)
                  const res = await fetch(`${base}/api/waitlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: waitlistName, email: waitlistEmail, plans: waitlistPlans, userId: user?.id, source: 'pricing' })
                  })
                  const data = await res.json().catch(() => null)
                  if (res.ok && data?.status === 'success') {
                    toast.success('Added to waitlist')
                    setWaitlistOpen(false)
                    setWaitlistName('')
                    setWaitlistPlans([])
                  } else {
                    toast.error(typeof data?.error === 'string' ? data.error : 'Could not save')
                  }
                } catch {
                  toast.error('Network error')
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Name</label>
                  <input value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 px-3" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} className="w-full h-11 rounded-lg border border-gray-300 px-3" placeholder="you@example.com" type="email" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Plans</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(['team','business','enterprise'] as const).map((pl) => (
                      <label key={pl} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                        <input type="checkbox" checked={waitlistPlans.includes(pl)} onChange={(e) => {
                          const checked = e.target.checked
                          setWaitlistPlans((prev) => {
                            if (checked && !prev.includes(pl)) return [...prev, pl]
                            if (!checked) return prev.filter((x) => x !== pl)
                            return prev
                          })
                        }} />
                        <span className="capitalize">{pl}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setWaitlistOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-[#4ECCA3] text-white disabled:opacity-50">Join waitlist</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pricing
