import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #E2E8F0',
        },
        className: 'font-sans',
      }}
    />
  )
}

type ToastOptions = {
  duration?: number
  id?: string
  onDismiss?: () => void
  onAutoClose?: () => void
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, options)
  },
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, options)
  },
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, options)
  },
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, options)
  },
  loading: (message: string, options?: ToastOptions) => {
    sonnerToast.loading(message, options)
  },
  dismiss: (toastId?: string) => {
    sonnerToast.dismiss(toastId)
  },
}