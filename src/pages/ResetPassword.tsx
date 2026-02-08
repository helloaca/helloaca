import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [isRecovery, setIsRecovery] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const type = params.get('type')
    setIsRecovery(type === 'recovery')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirm) {
      setError('Please enter and confirm your new password')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      toast.success('Password updated successfully. Please sign in.')
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-0">
            <img src="/logo.png" alt="HelloACA" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-2xl font-bold text-gray-900 -ml-1 tracking-tight">elloaca</span>
          </div>
        </div>

        <Card className="p-8">
          {isRecovery ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
                <p className="text-gray-600">Enter a new password to complete your reset.</p>
              </div>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent border-gray-300"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent border-gray-300"
                    placeholder="Re-enter new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid recovery link</h2>
              <p className="text-gray-600 mb-6">Request a new password reset email and try again.</p>
              <Button onClick={() => navigate('/forgot-password')} className="w-full">Request new link</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword