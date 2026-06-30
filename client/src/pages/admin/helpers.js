// Дрібні утиліти, спільні для сторінок адмінпанелі.

// Клас бейджа статусу для замовлень/відгуків (reuse зі styles.css).
export function badgeClass(status) {
  const known = ['new', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  // approved відгук показуємо зеленим (як delivered)
  if (status === 'approved') return 'badge badge-delivered';
  return known.includes(status) ? `badge badge-${status}` : 'badge';
}

// Грошове форматування.
export function money(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Дата у вигляді YYYY-MM-DD.
export function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return String(value);
  }
}
