import { createContext, useCallback, useContext, useRef, useState } from 'react';

// Global toast notification system.
// `useToast()` exposes push/success/error/info/warning helpers; toasts appear
// in response to user actions (add to cart, login required, ...) and auto-dismiss.
const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children, duration = 3000 }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    // play the leaving animation first, then drop from state
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const t = setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id));
      timers.current.delete(id);
    }, 260);
    timers.current.set(`leave-${id}`, t);
  }, []);

  const push = useCallback(
    (message, { type = 'info', title, duration: d } = {}) => {
      const id = nextId++;
      const toast = { id, message, type, title: title ?? defaultTitle(type) };
      setToasts((list) => [...list, toast]);
      const timeout = setTimeout(() => remove(id), d ?? duration);
      timers.current.set(id, timeout);
      return id;
    },
    [duration, remove],
  );

  const api = {
    push,
    success: (msg, opts) => push(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => push(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => push(msg, { ...opts, type: 'info' }),
    warning: (msg, opts) => push(msg, { ...opts, type: 'warning' }),
    remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

function defaultTitle(type) {
  return { success: 'Success', error: 'Error', warning: 'Notice', info: 'Info' }[type] ?? 'Info';
}

const ICONS = { success: '✓', error: '!', warning: '!', info: 'i' };

function ToastStack({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}${t.leaving ? ' leaving' : ''}`} role="status">
          <span className="toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            <div className="toast-msg">{t.message}</div>
          </div>
          <button className="toast-close" aria-label="Dismiss notification" onClick={() => onClose(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
