import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'sonner'
import { initGA, trackPageView } from './lib/analytics'
import LandingPage from './pages/LandingPage'
import Docs from './pages/Docs'
import Dashboard from './pages/Dashboard'
import ContractAnalysis from './pages/ContractAnalysis'
import ChatInterface from './pages/ChatInterface'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import About from './pages/About'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Contact from './pages/Contact'
import Pricing from './pages/Pricing'

// Component to handle page tracking
function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    // Initialize Google Analytics on first load
    initGA()
  }, [])

  useEffect(() => {
    // Track page views on route changes
    trackPageView(location.pathname + location.search)

    const url = new URL(window.location.href)
    const canonicalHref = `${url.origin}${url.pathname}`.replace(/\/$/, url.pathname === '/' ? '/' : '')

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!linkCanonical) {
      linkCanonical = document.createElement('link')
      linkCanonical.setAttribute('rel', 'canonical')
      document.head.appendChild(linkCanonical)
    }
    linkCanonical.setAttribute('href', canonicalHref)

    const publicPaths = new Set<string>(['/', '/pricing', '/about', '/contact', '/privacy', '/terms', '/login', '/register', '/forgot-password', '/docs'])
    const robotsValue = publicPaths.has(url.pathname) ? 'index, follow' : 'noindex, nofollow'
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.setAttribute('content', robotsValue)

    const titles: Record<string, string> = {
      '/': 'Helloaca | AI-Powered Contract Analyzer',
      '/pricing': 'Pricing | Helloaca',
      '/about': 'About | Helloaca',
      '/contact': 'Contact | Helloaca',
      '/privacy': 'Privacy Policy | Helloaca',
      '/terms': 'Terms of Service | Helloaca',
      '/login': 'Login | Helloaca',
      '/register': 'Register | Helloaca',
      '/forgot-password': 'Reset Password | Helloaca',
      '/docs': 'Documentation | Helloaca'
    }
    const title = titles[url.pathname]
    if (title) document.title = title

    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null
    if (ogUrl) ogUrl.setAttribute('content', canonicalHref)
  }, [location])

  return null
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <PageTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analyze/:contractId" 
            element={
              <ProtectedRoute>
                <ContractAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:contractId" 
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App