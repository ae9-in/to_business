/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface ToastMessage {
  id: string
  title: string
  description?: string
}

interface ToastContextValue {
  toasts: ToastMessage[]
  pushToast: (title: string, description?: string) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (title: string, description?: string) => {
      const id = `toast-${Math.random().toString(36).slice(2, 9)}`
      setToasts((current) => [...current, { id, title, description }])
      window.setTimeout(() => dismissToast(id), 2800)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [dismissToast, pushToast, toasts],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
