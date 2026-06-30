import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Site header: brand, primary nav, search box, live cart badge and a profile
// dropdown. The cart badge updates instantly via CartContext and plays a small
// "bump" animation whenever the item count changes.
export default function Header() {
  const { count } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const menuRef = useRef(null);
  const prevCount = useRef(count);

  // animate the badge when the count changes
  useEffect(() => {
    if (prevCount.current !== count) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 340);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    return undefined;
  }, [count]);

  // close the profile dropdown on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  const onLogout = async () => {
    await logout();
    setMenuOpen(false);
    toast.info('You have been logged out');
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand-block">
          <Link className="brand" to="/">
            <h1>TechShop</h1>
          </Link>
          <p className="tagline">Electronics &amp; Gadgets Store</p>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <ul>
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/catalog">Catalog</NavLink></li>
            <li>
              <NavLink to="/cart" className="nav-cart">
                Cart
                {count > 0 && (
                  <span className={`cart-badge${bump ? ' bump' : ''}`} aria-label={`${count} items in cart`}>
                    {count}
                  </span>
                )}
              </NavLink>
            </li>
            {isAdmin && <li><NavLink to="/admin" className="nav-admin">Admin</NavLink></li>}
            {!isAuthenticated && <li><NavLink to="/login">Login</NavLink></li>}
            {!isAuthenticated && <li><NavLink to="/register">Register</NavLink></li>}
          </ul>
        </nav>

        <form className="search-form" role="search" onSubmit={onSearch}>
          <label htmlFor="site-search">Search products</label>
          <input
            type="search"
            id="site-search"
            name="q"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {isAuthenticated && (
          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="profile-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span aria-hidden="true">👤</span>
              {user.name}
              <span aria-hidden="true">▾</span>
            </button>
            {menuOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <Link role="menuitem" to="/account" onClick={() => setMenuOpen(false)}>My account</Link>
                <Link role="menuitem" to="/cart" onClick={() => setMenuOpen(false)}>My cart</Link>
                <button role="menuitem" type="button" onClick={onLogout}>Log out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
