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
                <strong>Effective Date:</strong> December 31, 2025<br />
                <strong>Last Updated:</strong> December 31, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using Helloaca ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not access the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p>
                  Helloaca is an AI-powered contract analysis platform that provides:
                </p>
                <ul>
                  <li>Automated contract review and analysis</li>
                  <li>Risk assessment and identification</li>
                  <li>Interactive AI-powered contract consultation</li>
                  <li>Professional reporting and documentation</li>
                  <li>Secure document storage and management</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
                <ul>
                  <li>You must provide accurate, complete information during registration</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must be at least 18 years old to use the Service</li>
                  <li>One person or entity per account</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Account Security</h3>
                <ul>
                  <li>You are responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Use strong passwords and enable two-factor authentication when available</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Permitted Uses</h3>
                <ul>
                  <li>Contract analysis for legitimate business purposes</li>
                  <li>Educational and research purposes</li>
                  <li>Professional legal document review</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Prohibited Uses</h3>
                <ul>
                  <li>Uploading illegal, harmful, or malicious content</li>
                  <li>Attempting to reverse engineer or hack the Service</li>
                  <li>Sharing account credentials with unauthorized parties</li>
                  <li>Using the Service for spam or fraudulent activities</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. AI Analysis and Limitations</h2>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Important Legal Disclaimer:</strong> Helloaca uses artificial intelligence for contract analysis. 
                        AI analysis is provided as a tool to assist, not replace, professional legal advice.
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 AI Technology Disclaimer</h3>
                <ul>
                  <li>Helloaca uses artificial intelligence for contract analysis</li>
                  <li>AI analysis is provided as a tool to assist, not replace, professional legal advice</li>
                  <li>Results may contain errors or omissions</li>
                  <li>Users should verify all AI-generated insights</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 No Legal Advice</h3>
                <ul>
                  <li>Helloaca does not provide legal advice</li>
                  <li>The Service is not a substitute for professional legal counsel</li>
                  <li>Users should consult qualified attorneys for legal matters</li>
                  <li>We are not responsible for legal decisions based on our analysis</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data and Privacy</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Document Upload and Processing</h3>
                <ul>
                  <li>You retain ownership of all uploaded documents</li>
                  <li>We process documents solely to provide the Service</li>
                  <li>Documents are encrypted during transmission and storage</li>
                  <li>We do not use your documents to train AI models without consent</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Data Retention</h3>
                <ul>
                  <li>Documents are retained according to your subscription plan</li>
                  <li>You may delete documents at any time</li>
                  <li>We may retain anonymized analytics data</li>
                  <li>Account data is retained for legal and operational purposes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Credits, Plans and Billing</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Pay‑Per‑Use Credits</h3>
                <ul>
                  <li>Free access includes 1 contract analysis per month</li>
                  <li>Additional analyses require credits purchased in bundles or custom amounts</li>
                  <li>One credit covers one full analysis plus AI chat</li>
                  <li>Credits do not expire</li>
                </ul>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Subscription Plans</h3>
                <ul>
                  <li>Pro: $10/month or $120/year; includes 5 credits per month; unused credits roll over up to 10</li>
                  <li>Team: Coming Soon — custom pricing; includes seats, shared library, team dashboard, basic analytics, centralized billing</li>
                  <li>Business: Coming Soon — custom pricing; includes approval workflows, advanced analytics, custom templates, version comparison, white‑label reports, priority support</li>
                  <li>Enterprise: Coming Soon — custom pricing; includes custom risk frameworks, API access, SSO/SAML, integrations, audit trail, 99.9% SLA, account manager</li>
                </ul>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.3 Billing Terms</h3>
                <ul>
                  <li>Charges are billed at the time of purchase or renewal</li>
                  <li>All fees are non‑refundable except as required by law</li>
                  <li>Prices may change with reasonable notice</li>
                  <li>Additional seat and contract packs are billed separately where applicable</li>
                </ul>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.4 Account Changes</h3>
                <ul>
                  <li>You may switch plans at any time; changes take effect at next billing period unless stated otherwise</li>
                  <li>Account deletion removes associated personal data according to our Privacy Policy</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Service IP</h3>
                <ul>
                  <li>Helloaca owns all rights to the Service, including AI models</li>
                  <li>Users receive a limited license to use the Service</li>
                  <li>No rights are granted beyond the scope of these Terms</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.2 User Content</h3>
                <ul>
                  <li>You retain ownership of uploaded documents</li>
                  <li>You grant us a license to process documents for Service provision</li>
                  <li>You represent that you have rights to upload all content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 Service Availability</h3>
                <ul>
                  <li>We strive for 99.5% uptime but cannot guarantee continuous availability</li>
                  <li>Maintenance and updates may cause temporary interruptions</li>
                  <li>We are not liable for service interruptions</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.2 Accuracy Disclaimer</h3>
                <ul>
                  <li>AI analysis is provided "as is" without warranties</li>
                  <li>We do not guarantee accuracy, completeness, or reliability</li>
                  <li>Users must verify all analysis results independently</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Liability Limits</h3>
                <ul>
                  <li>Our liability is limited to the amount paid for the Service</li>
                  <li>We are not liable for indirect, consequential, or punitive damages</li>
                  <li>Some jurisdictions may not allow liability limitations</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">10.2 Indemnification</h3>
                <ul>
                  <li>Users agree to indemnify Helloaca against claims arising from their use</li>
                  <li>This includes violations of Terms or applicable laws</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 Termination by User</h3>
                <ul>
                  <li>Users may terminate their account at any time</li>
                  <li>Data export tools are available before termination</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.2 Termination by Helloaca</h3>
                <ul>
                  <li>We may terminate accounts for Terms violations</li>
                  <li>We may suspend Service for non-payment</li>
                  <li>30 days' notice for termination without cause</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Disputes</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">12.1 Governing Law</h3>
                <p>These Terms are governed by applicable law and disputes will be resolved in appropriate courts.</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">12.2 Dispute Resolution</h3>
                <ul>
                  <li>Good faith negotiation required before litigation</li>
                  <li>Arbitration may be required for certain disputes</li>
                  <li>Class action waivers may apply</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
                <ul>
                  <li>We may update these Terms with reasonable notice</li>
                  <li>Continued use constitutes acceptance of changes</li>
                  <li>Material changes require explicit consent</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Security and Compliance</h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Security Standards:</strong> Helloaca maintains SOC 2 Type II compliance, 
                        end-to-end encryption (AES-256), and GDPR/CCPA compliance to protect your data.
                      </p>
                    </div>
                  </div>
                </div>
                <ul>
                  <li>SOC 2 Type II compliance for security controls</li>
                  <li>End-to-end encryption (AES-256) for all data</li>
                  <li>GDPR and CCPA compliance for data protection</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>24/7 security monitoring and incident response</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Legal Inquiries:</strong></p>
                      <p>Email: legal@helloaca.xyz</p>
                    </div>
                    <div>
                      <p><strong>General Support:</strong></p>
                      <p>Email: support@helloaca.xyz</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p><strong>Website:</strong> https://helloaca.xyz</p>
                  </div>
                </div>
              </section>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-8">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>Important Notice:</strong> This document has been prepared to comply with applicable 
                      data protection and privacy laws. Users should consult with qualified legal counsel for 
                      specific legal advice regarding their use of the Service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TermsOfService
