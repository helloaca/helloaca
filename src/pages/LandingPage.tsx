import React, { useEffect, useRef, useState } from 'react'
import Typewriter from 'typewriter-effect'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CheckCircle, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { trackPricing } from '@/lib/analytics'

const AnimateOnScroll: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setShow(true)
          obs.disconnect()
        }
      })
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`${className ?? ''} ${show ? 'animate-in fade-in slide-in-from-bottom duration-700' : 'opacity-0 translate-y-2'}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-8 sm:mt-8">
          <AnimateOnScroll>
          <h1 className="font-space-grotesk text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 flex items-center justify-center gap-2">
            <span className="mr-1">Built for</span>
            <span className="text-primary inline-block">
              <Typewriter
                options={{
                  strings: [
                    'you',
                    'founders',
                    'lawyers',
                    'procurement',
                    'contract managers',
                    'freelancers',
                    'vendors',
                    'buyers',
                    'teams'
                  ],
                  autoStart: true,
                  loop: true,
                  deleteSpeed: 30
              }}
              />
            </span>
          </h1>
          </AnimateOnScroll>
          <AnimateOnScroll delay={100}>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload. Analyze. Understand. Unlimited contract analysis for $3/month. Start free with 1 contract/month.
          </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base sm:text-lg px-8 py-4 min-h-[48px]" onClick={() => navigate('/register')}>
              Try Free
            </Button>
            <Button variant="secondary" size="lg" className="text-base sm:text-lg px-8 py-4 min-h-[48px]" onClick={() => navigate('/pricing')}>
              Subscribe $3/month
            </Button>
          </div>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={300}>
          <div className="mt-12 sm:mt-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-card p-2 sm:p-3 md:p-4 max-w-4xl mx-auto relative">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
              <img
                src="/mobile-dashboard-screenshot.png"
                alt="HelloACA mobile dashboard screenshot"
                className="w-full h-auto object-cover block sm:hidden"
              />
              <img
                src="/dashboard-screenshot.png"
                alt="HelloACA dashboard screenshot"
                className="w-full h-auto object-cover hidden sm:block"
              />
            </div>
            <div className="hidden sm:block absolute -right-12 md:-right-16 lg:-right-24 bottom-6 z-20">
              <div className="rounded-2xl border-4 border-primary-100 bg-primary-50 shadow-2xl p-1 overflow-hidden">
                <div className="relative">
                  <img
                    src="/mobile-dashboard-screenshot.png"
                    alt="HelloACA mobile dashboard screenshot"
                    className="w-28 md:w-40 lg:w-48 rounded-xl"
                  />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 md:h-12 bg-gradient-to-t from-primary-50 to-transparent" />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-t from-white to-transparent z-10" />
          </div>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4 flex items-center justify-center gap-2">
              <span>How</span>
              <img src="/helloaca.png" alt="helloaca" className="h-8 sm:h-10" />
              <span>works</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Upload, analyze, and chat — three simple steps.
            </p>
          </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <AnimateOnScroll>
            <div className="relative rounded-2xl bg-white/60 backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <span className="pointer-events-none absolute top-2 left-4 font-bold text-6xl sm:text-7xl md:text-8xl text-gray-500/20">01</span>
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Upload</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">&amp; Scan</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                Drag your contract or NDA. Supports PDF and DOCX with OCR.
              </p>
            </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={100}>
            <div className="relative rounded-2xl bg-white/60 backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <span className="pointer-events-none absolute top-2 left-4 font-bold text-6xl sm:text-7xl md:text-8xl text-gray-500/20">02</span>
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Instant</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">AI Insights</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                Comprehensive analysis in seconds: risks, clauses, obligations.
              </p>
            </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200}>
            <div className="relative rounded-2xl bg-white/60 backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <span className="pointer-events-none absolute top-2 left-4 font-bold text-6xl sm:text-7xl md:text-8xl text-gray-500/20">03</span>
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Chat with</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">Contract</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                Ask questions and get instant answers about terms and duties.
              </p>
            </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative pt-12 sm:pt-16 md:pt-20 pb-24 sm:pb-28 md:pb-32 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4 flex items-center justify-center gap-2">
              <span>Why</span>
              <img src="/helloaca.png" alt="helloaca" className="h-8 sm:h-10" />
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Clarity without complexity, instant risk detection, full control, and protection that’s always accessible.
            </p>
          </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <AnimateOnScroll>
            <div className="relative rounded-2xl bg-white backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <div className="absolute -top-3 left-6 h-6 w-20 rounded-t-xl bg-white ring-1 ring-white/50" />
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Clarity</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">Without Complexity</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                Understand exactly what your contract says — without legal jargon, confusion, or overwhelm. AI turns dense text into clear insights.
              </p>
            </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
            <div className="relative rounded-2xl bg-white backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <div className="absolute -top-3 left-6 h-6 w-20 rounded-t-xl bg-white ring-1 ring-white/50" />
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Instant</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">Risk Detection</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                Spot hidden clauses, unfair terms, and risky obligations in seconds. Know the danger zones before they become real problems.
              </p>
            </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={200}>
            <div className="relative rounded-2xl bg-white backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <div className="absolute -top-3 left-6 h-6 w-20 rounded-t-xl bg-white ring-1 ring-white/50" />
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Control Over</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">Every Decision</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                See your rights, duties, deadlines, and protections at a glance. Make confident choices backed by AI precision — not guesswork.
              </p>
            </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={300}>
            <div className="relative rounded-2xl bg-white backdrop-blur-md ring-1 ring-white/50 shadow-xl p-6 sm:p-7">
              <div className="absolute -top-3 left-6 h-6 w-20 rounded-t-xl bg-white ring-1 ring-white/50" />
              <h3 className="font-space-grotesk font-bold tracking-tight text-base sm:text-lg md:text-base lg:text-lg text-black leading-snug">
                <span className="md:whitespace-nowrap">Protection</span>
                <br className="hidden md:block" />
                <span className="md:whitespace-nowrap">That’s Always Accessible</span>
              </h3>
              <p className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                No delays, no appointments, no expensive legal fees. Upload a contract anytime and get lawyer-level clarity instantly.
              </p>
            </div>
            </AnimateOnScroll>
          </div>
        </div>
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-24 sm:h-28 md:h-32 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 sm:h-28 md:h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              See what our users say about HelloACA
            </p>
          </div>
          </AnimateOnScroll>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <AnimateOnScroll>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "HelloACA saved me hours of review time! The AI analysis caught 
                  risks I would have missed, and the chat feature helped me understand 
                  complex clauses instantly."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Martinez</p>
                    <p className="text-sm text-gray-600">Real Estate Agent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </AnimateOnScroll>
            
            <AnimateOnScroll delay={100}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "Incredible tool for small law teams. The risk assessment feature 
                  helps us prioritize contract reviews and the PDF reports are 
                  perfect for client presentations."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">DJ</span>
                  </div>
                  <div>
                    <p className="font-semibold">David Johnson</p>
                    <p className="text-sm text-gray-600">Law Firm Partner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Free: 1 contract/month • Pro: $3/month unlimited
            </p>
          </div>
          </AnimateOnScroll>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Free Plan */}
            <AnimateOnScroll>
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Free Plan</CardTitle>
                <div className="text-2xl sm:text-3xl font-bold">$0</div>
                <CardDescription className="text-sm sm:text-base">Perfect for trying out HelloACA</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">1 contract per month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Basic clause analysis</span>
                  </li>
                  <li className="flex items-center text-gray-400">
                    <span className="h-4 w-4 sm:h-5 sm:w-5 mr-2">✗</span>
                    <span className="text-sm sm:text-base">No PDF export</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full min-h-[48px] text-base"
                  onClick={() => {
                    trackPricing.selectPlan('free')
                    navigate('/register')
                  }}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
            </AnimateOnScroll>
            
            {/* Pro Plan */}
            <AnimateOnScroll delay={100}>
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Pro Plan</CardTitle>
                <div className="text-2xl sm:text-3xl font-bold">$3<span className="text-base sm:text-lg font-normal">/month</span></div>
                <CardDescription className="text-sm sm:text-base">Unlimited contract analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Unlimited contracts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Full AI suite</span>
                  </li>
                </ul>
                <Button 
                  className="w-full min-h-[48px] text-base"
                  onClick={() => {
                    trackPricing.selectPlan('pro')
                    navigate('/pricing')
                  }}
                >
                  Subscribe $3/month
                </Button>
              </CardContent>
            </Card>
            </AnimateOnScroll>
            
            
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage