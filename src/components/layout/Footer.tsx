import React from 'react'
import { Link } from 'react-router-dom'
import { Scale } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Scale className="h-8 w-8 text-primary" />
              <span className="font-space-grotesk font-bold text-2xl">
                Hello<span className="text-primary">ACA</span>
              </span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              AI-powered contract analysis that helps small law firms, real estate agents, 
              and business owners detect contract risks and obligations within 30 seconds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-space-grotesk font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-gray-300 hover:text-primary transition-colors">
                  Reports
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-space-grotesk font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 HelloACA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
export default Footer