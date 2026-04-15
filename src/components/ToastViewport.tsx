import { X } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-3xl border border-white/70 bg-slate-950 px-5 py-4 text-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm text-slate-300">{toast.description}</p>
              ) : null}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded-full bg-white/10 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
