import { useId, useState } from 'react';

// Accessible tooltip: shows a hint bubble on hover AND keyboard focus,
// hides on blur / mouse leave / Escape. Wraps any inline trigger element.
export default function Tooltip({ text, children, placement = 'top' }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span role="tooltip" id={id} className={`tooltip-bubble ${placement}`}>
          {text}
        </span>
      )}
    </span>
  );
}

// Small circular "i" button that exposes a tooltip — handy next to form labels.
export function InfoTip({ text }) {
  return (
    <Tooltip text={text}>
      <button type="button" className="info-dot" aria-label={text}>
        i
      </button>
    </Tooltip>
  );
}
