import { useState } from 'react';

// Bonus dynamic element: collapsible accordion (used for FAQ / specs).
// Each panel expands/collapses on click; only the open one shows its body.
export default function Accordion({ items, allowMultiple = false }) {
  const [open, setOpen] = useState(() => new Set());

  const toggle = (idx) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="accordion">
      {items.map((item, idx) => {
        const expanded = open.has(idx);
        return (
          <div className="accordion-item" key={idx}>
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={expanded}
              onClick={() => toggle(idx)}
            >
              <span>{item.title}</span>
              <span className="chevron" aria-hidden="true">▾</span>
            </button>
            {expanded && <div className="accordion-panel">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
