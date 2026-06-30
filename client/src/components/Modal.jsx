import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Reusable modal dialog rendered through a portal.
// Closes on Escape, on overlay click and on the × button. Locks page scroll
// while open and restores focus afterwards. Used for product Quick-view and
// the "remove from cart" confirmation.
export default function Modal({ open, onClose, title, children, size = '' }) {
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // move focus into the dialog
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal ${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
        {title && <h3 style={{ marginBottom: 'var(--space-4)', paddingRight: '2rem' }}>{title}</h3>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
