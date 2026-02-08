import React from 'react'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'

const About: React.FC = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showAuth={true} />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-20">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">Where Simplicity Meets Legal Power</h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mt-4">Modern tools that help people understand their contracts with clear insights, guidance, and confidence.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">Supabase</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">Vercel</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">Flutterwave</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">Mixpanel</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">Google Analytics</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About us</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Founder’s Welcome</h3>
                <p className="text-gray-600">We make contracts understandable and actionable. Get fast, clear insights and practical guidance—so you can negotiate confidently and move decisions forward.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Getting to know our app better</h3>
                <p className="text-gray-600">Built for clarity and speed. Upload any agreement, instantly surface key clauses and risks, and act on practical recommendations—so your team negotiates better and moves faster.</p>
              </div>
            </div>
            {/* <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">158+</div>
                <div className="text-gray-600 text-sm">Partner firms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">25K+</div>
                <div className="text-gray-600 text-sm">Active users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">4.9/5.0</div>
                <div className="text-gray-600 text-sm">Customer score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">10.8%</div>
                <div className="text-gray-600 text-sm">Average time saved</div>
              </div>
            </div> */}
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Trusted by teams worldwide</h3>
            Be the first to drop a review about Helloaca on Trustpilot...
            {/* <div className="grid md:grid-cols-3 gap-6 items-start">
              <div className="rounded-2xl border border-gray-200 p-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-5xl font-bold text-gray-900">4.9</div>
                <div className="text-sm text-gray-600">200+ reviews</div>
              </div>
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                <blockquote className="rounded-2xl border border-gray-200 p-6">
                  <Quote className="h-5 w-5 text-gray-400 mb-3" />
                  <p className="text-gray-700">Thanks to Helloaca, reviewing contracts is finally simple. I can set priorities, track obligations, and stay on top of negotiations without getting lost in legalese.</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">Lara D.</span> Designer
                  </div>
                </blockquote>
                <blockquote className="rounded-2xl border border-gray-200 p-6">
                  <Quote className="h-5 w-5 text-gray-400 mb-3" />
                  <p className="text-gray-700">Intuitive and fast. It feels like having a legal assistant on my team. The insights help us negotiate better terms.</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">Endrick</span> Product Designer
                  </div>
                </blockquote>
              </div>
            </div> */}
            <div className="mt-8 text-center">
              <a href="https://www.trustpilot.com/review/helloaca.xyz" className="inline-flex items-center px-4 py-2 rounded-lg bg-[#4ECCA3] text-white">Review us on Trustpilot</a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default About
