import { Modal } from './Modal'

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
}) {
  if (!open) {
    return null
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-3 py-2 text-white"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-slate-700">{message}</p>
    </Modal>
  )
}
