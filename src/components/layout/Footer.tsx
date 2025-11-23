import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2 mb-6 md:mb-0">
            <div className="flex items-center space-x-0 mb-4">
              <img src="/logo.png" alt="HelloACA" className="h-8 w-8 object-contain" />
              <span className="font-space-grotesk font-bold text-2xl -ml-1">ello</span>
              <span className="font-space-grotesk font-bold text-2xl text-primary">aca</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md text-sm sm:text-base">
              AI-powered contract analysis that helps small law firms, real estate agents, 
              and business owners detect contract risks and obligations within 30 seconds.
            </p>
          </div>

          {/* Mobile: Side by side menus, Desktop: Individual columns */}
          <div className="col-span-1 grid grid-cols-2 gap-6 md:gap-0 md:grid-cols-1 md:col-span-1">
            {/* Quick Links */}
            <div>
              <h3 className="font-space-grotesk font-semibold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/reports" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Reports
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="md:hidden">
              <h3 className="font-space-grotesk font-semibold text-base sm:text-lg mb-3 sm:mb-4">Support</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-primary transition-colors text-sm sm:text-base">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Support - Desktop only (separate column) */}
          <div className="hidden md:block">
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

        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-gray-400 text-sm sm:text-base">
            © 2025 HelloACA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
export default Footer