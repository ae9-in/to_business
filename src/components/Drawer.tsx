import type { ReactNode } from 'react'

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <button
          onClick={onClose}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
        >
          Close
        </button>
      </div>
      <div className="h-[calc(100%-73px)] overflow-y-auto px-5 py-5">{children}</div>
    </div>
  )
}
