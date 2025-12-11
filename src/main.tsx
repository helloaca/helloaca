import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import mixpanel from 'mixpanel-browser'

mixpanel.init('a326153020e4dc72ac958b6a8f93dec5', {
  debug: import.meta.env.DEV,
  track_pageview: true,
  persistence: 'localStorage',
  autocapture: true,
  record_sessions_percent: 100
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)