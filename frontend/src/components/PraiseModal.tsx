import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

type PraiseModalProps = {
  open: boolean
  onClose: () => void
  children?: ReactNode
}

export default function PraiseModal({
  open,
  onClose,
  children,
}: PraiseModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    closeButtonRef.current?.focus()

    return () => {
      previousFocus?.focus()
    }
  }, [open])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )

    if (!focusable?.length) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!open) return null

  return (
    <div className="praise-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="praise-modal"
        role="dialog"
        aria-modal="true"
        aria-label="褒め言葉"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <button
          ref={closeButtonRef}
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
