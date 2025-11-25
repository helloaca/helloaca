import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Mail, Phone, MapPin, Send, ArrowLeft, Loader2, AlertCircle, CheckCircle, Linkedin, Twitter } from 'lucide-react'
import { toast } from 'sonner'
import { 
  submitContactForm, 
  validateContactForm, 
  ContactFormData, 
  VALIDATION_RULES 
} from '../services/contactService'

interface FormState extends ContactFormData {
  honeypot: string
}

const Contact: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '' // Bot protection field
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isMessageSent, setIsMessageSent] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Real-time validation
  useEffect(() => {
    if (submitAttempted || Object.keys(touched).length > 0) {
      const validationErrors = validateContactForm(formData)
      const errorMap: Record<string, string> = {}
      
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message
      })
      
      setErrors(errorMap)
    }
  }, [formData, submitAttempted, touched])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    setIsSubmitting(true)

    try {
      const result = await submitContactForm(formData)
      
      if (result.success) {
        setIsMessageSent(true)
        // Trigger animation after a small delay to ensure DOM update
        setTimeout(() => setShowAnimation(true), 50)
        setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' })
        setErrors({})
        setTouched({})
        setSubmitAttempted(false)
      } else {
        if (result.errors) {
          const errorMap: Record<string, string> = {}
          result.errors.forEach(error => {
            errorMap[error.field] = error.message
          })
          setErrors(errorMap)
        }
        toast.error(result.message || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('An unexpected error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return (touched[field] || submitAttempted) ? errors[field] : undefined
  }

  const isFieldValid = (field: string): boolean => {
    return (touched[field] || submitAttempted) && !errors[field] && formData[field as keyof FormState].trim() !== ''
  }

  const handleSendAnotherMessage = () => {
    setIsMessageSent(false)
    setShowAnimation(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showAuth={true} />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about HelloACA? We're here to help. Reach out to our team 
              and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              {!isMessageSent ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Honeypot field for bot protection */}
                    <input
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={handleInputChange}
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('name')}
                            disabled={isSubmitting}
                            required
                            minLength={VALIDATION_RULES.name.minLength}
                            maxLength={VALIDATION_RULES.name.maxLength}
                            className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              getFieldError('name') 
                                ? 'border-red-300 bg-red-50' 
                                : isFieldValid('name')
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300'
                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="Your full name"
                            aria-describedby={getFieldError('name') ? 'name-error' : undefined}
                            aria-invalid={!!getFieldError('name')}
                          />
                          {isFieldValid('name') && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                          {getFieldError('name') && (
                            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                          )}
                        </div>
                        {getFieldError('name') && (
                          <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {getFieldError('name')}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('email')}
                            disabled={isSubmitting}
                            required
                            className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              getFieldError('email') 
                                ? 'border-red-300 bg-red-50' 
                                : isFieldValid('email')
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300'
                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="your@email.com"
                            aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                            aria-invalid={!!getFieldError('email')}
                          />
                          {isFieldValid('email') && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                          {getFieldError('email') && (
                            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                          )}
                        </div>
                        {getFieldError('email') && (
                          <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {getFieldError('email')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('subject')}
                          disabled={isSubmitting}
                          required
                          maxLength={VALIDATION_RULES.subject.maxLength}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            getFieldError('subject') 
                              ? 'border-red-300 bg-red-50' 
                              : isFieldValid('subject')
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="What's this about?"
                          aria-describedby={getFieldError('subject') ? 'subject-error' : undefined}
                          aria-invalid={!!getFieldError('subject')}
                        />
                        {isFieldValid('subject') && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                        )}
                        {getFieldError('subject') && (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                        )}
                      </div>
                      {getFieldError('subject') && (
                        <p id="subject-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {getFieldError('subject')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('message')}
                          disabled={isSubmitting}
                          required
                          rows={6}
                          minLength={VALIDATION_RULES.message.minLength}
                          maxLength={VALIDATION_RULES.message.maxLength}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                            getFieldError('message') 
                              ? 'border-red-300 bg-red-50' 
                              : isFieldValid('message')
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="Tell us more about your inquiry... (minimum 10 characters)"
                          aria-describedby={getFieldError('message') ? 'message-error' : 'message-help'}
                          aria-invalid={!!getFieldError('message')}
                        />
                        {isFieldValid('message') && (
                          <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                        )}
                        {getFieldError('message') && (
                          <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="mt-1 flex justify-between items-start">
                        <div>
                          {getFieldError('message') ? (
                            <p id="message-error" className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {getFieldError('message')}
                            </p>
                          ) : (
                            <p id="message-help" className="text-sm text-gray-500">
                              Minimum {VALIDATION_RULES.message.minLength} characters required
                            </p>
                          )}
                        </div>
                        <span className={`text-sm ${
                          formData.message.length > VALIDATION_RULES.message.maxLength 
                            ? 'text-red-500' 
                            : formData.message.length < VALIDATION_RULES.message.minLength
                            ? 'text-gray-400'
                            : 'text-green-600'
                        }`}>
                          {formData.message.length}/{VALIDATION_RULES.message.maxLength}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || Object.keys(errors).length > 0}
                      className={`w-full py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                        isSubmitting || Object.keys(errors).length > 0
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      }`}
                      aria-describedby="submit-help"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </button>
                    
                    {isSubmitting && (
                      <p id="submit-help" className="text-sm text-gray-600 text-center">
                        Please wait while we process your message...
                      </p>
                    )}
                  </form>
                </>
              ) : (
                <div 
                  className={`text-center py-8 transition-all duration-700 ease-out transform ${
                    showAnimation 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="mb-6">
                    <CheckCircle 
                      className={`h-16 w-16 text-green-500 mx-auto mb-4 transition-all duration-500 delay-200 ${
                        showAnimation ? 'scale-100' : 'scale-75'
                      }`} 
                    />
                    <h2 
                      className={`text-2xl font-bold text-gray-900 mb-2 transition-all duration-500 delay-300 ${
                        showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      Message Sent Successfully!
                    </h2>
                    <p 
                      className={`text-gray-600 transition-all duration-500 delay-400 ${
                        showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      Thank you for reaching out to us. We've received your message and will get back to you as soon as possible.
                    </p>
                  </div>
                  <button
                    onClick={handleSendAnotherMessage}
                    className={`bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-500 delay-500 font-medium ${
                      showAnimation 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 translate-y-2 scale-95'
                    }`}
                  >
                    Send Another Message
                  </button>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <p className="text-gray-600">
                        <a href="mailto:support@helloaca.xyz" className="hover:text-primary">support@helloaca.xyz</a>
                      </p>
                      <p className="text-gray-600">
                        <a href="mailto:sales@helloaca.xyz" className="hover:text-primary">sales@helloaca.xyz</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <p className="text-gray-600">+1 (810) 432-0377</p>
                      <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM WAT</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 rounded-full p-3">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Office</h3>
                      <p className="text-gray-600">
                        No Physical Location Yet<br />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect</h2>
                <div className="flex items-center gap-3">
                  <a
                    href="https://linkedin.com/company/helloaca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="https://x.com/helloacaxyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-primary transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="mailto:support@helloaca.xyz"
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-primary transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Help</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Need technical support?</h3>
                    <p className="text-gray-600 text-sm">
                      Check our documentation or email support@helloaca.xyz for technical issues.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Interested in enterprise plans?</h3>
                    <p className="text-gray-600 text-sm">
                      Contact our sales team at sales@helloaca.xyz for custom pricing and features.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Media inquiries?</h3>
                    <p className="text-gray-600 text-sm">
                      Reach out to press@helloaca.xyz for media-related questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Contact