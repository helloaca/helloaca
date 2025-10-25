import React, { useState, useEffect } from 'react'
import { 
  User, 
  Bell, 
  CreditCard, 
  Users, 
  Shield, 
  Download,
  Trash2,
  Edit3,
  Plus,
  Crown,
  Check,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

const Settings: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'team' | 'notifications' | 'security'>('profile')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    timezone: 'EST',
    language: 'English'
  })
  const [notifications, setNotifications] = useState({
    emailReports: true,
    analysisComplete: true,
    weeklyDigest: false,
    securityAlerts: true,
    teamUpdates: true
  })

  // Load user data on component mount
  useEffect(() => {
    if (user || profile) {
      setProfileData({
        firstName: profile?.first_name || user?.firstName || '',
        lastName: profile?.last_name || user?.lastName || '',
        email: user?.email || '',
        company: profile?.company || user?.company || '',
        role: profile?.role || user?.role || '',
        timezone: profile?.timezone || user?.timezone || 'EST',
        language: 'English'
      })
    }
  }, [user, profile])

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield }
  ]

  const teamMembers = [
    { 
      id: 1, 
      name: (user?.firstName && user?.lastName) ? `${String(user.firstName)} ${String(user.lastName)}` : user?.name || 'User', 
      email: user?.email || '', 
      role: 'Owner', 
      avatar: (() => {
        const firstName = user?.firstName ? String(user.firstName) : '';
        const lastName = user?.lastName ? String(user.lastName) : '';
        const name = user?.name ? String(user.name) : '';
        
        const firstInitial = firstName?.[0] || name?.[0] || 'U';
        const lastInitial = lastName?.[0] || '';
        
        return `${firstInitial}${lastInitial}`;
      })(), 
      status: 'active' 
    }
  ]

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (setting: string) => {
    setNotifications(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }))
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const result = await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        company: profileData.company,
        role: profileData.role,
        timezone: profileData.timezone
      })
      
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              type="text"
              value={profileData.company}
              onChange={(e) => handleProfileUpdate('company', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={profileData.role}
              onChange={(e) => handleProfileUpdate('role', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={profileData.timezone}
              onChange={(e) => handleProfileUpdate('timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECCA3] focus:border-transparent"
            >
              {/* UTC-12 to UTC-11 */}
              <option value="BIT">Baker Island Time (UTC-12)</option>
              <option value="NUT">Niue Time (UTC-11)</option>
              
              {/* UTC-10 to UTC-9 */}
              <option value="HST">Hawaii-Aleutian Standard Time (UTC-10)</option>
              <option value="AKST">Alaska Standard Time (UTC-9)</option>
              
              {/* UTC-8 to UTC-7 */}
              <option value="PST">Pacific Standard Time - PST (UTC-8)</option>
              <option value="MST">Mountain Standard Time - MST (UTC-7)</option>
              
              {/* UTC-6 to UTC-5 */}
              <option value="CST">Central Standard Time - CST (UTC-6)</option>
              <option value="EST">Eastern Standard Time - EST (UTC-5)</option>
              
              {/* UTC-4 to UTC-3 */}
              <option value="AST">Atlantic Standard Time (UTC-4)</option>
              <option value="NST">Newfoundland Standard Time (UTC-3:30)</option>
              <option value="ART">Argentina Time (UTC-3)</option>
              
              {/* UTC-2 to UTC-1 */}
              <option value="GST">South Georgia Time (UTC-2)</option>
              <option value="AZOT">Azores Time (UTC-1)</option>
              
              {/* UTC+0 */}
              <option value="GMT">Greenwich Mean Time - GMT (UTC+0)</option>
              <option value="WET">Western European Time - WET (UTC+0)</option>
              
              {/* UTC+1 to UTC+2 */}
              <option value="CET">Central European Time - CET (UTC+1)</option>
              <option value="WAT">West Africa Time (UTC+1)</option>
              <option value="EET">Eastern European Time - EET (UTC+2)</option>
              <option value="CAT">Central Africa Time (UTC+2)</option>
              
              {/* UTC+3 to UTC+4 */}
              <option value="MSK">Moscow Standard Time (UTC+3)</option>
              <option value="EAT">East Africa Time (UTC+3)</option>
              <option value="IRST">Iran Standard Time (UTC+3:30)</option>
              <option value="GST_GULF">Gulf Standard Time (UTC+4)</option>
              <option value="AFT">Afghanistan Time (UTC+4:30)</option>
              
              {/* UTC+5 to UTC+6 */}
              <option value="PKT">Pakistan Standard Time (UTC+5)</option>
              <option value="IST">India Standard Time - IST (UTC+5:30)</option>
              <option value="NPT">Nepal Time (UTC+5:45)</option>
              <option value="BST">Bangladesh Standard Time (UTC+6)</option>
              
              {/* UTC+7 to UTC+8 */}
              <option value="ICT">Indochina Time (UTC+7)</option>
              <option value="CST_CHINA">China Standard Time - CST (UTC+8)</option>
              <option value="SGT">Singapore Standard Time (UTC+8)</option>
              <option value="PST_PHIL">Philippine Standard Time (UTC+8)</option>
              
              {/* UTC+9 to UTC+10 */}
              <option value="JST">Japan Standard Time - JST (UTC+9)</option>
              <option value="KST">Korea Standard Time (UTC+9)</option>
              <option value="ACST">Australian Central Standard Time (UTC+9:30)</option>
              <option value="AEST">Australian Eastern Standard Time (UTC+10)</option>
              <option value="VLAT">Vladivostok Time (UTC+10)</option>
              
              {/* UTC+11 to UTC+12 */}
              <option value="SBT">Solomon Islands Time (UTC+11)</option>
              <option value="NZST">New Zealand Standard Time (UTC+12)</option>
              <option value="FJT">Fiji Time (UTC+12)</option>
              
              {/* UTC+13 to UTC+14 */}
              <option value="TOT">Tonga Time (UTC+13)</option>
              <option value="LINT">Line Islands Time (UTC+14)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
        <Button onClick={handleSaveProfile} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
        <Card className="p-6 border-2 border-[#4ECCA3]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Crown className="w-6 h-6 text-[#4ECCA3] mr-3" />
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{String(user?.plan) === 'pro' ? 'Pro Plan' : String(user?.plan) === 'business' ? 'Business Plan' : 'Free Plan'}</h4>
                <p className="text-gray-600">
                  {String(user?.plan) === 'pro' ? '$49/month • Billed monthly' : 
                   String(user?.plan) === 'business' ? '$299/month • Billed monthly' : 
                   'Free forever'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-semibold text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">0</p>
              <p className="text-sm text-gray-600">Contracts this month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">
                {String(user?.plan) === 'free' ? '1' : String(user?.plan) === 'pro' ? '10' : '∞'}
              </p>
              <p className="text-sm text-gray-600">Monthly limit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">0</p>
              <p className="text-sm text-gray-600">Reports generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#4ECCA3]">
                {String(user?.plan) === 'free' ? '0' : '∞'}
              </p>
              <p className="text-sm text-gray-600">AI chat messages</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button variant="outline">Change Plan</Button>
            <Button variant="outline">View Billing History</Button>
            {user?.plan !== 'free' && (
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                Cancel Subscription
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              features: ['1 contract/month', 'Basic analysis', 'Email support'],
              current: user?.plan === 'free'
            },
            {
              name: 'Pro',
              price: '$49',
              period: 'per month',
              features: ['10 contracts/month', 'AI chat', 'PDF reports', 'Priority support'],
              current: user?.plan === 'pro'
            },
            {
              name: 'Business',
              price: '$299',
              period: 'per month',
              features: ['Unlimited contracts', 'Team collaboration', 'White-label reports', 'Dedicated support'],
              current: user?.plan === 'business'
            }
          ].map((plan) => (
            <Card key={plan.name} className={`p-6 ${plan.current ? 'ring-2 ring-[#4ECCA3]' : ''}`}>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center justify-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#4ECCA3] mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.current ? "outline" : "primary"}
                  className="w-full"
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#4ECCA3] rounded-full flex items-center justify-center text-white font-semibold mr-4">
                        {String(member.avatar)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.role === 'Owner' 
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'Admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-[#4ECCA3] hover:text-[#3DBB90]">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {member.role !== 'Owner' && (
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Permissions</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Contract Upload</p>
              <p className="text-sm text-gray-500">Allow team members to upload contracts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Report Generation</p>
              <p className="text-sm text-gray-500">Allow team members to generate reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Team Management</p>
              <p className="text-sm text-gray-500">Allow admins to manage team members</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <Card className="p-6">
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {key === 'emailReports' && 'Email Reports'}
                    {key === 'analysisComplete' && 'Analysis Complete'}
                    {key === 'weeklyDigest' && 'Weekly Digest'}
                    {key === 'securityAlerts' && 'Security Alerts'}
                    {key === 'teamUpdates' && 'Team Updates'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {key === 'emailReports' && 'Receive reports via email when analysis is complete'}
                    {key === 'analysisComplete' && 'Get notified when contract analysis finishes'}
                    {key === 'weeklyDigest' && 'Weekly summary of your contract analysis activity'}
                    {key === 'securityAlerts' && 'Important security and account notifications'}
                    {key === 'teamUpdates' && 'Updates about team member activity and changes'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={value}
                    onChange={() => handleNotificationToggle(key)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4ECCA3]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ECCA3]"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password &amp; Authentication</h3>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Manage your account password</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-500">Sign out of your account on this device</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data &amp; Privacy</h3>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download all your contracts and analysis data</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and team settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#4ECCA3] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'subscription' && renderSubscriptionTab()}
              {activeTab === 'team' && renderTeamTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings