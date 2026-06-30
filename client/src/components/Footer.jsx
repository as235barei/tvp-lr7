import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <nav className="footer-nav" aria-label="Footer navigation">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/catalog">Catalog</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/account">My Account</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </nav>
        <p>&copy; 2026 TechShop. All rights reserved.</p>
        <address>
          Contact: support@techshop.example · +1 (555) 010-2026 · Odesa, Ukraine
        </address>
      </div>
    </footer>
  );
}
