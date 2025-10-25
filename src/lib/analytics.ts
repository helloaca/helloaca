import ReactGA from 'react-ga4'

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-0JVYR712V0'

// Initialize Google Analytics
export const initGA = () => {
  ReactGA.initialize(GA_MEASUREMENT_ID, {
    testMode: process.env.NODE_ENV === 'development',
    gtagOptions: {
      debug_mode: process.env.NODE_ENV === 'development'
    }
  })
}

// Track page views
export const trackPageView = (path: string, title?: string) => {
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title
  })
}

// Track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  ReactGA.event({
    action,
    category,
    label,
    value
  })
}

// Track user authentication events
export const trackAuth = {
  signUp: (method: string = 'email') => {
    trackEvent('sign_up', 'auth', method)
  },
  signIn: (method: string = 'email') => {
    trackEvent('login', 'auth', method)
  },
  signOut: () => {
    trackEvent('logout', 'auth')
  }
}

// Track contract-related events
export const trackContracts = {
  upload: (fileName: string, fileSize: number) => {
    trackEvent('contract_upload', 'contract', fileName, fileSize)
  },
  view: (contractId: string) => {
    trackEvent('contract_view', 'contract', contractId)
  },
  analyze: (contractId: string) => {
    trackEvent('contract_analyze', 'contract', contractId)
  },
  download: (contractId: string, format: string) => {
    trackEvent('contract_download', 'contract', `${contractId}_${format}`)
  },
  chat: (contractId: string) => {
    trackEvent('contract_chat', 'contract', contractId)
  }
}

// Track pricing and subscription events
export const trackPricing = {
  viewPlans: () => {
    trackEvent('view_pricing', 'pricing')
  },
  selectPlan: (planName: string) => {
    trackEvent('select_plan', 'pricing', planName)
  },
  startTrial: (planName: string) => {
    trackEvent('start_trial', 'pricing', planName)
  }
}

// Track form interactions
export const trackForms = {
  submit: (formName: string, additionalData?: string) => {
    trackEvent('form_submit', 'form', `${formName}${additionalData ? `_${additionalData}` : ''}`)
  },
  error: (formName: string, errorType: string) => {
    trackEvent('form_error', 'form', `${formName}_${errorType}`)
  }
}

// Track navigation events
export const trackNavigation = {
  menuClick: (menuItem: string) => {
    trackEvent('menu_click', 'navigation', menuItem)
  },
  buttonClick: (buttonName: string, location: string) => {
    trackEvent('button_click', 'interaction', `${buttonName}_${location}`)
  }
}

// Track user engagement
export const trackEngagement = {
  timeOnPage: (pageName: string, timeInSeconds: number) => {
    trackEvent('time_on_page', 'engagement', pageName, timeInSeconds)
  },
  scrollDepth: (percentage: number) => {
    trackEvent('scroll_depth', 'engagement', `${percentage}%`, percentage)
  }
}

// Track errors
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'system', `${errorLocation}: ${errorMessage}`)
}

// Set user properties (for authenticated users)
export const setUserProperties = (properties: Record<string, any>) => {
  ReactGA.set(properties)
}

// Track custom dimensions
export const setCustomDimensions = (dimensions: Record<string, string>) => {
  ReactGA.set(dimensions)
}