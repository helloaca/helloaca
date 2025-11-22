import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [requireMfa, setRequireMfa] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn(email, password)

      if (result.success) {
        setIsLoading(false)
        try {
          const mfaTimeout = new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), 5000))
          const factorsResult = await Promise.race([
            (supabase as any).auth.mfa.listFactors(),
            mfaTimeout
          ])
          if ('timedOut' in factorsResult) {
            setErrors({ general: 'Signed in, but network is slow. Please try again.' })
            return
          }
          const totp = factorsResult?.data?.find((f: any) => f.factorType === 'totp')
          if (totp) {
            setFactorId(totp.id)
            setRequireMfa(true)
          } else {
            navigate('/dashboard')
          }
        } catch {
          navigate('/dashboard')
        }
      } else {
        setErrors({ general: result.error || 'Login failed' })
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const result = await signInWithGoogle()
      
      if (!result.success) {
        setErrors({ general: result.error || 'Google sign-in failed' })
      }
      // Note: On success, the user will be redirected to dashboard by OAuth flow
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred during Google sign-in' })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyMfa = async () => {
    try {
      if (!factorId || !totpCode) {
        setMfaError('Enter the code from your app')
        return
      }
      setIsVerifying(true)
      const { error: cErr } = await (supabase as any).auth.mfa.challenge({ factorId })
      if (cErr) {
        setMfaError('Challenge failed')
        setIsVerifying(false)
        return
      }
      const { error: vErr } = await (supabase as any).auth.mfa.verify({ factorId, code: totpCode })
      if (vErr) {
        setMfaError('Invalid code')
        setIsVerifying(false)
        return
      }
      setRequireMfa(false)
      setTotpCode('')
      setFactorId(null)
      setIsVerifying(false)
      navigate('/dashboard')
    } catch (e) {
      setMfaError('Verification failed')
      setIsVerifying(false)
    }
  }

  const handleMicrosoftLogin = () => {
    // TODO: Implement Microsoft OAuth with Supabase
    console.log('Microsoft login clicked - To be implemented')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#4ECCA3] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">HelloACA</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Sign in to your HelloACA account</p>
        </div>

        <Card className="p-8">
          {/* General Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#4ECCA3] focus:ring-[#4ECCA3] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-[#4ECCA3] hover:text-[#3DBB90]">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {requireMfa && (
            <div className="mt-6 p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Two‑Factor Authentication Required</h3>
              <p className="text-sm text-gray-600 mb-4">Open your authenticator app and enter the 6‑digit code.</p>
              <div className="flex items-center gap-3">
                <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg" />
                <Button onClick={verifyMfa} disabled={isVerifying}>{isVerifying ? 'Verifying…' : 'Verify'}</Button>
              </div>
              {mfaError && <p className="mt-2 text-sm text-red-600">{mfaError}</p>}
            </div>
          )}

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-[#4ECCA3] hover:text-[#3DBB90]">
                Sign up for free
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-[#4ECCA3] hover:text-[#3DBB90]">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#4ECCA3] hover:text-[#3DBB90]">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login