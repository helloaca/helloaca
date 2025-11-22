import React, { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState('')

  const { resetPassword } = useAuth()

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await resetPassword(email)
      
      if (result.success) {
        setIsEmailSent(true)
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await resetPassword(email)
      
      if (!result.success) {
        setError(result.error || 'Failed to resend email')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-0">
              <img src="/logo.png" alt="HelloACA" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-2xl font-bold text-gray-900 -ml-1 tracking-tight">elloaca</span>
            </div>
          </div>

          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h2>
            
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-900">{email}</span>
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4ECCA3] mr-2"></div>
                    Resending...
                  </div>
                ) : (
                  'Resend email'
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-[#4ECCA3] hover:text-[#3DBB90]"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to sign in
                </Link>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive the email?</strong> Check your spam folder or try resending the email.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-0">
            <img src="/logo.png" alt="HelloACA" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-2xl font-bold text-gray-900 -ml-1 tracking-tight">elloACA</span>
          </div>
        </div>

        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
            <p className="text-gray-600">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending reset link...
                </div>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-[#4ECCA3] hover:text-[#3DBB90]"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </Link>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Having trouble?</h3>
            <p className="text-sm text-gray-600">
              If you're still having issues, please contact our support team at{' '}
              <a href="mailto:support@helloaca.xyz" className="text-[#4ECCA3] hover:text-[#3DBB90]">
                    support@helloaca.xyz
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword