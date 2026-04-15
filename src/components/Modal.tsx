import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
          >
            Close
          </button>
        </div>
        <div className="mt-4 max-h-[calc(90vh-88px)] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  )
}
