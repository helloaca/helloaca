import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-red-700 text-sm">
                An unexpected error occurred while displaying this content. This might be due to:
              </p>
              <ul className="text-red-600 text-sm list-disc list-inside space-y-1">
                <li>Incomplete or malformed analysis data</li>
                <li>Network connectivity issues</li>
                <li>Temporary system error</li>
              </ul>
              <div className="flex space-x-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Refresh Page
                </Button>
              </div>
              {this.state.error && (
                <details className="mt-4">
                  <summary className="text-red-600 text-xs cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="text-red-500 text-xs mt-2 p-2 bg-red-100 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}