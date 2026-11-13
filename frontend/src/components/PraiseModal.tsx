import type React from 'react'

type PraiseModalProps = {
  open: boolean
  onClose: () => void
  children?: React.ReactNode
}

export default function PraiseModal({
  open,
  onClose,
  children,
}: PraiseModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="praise-overlay" onClick={onClose}>
      <div
        className="praise-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="praise-modal-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <div className="praise-modal-content">{children}</div>
      </div>
    </div>
  )
}
