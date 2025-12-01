import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { ArrowLeft } from 'lucide-react'

const PrivacyPolicy: React.FC = () => {
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
              Privacy Policy
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="text-sm text-gray-500 mb-8">
                <strong>Effective Date:</strong> December 31, 2025<br />
                <strong>Last Updated:</strong> December 31, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p>
                  Helloaca ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our 
                  AI-powered contract analysis platform ("Service").
                </p>
                <p className="mt-4">
                  By using our Service, you consent to the data practices described in this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
                <p>We collect information you provide directly to us, including:</p>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, password, company name</li>
                  <li><strong>Profile Information:</strong> Job title, department, professional preferences</li>
                  <li><strong>Billing Information:</strong> Payment details, billing address (processed securely by third-party providers)</li>
                  <li><strong>Communication Data:</strong> Messages, support requests, feedback</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Document and Content Information</h3>
                <ul>
                  <li><strong>Uploaded Documents:</strong> Contracts, legal documents, and related files</li>
                  <li><strong>Analysis Data:</strong> AI-generated insights, risk assessments, and recommendations</li>
                  <li><strong>User Interactions:</strong> Queries, annotations, comments, and feedback on analyses</li>
                  <li><strong>Document Metadata:</strong> File names, upload timestamps, document properties</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Technical Information</h3>
                <ul>
                  <li><strong>Usage Data:</strong> Features used, time spent, interaction patterns</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                  <li><strong>Log Data:</strong> Access logs, error reports, performance metrics</li>
                  <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Service Provision</h3>
                <ul>
                  <li>Provide AI-powered contract analysis and insights</li>
                  <li>Generate risk assessments and recommendations</li>
                  <li>Store and manage your documents securely</li>
                  <li>Enable collaboration features and document sharing</li>
                  <li>Provide customer support and technical assistance</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Service Improvement</h3>
                <ul>
                  <li>Analyze usage patterns to improve our AI models</li>
                  <li>Develop new features and functionality</li>
                  <li>Conduct research and analytics (using anonymized data)</li>
                  <li>Optimize platform performance and user experience</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.3 Communication and Marketing</h3>
                <ul>
                  <li>Send service-related notifications and updates</li>
                  <li>Provide educational content and best practices</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Respond to inquiries and support requests</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.4 Legal and Compliance</h3>
                <ul>
                  <li>Comply with legal obligations and regulatory requirements</li>
                  <li>Protect against fraud, abuse, and security threats</li>
                  <li>Enforce our Terms of Service and other policies</li>
                  <li>Respond to legal requests and court orders</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI and Machine Learning</h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>AI Processing Notice:</strong> Your documents are processed by our AI systems 
                        to provide contract analysis. We do not use your documents to train our AI models 
                        without explicit consent.
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 AI Processing</h3>
                <ul>
                  <li>Documents are processed by AI systems for analysis purposes only</li>
                  <li>AI models analyze contract terms, clauses, and potential risks</li>
                  <li>Processing occurs in secure, encrypted environments</li>
                  <li>AI-generated insights are stored with your account data</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Model Training</h3>
                <ul>
                  <li>We do not use your documents to train AI models without explicit consent</li>
                  <li>Anonymized, aggregated data may be used for model improvement</li>
                  <li>You can opt out of data usage for model training</li>
                  <li>Enterprise customers have additional control over data usage</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Analytics and Tracking</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Google Analytics</h3>
                <p>
                  We use Google Analytics (Measurement ID: G-0JVYR712V0) to understand how users interact with our website and services. This helps us improve user experience and optimize our platform.
                </p>
                <ul>
                  <li><strong>Data Collected:</strong> Page views, user interactions, session duration, and anonymized usage patterns</li>
                  <li><strong>Purpose:</strong> Website optimization, user experience improvement, and performance analysis</li>
                  <li><strong>Data Retention:</strong> Google Analytics data is retained for 26 months</li>
                  <li><strong>Opt-Out:</strong> You can opt out of Google Analytics tracking using browser settings or Google's opt-out tools</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Cookie Usage</h3>
                <ul>
                  <li>Essential cookies for authentication and security</li>
                  <li>Analytics cookies for Google Analytics (can be disabled)</li>
                  <li>Preference cookies to remember your settings</li>
                  <li>No third-party advertising cookies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Information Sharing and Disclosure</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 We Do Not Sell Your Data</h3>
                <p>
                  We do not sell, rent, or trade your personal information or documents to third parties 
                  for their commercial purposes.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Limited Sharing</h3>
                <p>We may share your information only in the following circumstances:</p>
                <ul>
                  <li><strong>Service Providers:</strong> Trusted third parties who assist in service delivery (cloud hosting, payment processing)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or regulatory request</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                  <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
                  <li><strong>Safety and Security:</strong> To protect rights, property, or safety of users or others</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Team and Organization Sharing</h3>
                <ul>
                  <li>Team, Business and Enterprise plans allow document sharing within your organization</li>
                  <li>Administrators can manage user access, seats, and permissions</li>
                  <li>Shared documents remain under your organization's control</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security and Protection</h2>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <strong>Security Standards:</strong> Helloaca maintains SOC 2 Type II compliance, 
                        end-to-end encryption (AES-256), and enterprise-grade security measures.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Technical Safeguards</h3>
                <ul>
                  <li><strong>Encryption:</strong> AES-256 encryption for data at rest and in transit</li>
                  <li><strong>Access Controls:</strong> Multi-factor authentication and role-based permissions</li>
                  <li><strong>Network Security:</strong> Firewalls, intrusion detection, and monitoring</li>
                  <li><strong>Secure Infrastructure:</strong> SOC 2 Type II compliant cloud providers</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Operational Safeguards</h3>
                <ul>
                  <li><strong>Employee Training:</strong> Regular security awareness and privacy training</li>
                  <li><strong>Access Limitations:</strong> Principle of least privilege for employee access</li>
                  <li><strong>Incident Response:</strong> 24/7 monitoring and rapid incident response</li>
                  <li><strong>Regular Audits:</strong> Third-party security assessments and penetration testing</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.3 Data Backup and Recovery</h3>
                <ul>
                  <li>Automated, encrypted backups with geographic redundancy</li>
                  <li>Disaster recovery procedures with defined recovery time objectives</li>
                  <li>Regular backup testing and validation</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention and Deletion</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Retention Periods</h3>
                <ul>
                  <li><strong>Account Data:</strong> Retained while your account is active plus 3 years</li>
                  <li><strong>Documents:</strong> Retained according to your usage and account settings</li>
                  <li><strong>Usage Data:</strong> Retained for 2 years for analytics and improvement</li>
                  <li><strong>Support Data:</strong> Retained for 5 years for quality assurance</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Data Deletion</h3>
                <ul>
                  <li>You can delete documents and analyses at any time</li>
                  <li>Account deletion removes all associated personal data</li>
                  <li>Some data may be retained for legal or regulatory compliance</li>
                  <li>Anonymized data may be retained for research and improvement</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Privacy Rights</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 General Rights</h3>
                <ul>
                  <li><strong>Access:</strong> Request copies of your personal information</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.2 GDPR Rights (EU Residents)</h3>
                <ul>
                  <li>Right to be informed about data processing</li>
                  <li>Right to restrict processing under certain circumstances</li>
                  <li>Right to data portability in structured formats</li>
                  <li>Right to object to automated decision-making</li>
                  <li>Right to lodge complaints with supervisory authorities</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.3 CCPA Rights (California Residents)</h3>
                <ul>
                  <li>Right to know what personal information is collected</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to non-discrimination for exercising privacy rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 Cross-Border Processing</h3>
                <ul>
                  <li>Data may be processed in countries where we or our service providers operate</li>
                  <li>We ensure adequate protection through appropriate safeguards</li>
                  <li>EU data transfers comply with GDPR requirements</li>
                  <li>Standard Contractual Clauses (SCCs) are used where applicable</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.2 Data Localization</h3>
                <ul>
                  <li>Enterprise customers may request data residency in specific regions</li>
                  <li>EU customer data is primarily processed within the EU</li>
                  <li>Data location preferences can be configured in account settings</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies and Tracking Technologies</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Types of Cookies</h3>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how you use our Service</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">10.2 Cookie Management</h3>
                <ul>
                  <li>You can control cookie preferences in your browser settings</li>
                  <li>Our cookie banner allows you to manage consent</li>
                  <li>Disabling certain cookies may affect platform functionality</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Services</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 Service Providers</h3>
                <p>We work with trusted third-party providers for:</p>
                <ul>
                  <li><strong>Cloud Infrastructure:</strong> AWS, Google Cloud (SOC 2 compliant)</li>
                  <li><strong>Payment Processing:</strong> Paystack, Coinbase Commerce (PCI DSS compliant where applicable)</li>
                  <li><strong>Analytics:</strong> Google Analytics (Measurement ID: G-0JVYR712V0) for website usage analytics with anonymized data</li>
                  <li><strong>Customer Support:</strong> Intercom, Zendesk</li>
                  <li><strong>Email Services:</strong> SendGrid, Mailchimp</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.2 Third-Party Policies</h3>
                <ul>
                  <li>Third-party services have their own privacy policies</li>
                  <li>We require service providers to maintain appropriate security standards</li>
                  <li>Data Processing Agreements (DPAs) are in place with all processors</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Children's Privacy</h2>
                <p>
                  Helloaca is not intended for use by children under 18 years of age. We do not knowingly 
                  collect personal information from children under 18. If we become aware that we have 
                  collected personal information from a child under 18, we will take steps to delete such 
                  information promptly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
                <ul>
                  <li>We may update this Privacy Policy periodically</li>
                  <li>Material changes will be communicated via email or platform notification</li>
                  <li>Continued use after changes constitutes acceptance</li>
                  <li>Previous versions are available upon request</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Privacy Officer:</strong></p>
                      <p>Email: privacy@helloaca.xyz</p>
                    </div>
                    <div>
                      <p><strong>Data Protection Officer:</strong></p>
                      <p>Email: dpo@helloaca.xyz</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p><strong>General Support:</strong></p>
                      <p>Email: support@helloaca.xyz</p>
                    </div>
                    <div>
                      <p><strong>Website:</strong></p>
                      <p>https://helloaca.xyz</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mt-8">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-purple-700">
                      <strong>Compliance Notice:</strong> This Privacy Policy has been prepared to comply with 
                      GDPR, CCPA, and other applicable data protection laws. We are committed to maintaining 
                      the highest standards of data privacy and security.
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

export default PrivacyPolicy