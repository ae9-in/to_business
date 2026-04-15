import { Modal } from './Modal'

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className="rounded-2xl bg-[#1d6b57] px-4 py-2 text-sm font-semibold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
