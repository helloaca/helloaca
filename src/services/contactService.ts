/**
 * Contact Service
 * Handles contact form submissions with validation, rate limiting, and database storage
 */

import { supabase } from '../lib/supabase'

// Types
export interface ContactSubmission {
  id?: string
  name: string
  email: string
  subject: string
  message: string
  ip_address?: string
  user_agent?: string
  status?: 'new' | 'read' | 'responded'
  created_at?: string
  updated_at?: string
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  honeypot?: string // Hidden field for bot protection
}

export interface ValidationError {
  field: string
  message: string
}

export interface ContactSubmissionResult {
  success: boolean
  data?: ContactSubmission
  errors?: ValidationError[]
  message?: string
}

// Validation rules
const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  email: {
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  },
  subject: {
    minLength: 1,
    maxLength: 200
  },
  message: {
    minLength: 10,
    maxLength: 2000
  }
}

/**
 * Validates contact form data
 */
export function validateContactForm(data: ContactFormData): ValidationError[] {
  const errors: ValidationError[] = []

  // Check honeypot field (should be empty)
  if (data.honeypot && data.honeypot.trim() !== '') {
    errors.push({ field: 'honeypot', message: 'Bot detected' })
    return errors
  }

  // Validate name
  if (!data.name || data.name.trim().length < VALIDATION_RULES.name.minLength) {
    errors.push({ field: 'name', message: `Name must be at least ${VALIDATION_RULES.name.minLength} characters long` })
  } else if (data.name.length > VALIDATION_RULES.name.maxLength) {
    errors.push({ field: 'name', message: `Name must be less than ${VALIDATION_RULES.name.maxLength} characters` })
  } else if (!VALIDATION_RULES.name.pattern.test(data.name)) {
    errors.push({ field: 'name', message: 'Name can only contain letters, spaces, hyphens, and apostrophes' })
  }

  // Validate email
  if (!data.email || !VALIDATION_RULES.email.pattern.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  // Validate subject
  if (!data.subject || data.subject.trim().length < VALIDATION_RULES.subject.minLength) {
    errors.push({ field: 'subject', message: 'Subject is required' })
  } else if (data.subject.length > VALIDATION_RULES.subject.maxLength) {
    errors.push({ field: 'subject', message: `Subject must be less than ${VALIDATION_RULES.subject.maxLength} characters` })
  }

  // Validate message
  if (!data.message || data.message.trim().length < VALIDATION_RULES.message.minLength) {
    errors.push({ field: 'message', message: `Message must be at least ${VALIDATION_RULES.message.minLength} characters long` })
  } else if (data.message.length > VALIDATION_RULES.message.maxLength) {
    errors.push({ field: 'message', message: `Message must be less than ${VALIDATION_RULES.message.maxLength} characters` })
  }

  return errors
}

/**
 * Sanitizes input text to prevent XSS and other attacks
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Gets client IP address (simplified for demo)
 */
function getClientIP(): string {
  // In a real application, you would get this from the request headers
  // For now, we'll use a placeholder
  return 'unknown'
}

/**
 * Gets user agent string
 */
function getUserAgent(): string {
  return navigator.userAgent || 'unknown'
}

/**
 * Checks if the client has exceeded the rate limit
 */
export async function checkRateLimit(ipAddress?: string): Promise<boolean> {
  try {
    const ip = ipAddress || getClientIP()
    
    // Call the database function to check rate limit
    const { data, error } = await supabase.rpc('check_contact_rate_limit', {
      client_ip: ip
    })

    if (error) {
      console.error('Rate limit check error:', error)
      
      // If the function doesn't exist, implement client-side fallback
      if (error.code === 'PGRST202') {
        console.warn('Rate limit function not found, using fallback check')
        return await fallbackRateLimit(ip)
      }
      
      // For other errors, allow the submission but log the error
      return true
    }

    return data === true
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // If rate limit check fails, allow the submission
    return true
  }
}

/**
 * Fallback rate limit check using direct database query
 */
async function fallbackRateLimit(ipAddress: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count, error } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo)

    if (error) {
      console.error('Fallback rate limit check error:', error)
      return true // Allow submission if we can't check
    }

    // Allow if less than 3 submissions in the last hour
    return (count || 0) < 3
  } catch (error) {
    console.error('Fallback rate limit check failed:', error)
    return true // Allow submission if check fails
  }
}

/**
 * Submits contact form data to the database
 */
export async function submitContactForm(formData: ContactFormData): Promise<ContactSubmissionResult> {
  try {
    // Validate form data
    const validationErrors = validateContactForm(formData)
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors,
        message: 'Please fix the validation errors and try again.'
      }
    }

    // Check rate limit
    const withinRateLimit = await checkRateLimit()
    if (!withinRateLimit) {
      return {
        success: false,
        message: 'Too many submissions. Please wait before submitting again.'
      }
    }

    // Sanitize input data
    const sanitizedData: ContactSubmission = {
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email.toLowerCase()),
      subject: sanitizeInput(formData.subject),
      message: sanitizeInput(formData.message),
      ip_address: getClientIP(),
      user_agent: getUserAgent()
    }

    // Submit to database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([sanitizedData])
      .select()
      .single()

    if (error) {
      console.error('Database submission error:', error)
      return {
        success: false,
        message: 'Failed to submit your message. Please try again later.'
      }
    }

    return {
      success: true,
      data,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
    }

  } catch (error) {
    console.error('Contact form submission error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    }
  }
}

/**
 * Gets all contact submissions (admin only)
 */
export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch contact submissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    return []
  }
}

/**
 * Updates contact submission status (admin only)
 */
export async function updateContactSubmissionStatus(
  id: string, 
  status: 'new' | 'read' | 'responded'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Failed to update contact submission status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating contact submission status:', error)
    return false
  }
}

// Export validation rules for use in components
export { VALIDATION_RULES }