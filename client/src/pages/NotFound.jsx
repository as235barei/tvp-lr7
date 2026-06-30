import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section style={{ textAlign: 'center', padding: 'var(--space-7) 0' }}>
      <h2>404 — Page not found</h2>
      <p style={{ color: 'var(--color-text-muted)', margin: 'var(--space-3) 0 var(--space-5)' }}>
        The page or product you are looking for does not exist.
      </p>
      <Link className="btn" to="/">Back to home</Link>
    </section>
  );
}
