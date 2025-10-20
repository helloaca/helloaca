import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'

interface HeaderProps {
  showAuth?: boolean
}

const Header: React.FC<HeaderProps> = ({ showAuth = true }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  // Get the display name - prefer profile data, then user.name, then fallback
  const getDisplayName = () => {
    // Priority 1: Profile data (most reliable)
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    
    // Priority 2: User metadata
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.firstName) {
      return user.firstName
    }
    if (user?.name) {
      return user.name
    }
    
    // Priority 3: Email fallback with better formatting
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      // Capitalize first letter and handle common patterns
      return emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._-]/g, ' ')
    }
    
    return 'User'
  }

  // Get initials for avatar
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    }
    if (user?.name && typeof user.name === 'string') {
      return user.name.charAt(0).toUpperCase()
    }
    return 'U'
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#4ECCA3] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">
                HelloACA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-[#4ECCA3] transition-colors">
                  Dashboard
                </Link>
                <Link to="/reports" className="text-gray-700 hover:text-[#4ECCA3] transition-colors">
                  Reports
                </Link>
              </>
            )}
            <Link to="/pricing" className="text-gray-700 hover:text-[#4ECCA3] transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-[#4ECCA3] transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-[#4ECCA3] transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop Auth/User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {showAuth && !isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Try for Free
                  </Button>
                </Link>
              </>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#4ECCA3] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getInitials()}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{getDisplayName()}</span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-sm text-gray-500">{user.email || ''}</p>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleSignOut()
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <nav className="space-y-4">
              <Link 
                to="/" 
                className="block text-gray-700 hover:text-[#4ECCA3] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block text-gray-700 hover:text-[#4ECCA3] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/reports" 
                    className="block text-gray-700 hover:text-[#4ECCA3] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Reports
                  </Link>
                  <Link 
                    to="/settings" 
                    className="block text-gray-700 hover:text-[#4ECCA3] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </>
              )}
              <a 
                href="#pricing" 
                className="block text-gray-700 hover:text-[#4ECCA3] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              
              {/* Mobile Auth Buttons */}
              {showAuth && !isAuthenticated && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">
                      Try for Free
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile User Info */}
              {isAuthenticated && user && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-[#4ECCA3] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {getInitials()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-sm text-gray-500">{user.email || ''}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleSignOut()
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header