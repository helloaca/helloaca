import React from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Upload, Search, MessageCircle, CheckCircle, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { trackPricing } from '@/lib/analytics'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-space-grotesk text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
            Understand Any Contract in{' '}
            <span className="text-primary">Seconds</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload. Analyze. Understand. Make better legal decisions with AI-powered 
            contract analysis that detects risks, clauses, and obligations instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base sm:text-lg px-8 py-4 min-h-[48px]">
              Try for Free
            </Button>
            <Button variant="secondary" size="lg" className="text-base sm:text-lg px-8 py-4 min-h-[48px]">
              See Demo
            </Button>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="mt-12 sm:mt-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-card p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 text-left">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 sm:h-4 bg-primary-200 rounded w-1/2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 sm:h-4 bg-red-200 rounded w-2/3"></div>
              </div>
              <div className="mt-4 sm:mt-6 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="text-xs sm:text-sm text-gray-600">Analysis complete in 12 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
              How HelloACA Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to understand any contract completely
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="mx-auto mb-4 p-3 sm:p-4 bg-primary-100 rounded-full w-fit">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Upload &amp; Scan</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Drag your contract or NDA directly. We support PDF and DOCX files 
                  with automatic OCR processing.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="mx-auto mb-4 p-3 sm:p-4 bg-primary-100 rounded-full w-fit">
                  <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Instant AI Insights</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Get comprehensive analysis in 30 seconds. Risk assessment, 
                  clause extraction, and obligation identification.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="mx-auto mb-4 p-3 sm:p-4 bg-primary-100 rounded-full w-fit">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Chat with Contract</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Ask AI your legal questions. Get instant answers about 
                  responsibilities, deadlines, and contract terms.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              See what our users say about HelloACA
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-space-grotesk text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Free Plan */}
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
            
            {/* Pro Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Pro Plan</CardTitle>
                <div className="text-2xl sm:text-3xl font-bold">$49<span className="text-base sm:text-lg font-normal">/month</span></div>
                <CardDescription className="text-sm sm:text-base">For professionals and small teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">10 contracts per month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">AI chat functionality</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Risk classification</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">PDF report export</span>
                  </li>
                </ul>
                <Button 
                  className="w-full min-h-[48px] text-base"
                  onClick={() => {
                    trackPricing.selectPlan('pro')
                    navigate('/register')
                  }}
                >
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>
            
            {/* Business Plan */}
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Business Plan</CardTitle>
                <div className="text-2xl sm:text-3xl font-bold">$299<span className="text-base sm:text-lg font-normal">/month</span></div>
                <CardDescription className="text-sm sm:text-base">For growing businesses and law firms</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Unlimited contracts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">Multilingual analysis</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                    <span className="text-sm sm:text-base">White-label reports</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full min-h-[48px] text-base"
                  onClick={() => {
                    trackPricing.selectPlan('business')
                    navigate('/register')
                  }}
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage