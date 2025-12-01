import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Check, ArrowLeft, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserCredits, addUserCredits } from '@/lib/utils'
import { toast } from 'sonner'
import mixpanel from 'mixpanel-browser'

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

  const bundles = [
    { credits: 1, priceUSD: 7, popular: false as const },
    { credits: 5, priceUSD: 30, popular: true as const },
    { credits: 10, priceUSD: 55, popular: false as const }
  ]

  // Removed: custom pricing calculator; using fixed bundles
  // Removed inline custom credits UI; modal uses predefined bundles

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

  const handleSubscribePlan = useCallback(async (method: 'card'|'crypto') => {
    try {
      if (!user || !selectedPlan) {
        toast.error('Please sign in and select a plan')
        navigate('/login')
        return
      }
      const testMode = String(import.meta.env.VITE_PAYSTACK_TEST_MODE || '').toLowerCase() === 'mock'
      const base = import.meta.env.VITE_API_ORIGIN || window.location.origin
      if (method === 'crypto') {
        setIsLoading(true)
        setProcessingMethod('crypto')
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 10000)
        try {
          const res = await fetch(`${base}/api/coinbase-create-charge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, email: user.email, amount_usd: selectedPlan.priceUSD, plan: selectedPlan.plan, period: selectedPlan.period }),
            signal: controller.signal
          })
          const data = await res.json().catch(() => null)
          clearTimeout(timer)
          const url = data?.hosted_url
          if (res.ok && url) {
            setSubModalOpen(false)
            window.location.href = url
            return
          }
          toast.error(typeof data?.error === 'string' ? data.error : 'Failed to start crypto payment')
        } catch {
          clearTimeout(timer)
          toast.error('Network error starting crypto payment')
        } finally {
          setIsLoading(false)
          setProcessingMethod(null)
        }
        return
      }

      if (testMode) {
        setIsLoading(true)
        setProcessingMethod('card')
        try {
          const result = await auth.updateProfile({ plan: selectedPlan.plan })
          if (result.success) {
            await auth.refreshProfile()
            setSubModalOpen(false)
            toast.success('Subscription activated (mock)')
          } else {
            toast.error(result.error || 'Failed to update plan')
          }
        } catch {
          toast.error('Mock subscription failed')
        } finally {
          setIsLoading(false)
          setProcessingMethod(null)
        }
        return
      }
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (!publicKey) {
        toast.error('Payment is not configured')
        return
      }

      setIsLoading(true)
      setProcessingMethod('card')
      try { await loadPaystackScript() } catch { setIsLoading(false); setProcessingMethod(null); toast.error('Network error loading payment library'); return }
      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop || typeof PaystackPop.setup !== 'function') { setIsLoading(false); setProcessingMethod(null); toast.error('Payment library failed to load'); return }
      let amountKobo: number = 0
      try {
        const rateRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN')
        const rateJson = await rateRes.json().catch(() => null)
        const rate = typeof rateJson?.rates?.NGN === 'number' ? rateJson.rates.NGN : null
        const ngn = Math.round(((rate || 1500) * selectedPlan.priceUSD))
        amountKobo = ngn * 100
      } catch { amountKobo = 1500 * selectedPlan.priceUSD * 100 }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: String(user.email),
        amount: amountKobo,
        currency: 'NGN',
        reference: `${selectedPlan.plan.toUpperCase()}-${selectedPlan.period}-${Date.now()}`,
        channels: ['card'],
        metadata: { plan: selectedPlan.plan, period: selectedPlan.period },
        callback: (response: any) => {
          (async () => {
            try {
              const res = await fetch(`${base}/api/paystack-verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: response.reference }) })
              const data = await res.json()
              if (data?.status === 'success') {
                const planUpdate = { plan: selectedPlan.plan }
                const result = await auth.updateProfile(planUpdate)
                if (result.success) { await auth.refreshProfile(); toast.success('Subscription activated') } else { toast.error(result.error || 'Failed to update plan') }
              } else { toast.error('Payment verification failed') }
            } catch { toast.error('Could not verify payment') }
            finally { setIsLoading(false); setProcessingMethod(null) }
          })()
        },
        onClose: function () { setIsLoading(false); setProcessingMethod(null); toast.info('Payment canceled') }
      })
      setSubModalOpen(false)
      handler.openIframe()
    } catch (err) {
      setIsLoading(false)
      setProcessingMethod(null)
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed')
    }
  }, [user, selectedPlan, navigate, loadPaystackScript])

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
      const testMode = String(import.meta.env.VITE_PAYSTACK_TEST_MODE || '').toLowerCase() === 'mock'
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (testMode) {
        setIsLoading(true)
        setProcessingMethod('card')
        try {
          const baseEnv = import.meta.env.VITE_API_ORIGIN
          const base = baseEnv && baseEnv.length > 0
            ? baseEnv
            : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'https://helloaca.xyz'
                : window.location.origin)
          const reference = `MOCK-${Date.now()}`
          addUserCredits(user.id, selectedBundle.credits)
          setCreditBalance(getUserCredits(user.id))
          try {
            await fetch(`${base}/api/notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'credit_purchase', userId: user.id, extra: { credits: selectedBundle.credits, reference } })
            })
          } catch { /* noop */ }
          toast.success(`Added ${selectedBundle.credits} credits (mock)`) 
          setMethodModalOpen(false)
        } catch {
          toast.error('Mock payment failed')
        } finally {
          setIsLoading(false)
          setProcessingMethod(null)
        }
        return
      }
      if (!publicKey) {
        toast.error('Payment is not configured')
        return
      }

      setIsLoading(true)
      setProcessingMethod('card')
      try {
        await loadPaystackScript()
      } catch {
        setIsLoading(false)
        setProcessingMethod(null)
        toast.error('Network error loading payment library')
        return
      }

      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop || typeof PaystackPop.setup !== 'function') {
        setIsLoading(false)
        setProcessingMethod(null)
        toast.error('Payment library failed to load')
        return
      }

      let amountKobo: number = 0
      try {
        const rateRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN')
        const rateJson = await rateRes.json().catch(() => null)
        const rate = typeof rateJson?.rates?.NGN === 'number' ? rateJson.rates.NGN : null
        const ngn = Math.round(((rate || 1500) * selectedBundle.priceUSD))
        amountKobo = ngn * 100
      } catch {
        amountKobo = 1500 * selectedBundle.priceUSD * 100
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: amountKobo,
        currency: 'NGN',
        reference: `CREDITS-${selectedBundle.credits}-${Date.now()}`,
        channels: ['card'],
        metadata: { credits: selectedBundle.credits },
        callback: (response: any) => {
          (async () => {
            try {
              const baseEnv = import.meta.env.VITE_API_ORIGIN
              const base = baseEnv && baseEnv.length > 0
                ? baseEnv
                : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'https://helloaca.xyz'
                    : window.location.origin)
              const url = `${base}/api/paystack-verify?reference=${encodeURIComponent(response.reference)}`
              const res = await fetch(url)
              const data = await res.json()
              if (data?.status === 'success') {
                if (auth?.refreshProfile && user?.id) {
                  await auth.refreshProfile()
                  setCreditBalance(getUserCredits(user.id))
                }
                try {
                  const baseEnv = import.meta.env.VITE_API_ORIGIN
                  const base = baseEnv && baseEnv.length > 0
                    ? baseEnv
                    : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? 'https://helloaca.xyz'
                        : window.location.origin)
                  await fetch(`${base}/api/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'credit_purchase', userId: user?.id, extra: { credits: selectedBundle.credits, reference: response.reference } })
                  })
                } catch { /* noop */ }
                mixpanel.track('Purchase', {
                  user_id: user?.id,
                  transaction_id: response.reference,
                  revenue: selectedBundle.priceUSD,
                  currency: 'USD'
                })
                mixpanel.track('Conversion', {
                  Conversion_Type: 'purchase',
                  Conversion_Value: selectedBundle.priceUSD
                })
                toast.success(`Added ${selectedBundle.credits} credits`)
              } else {
                toast.error('Payment verification failed')
              }
            } catch {
              mixpanel.track('API Error', {
                error_type: 'paystack_verify',
                transaction_id: response.reference
              })
              toast.error('Could not verify payment')
            } finally {
              setIsLoading(false)
              setProcessingMethod(null)
            }
          })()
        },
        onClose: function () {
          setIsLoading(false)
          setProcessingMethod(null)
          toast.info('Payment canceled')
        }
      })
      setMethodModalOpen(false)
      handler.openIframe()
    } catch (err) {
      setIsLoading(false)
      setProcessingMethod(null)
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed')
    }
  }, [user, navigate, loadPaystackScript, selectedBundle])

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
              { plan: 'pro' as const, title: 'Pro', monthly: 24, features: ['5 credits/month','1 seat','Full analysis','Chat with contract','Negotiation playbook','PDF export','Rollover up to 10'] },
              { plan: 'team' as const, title: 'Team', monthly: 79, features: ['30 analyses/month (team)','5 seats','Shared library','Team dashboard','Basic analytics','Centralized billing'] },
              { plan: 'business' as const, title: 'Business', monthly: 199, features: ['100 analyses/month (team)','15 seats','Approval workflows','Advanced analytics','Custom templates','Version comparison','White‑label reports','Priority support'] },
              { plan: 'enterprise' as const, title: 'Enterprise', monthly: 499, features: ['500 analyses/month (team)','50 seats','Custom risk frameworks','API access','SSO/SAML','Integrations','Audit trail','SLA 99.9%','Account manager'] }
            ]).map((p) => (
              <div key={p.plan} className="bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{p.title}</h3>
                    <p className="text-gray-600">{billingPeriod==='monthly' ? `$${p.monthly}/month` : `$${p.monthly*12}/year`}</p>
                  </div>
                  {p.plan==='business' && (
                    <span className="absolute -top-3 right-4 text-xs px-2 py-1 rounded-full bg-gray-900 text-white shadow">Most popular</span>
                  )}
                </div>
                <ul className="space-y-2 text-sm mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />{f}</li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <button
                    onClick={() => { setSelectedPlan({ plan: p.plan, period: billingPeriod, priceUSD: billingPeriod==='monthly' ? p.monthly : p.monthly*12 }); setSubModalOpen(true) }}
                    className="w-full py-3 px-6 rounded-lg font-medium bg-[#5ACEA8] text-white hover:bg-[#49C89A]"
                  >
                    Get started
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Plan Comparison */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                    {['Pay‑Per‑Use','$24/mo Pro','$79/mo Team','$199/mo Business','$499/mo Enterprise'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {[
                    ['Credits/Analyses','Buy as needed','5/month','30/month (team)','100/month (team)','500/month (team)'],
                    ['Seats','1','1','5','15','50'],
                    ['Contract Library','Personal','Personal','Shared','Shared','Shared'],
                    ['Chat with Contract','✓','✓','✓','✓','✓'],
                    ['Negotiation Playbook','✓','✓','✓','✓','✓'],
                    ['PDF Export','✓','✓','✓','✓','✓'],
                    ['Team Dashboard','—','—','Basic','Advanced','Custom'],
                    ['Analytics','—','—','Basic','Advanced','Custom'],
                    ['Approval Workflows','—','—','—','✓','✓'],
                    ['Custom Templates','—','—','—','✓','✓'],
                    ['Version Comparison','—','—','—','✓','✓'],
                    ['White‑Label Reports','—','—','—','✓','✓'],
                    ['Custom Risk Frameworks','—','—','—','—','✓'],
                    ['API Access','—','—','—','—','✓'],
                    ['SSO/SAML','—','—','—','—','✓'],
                    ['Integrations','—','—','—','—','✓'],
                    ['Audit Trail','—','—','—','—','✓'],
                    ['Dedicated Support','—','—','Email','Priority','Account Manager'],
                    ['SLA','—','—','—','24 hours','99.9%'],
                    ['Support Response','5 days','3 days','48 hours','24 hours','4 hours']
                  ].map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cidx) => (
                        <td key={cidx} className="px-4 py-2 text-gray-900">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  Yes, we offer custom solutions for large organizations including 
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
                  'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
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
              className={`relative text-left rounded-2xl border ${b.popular ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'} bg-white hover:bg-gray-50 p-5 pt-7 transition-shadow`}
            >
              {b.popular && (
                <span className="absolute -top-3 right-3 text-xs px-2 py-1 rounded-full bg-blue-600 text-white shadow">Best value</span>
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
            <div className="grid grid-cols-2 gap-3">
              <button onClick={async () => { await handleSubscribePlan('card') }} disabled={isLoading} className="py-3 px-6 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Card</button>
              <button onClick={async () => { await handleSubscribePlan('crypto') }} disabled={isLoading} className="py-3 px-6 rounded-lg font-medium bg-gray-900 text-white hover:bg-black disabled:opacity-50">Crypto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pricing