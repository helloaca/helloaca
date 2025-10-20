import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { ArrowLeft } from 'lucide-react'

const TermsOfService: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showAuth={true} />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Terms of Service
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="text-sm text-gray-500 mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using HelloACA's contract analysis platform ("Service"), you accept and agree 
                  to be bound by the terms and provision of this agreement. If you do not agree to abide by the 
                  above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p>
                  HelloACA provides AI-powered contract analysis services that help users review, analyze, and 
                  understand legal documents. Our platform offers:
                </p>
                <ul>
                  <li>Automated contract analysis and risk assessment</li>
                  <li>Key term extraction and summarization</li>
                  <li>Compliance checking and recommendations</li>
                  <li>Document storage and management</li>
                  <li>Reporting and analytics tools</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
                <p>
                  To access certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
                <p>You agree not to use the Service to:</p>
                <ul>
                  <li>Upload or analyze illegal, harmful, or inappropriate content</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Use the Service for any commercial purpose without authorization</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
                <p>
                  The Service and its original content, features, and functionality are and will remain the 
                  exclusive property of HelloACA and its licensors. The Service is protected by copyright, 
                  trademark, and other laws. You retain ownership of your uploaded documents, but grant us 
                  a limited license to process them for analysis purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
                <p>
                  Your privacy is important to us. Our <a href='./privacy'>Privacy Policy</a> explains how we collect, use, and protect 
                  your information when you use our Service. By using our Service, you agree to the collection 
                  and use of information in accordance with our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription and Payment</h2>
                <p>
                  Some features of the Service are available through paid subscriptions. By purchasing a 
                  subscription, you agree to pay all applicable fees. Subscriptions automatically renew 
                  unless cancelled. Refunds are provided according to our refund policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
                <p>
                  The Service is provided "as is" without warranties of any kind. HelloACA does not guarantee 
                  the accuracy, completeness, or reliability of any analysis results. The Service is not a 
                  substitute for professional legal advice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p>
                  In no event shall HelloACA be liable for any indirect, incidental, special, consequential, 
                  or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without 
                  prior notice, for conduct that we believe violates these Terms or is harmful to other 
                  users, us, or third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes. Your continued use of the Service after such modifications constitutes 
                  acceptance of the updated terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> legal@helloaca.com</p>
                  <p><strong>Address:</strong> HelloACA Legal Team<br />
                  123 Legal Tech Avenue<br />
                  San Francisco, CA 94105</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TermsOfService