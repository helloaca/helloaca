import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Check, Star, Zap, Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

const Pricing: React.FC = () => {
  const navigate = useNavigate()
  
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Try HelloACA with limited usage',
      features: [
        '1 contract per month',
        'Basic AI-powered analysis'
      ],
      popular: false as const,
      cta: 'Get Started'
    },
    {
      name: 'Pro',
      price: 3,
      period: 'month',
      description: 'Unlimited contract analysis for individuals and teams',
      features: [
        'Unlimited contracts',
        'Full AI analysis suite'
      ],
      popular: true as const,
      cta: 'Subscribe'
    }
  ]

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

      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      const planCode = import.meta.env.VITE_PAYSTACK_PLAN_CODE
      if (!publicKey) {
        toast.error('Payment is not configured')
        return
      }

      setIsLoading(true)
      try {
        await loadPaystackScript()
      } catch {
        setIsLoading(false)
        toast.error('Network error loading payment library')
        return
      }

      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop || typeof PaystackPop.setup !== 'function') {
        setIsLoading(false)
        toast.error('Payment library failed to load')
        return
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: 300,
        currency: 'USD',
        ...(planCode ? { plan: planCode } : {}),
        metadata: { plan: 'pro' },
        callback: async (response: any) => {
          try {
            const base = import.meta.env.VITE_API_ORIGIN || (window.location.hostname.endsWith('ngrok-free.app') ? 'https://helloaca.xyz' : '')
            const res = await fetch(`${base}/api/paystack-verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference })
            })
            const data = await res.json()
            if (data?.status === 'success') {
              const { supabase } = await import('../lib/supabase')
              await supabase
                .from('user_profiles')
                .update({ plan: 'pro' })
                .eq('id', user.id)
              toast.success('Subscription activated')
            } else {
              toast.error('Payment verification failed')
            }
          } catch {
            toast.error('Could not verify payment')
          } finally {
            setIsLoading(false)
          }
        },
        onClose: () => {
          setIsLoading(false)
          toast.info('Payment canceled')
        }
      })
      handler.openIframe()
    } catch {
      setIsLoading(false)
      toast.error('Payment initialization failed')
    }
  }, [user, navigate, loadPaystackScript])

  const handleSubscribeCrypto = useCallback(async () => {
    try {
      if (!user) {
        toast.error('Please sign in to subscribe')
        navigate('/login')
        return
      }

      setIsLoading(true)
      const base = import.meta.env.VITE_API_ORIGIN || (window.location.hostname.endsWith('ngrok-free.app') ? 'https://helloaca.xyz' : '')
      const res = await fetch(`${base}/api/coinbase-create-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })
      const data = await res.json()
      const url = data?.hosted_url
      if (url) {
        window.location.href = url
        return
      }
      toast.error('Failed to start crypto payment')
    } catch {
      toast.error('Failed to start crypto payment')
    } finally {
      setIsLoading(false)
    }
  }, [user, navigate])

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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              One simple plan for unlimited analysis. Start free and upgrade anytime.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">No setup fees</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.name === 'Pro' ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors ${
                        'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Processing…' : 'Subscribe with Card'}
                    </button>
                    <button
                      onClick={handleSubscribeCrypto}
                      disabled={isLoading}
                      className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors ${
                        'bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Processing…' : 'Pay with Crypto'}
                    </button>
                  </div>
                ) : (
                  <Link
                    to={'/register'}
                    className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors ${
                      'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Why Choose HelloACA?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600">
                  Analyze contracts in seconds, not hours. Our AI processes documents 
                  instantly to give you immediate insights.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Bank-Level Security</h3>
                <p className="text-gray-600">
                  Your documents are protected with enterprise-grade encryption and 
                  security measures that exceed industry standards.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Accuracy</h3>
                <p className="text-gray-600">
                  Trained on millions of legal documents, our AI delivers 
                  professional-grade analysis you can trust.
                </p>
              </div>
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
                  Can I change plans anytime?
                </h3>
                <p className="text-gray-600 mb-6">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take 
                  effect immediately, and we'll prorate any billing differences.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What happens to my data if I cancel?
                </h3>
                <p className="text-gray-600">
                  Your data remains accessible for 30 days after cancellation. You can 
                  export all your documents and analyses during this period.
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
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  All plans come with a 14-day free trial. No credit card required 
                  to start, and you can cancel anytime during the trial period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Pricing