import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Check, Star, Zap, Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const Pricing: React.FC = () => {
  const navigate = useNavigate()
  
  const plans = [
    {
      name: 'Starter',
      price: 29,
      period: 'month',
      description: 'Perfect for small law firms and individual practitioners',
      features: [
        'Up to 50 contract analyses per month',
        'Basic AI-powered contract review',
        'Standard templates library',
        'Email support',
        'Basic reporting',
        '2 user accounts'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      price: 79,
      period: 'month',
      description: 'Ideal for growing law firms and legal departments',
      features: [
        'Up to 200 contract analyses per month',
        'Advanced AI contract analysis',
        'Premium templates library',
        'Priority email & chat support',
        'Advanced reporting & analytics',
        '10 user accounts',
        'Custom clause library',
        'Integration with popular tools'
      ],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      price: 199,
      period: 'month',
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited contract analyses',
        'Enterprise-grade AI analysis',
        'Custom templates & workflows',
        'Dedicated account manager',
        'Advanced analytics & insights',
        'Unlimited user accounts',
        'Custom integrations',
        'SLA guarantee',
        'On-premise deployment option',
        'Advanced security features'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ]

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
              Choose the perfect plan for your legal practice. All plans include our core 
              AI-powered contract analysis features with no hidden fees.
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
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
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

                <Link
                  to={plan.cta === 'Contact Sales' ? '/contact' : '/register'}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
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