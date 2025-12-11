import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-500',
      secondary: 'bg-white border border-primary text-black hover:bg-primary hover:text-white',
      outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
      destructive: 'bg-red-600 text-white hover:bg-red-700'
    }
    
    const sizes = {
      sm: 'h-9 px-4 py-2 text-sm rounded-button',
      md: 'h-11 px-6 py-3 text-base rounded-button',
      lg: 'h-12 px-8 py-4 text-lg rounded-button'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
