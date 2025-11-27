import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserCredits } from '@/lib/utils'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { toast } from 'sonner'

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


  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully!')
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-0">
              <img src="/logo.png" alt="HelloACA" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
              <span className="font-bold text-xl sm:text-2xl text-gray-900 -ml-1 tracking-tight">
                elloaca
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
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="min-h-[44px]">
                    Try for Free
                  </Button>
                </Link>
              </>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <Avatar seed={profile?.avatar_seed || user.id} size={32} className="w-8 h-8 rounded-full" />
                  <span className="text-gray-700 font-medium">{getDisplayName()}</span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-sm text-gray-500">{user.email || ''}</p>
                      <p className="text-xs text-gray-600 mt-1">Credits: {user?.id ? getUserCredits(user.id) : 0}</p>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 min-h-[44px]"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 min-h-[44px]"
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
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu with backdrop and animations */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <div className="fixed top-14 sm:top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 md:hidden animate-in slide-in-from-top-2 duration-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="space-y-1">
                  <Link 
                    to="/" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link 
                        to="/dashboard" 
                        className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/reports" 
                        className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Reports
                      </Link>
                      <Link 
                        to="/settings" 
                        className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Settings
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/pricing" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link 
                    to="/about" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link 
                    to="/contact" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#4ECCA3] hover:bg-gray-50 rounded-lg transition-colors min-h-[44px] flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                  
                  {/* Mobile Auth Buttons */}
                  {showAuth && !isAuthenticated && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full min-h-[48px] text-base">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full min-h-[48px] text-base">
                          Try for Free
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Mobile User Info */}
                  {isAuthenticated && user && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <Avatar seed={profile?.avatar_seed || user.id} size={40} className="w-10 h-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{getDisplayName()}</p>
                          <p className="text-sm text-gray-500 truncate">{user.email || ''}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full min-h-[48px] text-base"
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
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export default Header