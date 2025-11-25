import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Shield, Users, Target, Award, ArrowLeft, Linkedin, Twitter, Mail } from 'lucide-react'

const About: React.FC = () => {
  const navigate = useNavigate()

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
              About HelloACA
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing contract analysis with AI-powered technology, 
              making legal document review faster, more accurate, and accessible to everyone.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                To democratize legal contract analysis by providing intelligent, AI-driven tools 
                that help businesses and individuals understand, analyze, and manage their contracts 
                with confidence and precision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security First</h3>
                <p className="text-gray-600">
                  Your contracts are protected with enterprise-grade security and encryption.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User-Centric</h3>
                <p className="text-gray-600">
                  Designed with simplicity and user experience at the forefront of everything we do.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Precision</h3>
                <p className="text-gray-600">
                  Advanced AI algorithms ensure accurate analysis and reliable insights.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellence</h3>
                <p className="text-gray-600">
                  Committed to delivering the highest quality contract analysis solutions.
                </p>
              </div>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg max-w-4xl mx-auto text-gray-600">
              <p>
                HelloACA was born from a simple observation: contract analysis was too complex, 
                time-consuming, and expensive for most businesses. Our founders, with backgrounds 
                in legal technology and artificial intelligence, recognized the need for a solution 
                that could make contract review accessible to everyone.
              </p>
              <p>
                Today, we're proud to serve thousands of users worldwide, from small businesses 
                to large enterprises, helping them navigate the complexities of legal documents 
                with confidence and ease.
              </p>
            </div>
          </div>

          {/* Team Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Built by Experts</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our team combines deep expertise in artificial intelligence, legal technology, 
            and user experience design to create the most intuitive and powerful contract 
            analysis platform available.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="https://linkedin.com/company/helloaca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-700 hover:text-primary"
            >
              <Linkedin className="h-5 w-5" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://x.com/helloacaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-700 hover:text-primary"
            >
              <Twitter className="h-5 w-5" />
              <span>X</span>
            </a>
            <a
              href="mailto:support@helloaca.xyz"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-700 hover:text-primary"
            >
              <Mail className="h-5 w-5" />
              <span>support@helloaca.xyz</span>
            </a>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default About