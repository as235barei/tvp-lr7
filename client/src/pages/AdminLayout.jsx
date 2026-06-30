import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Каркас адміністративної панелі (ЛР №5). Рендериться поза вітринним <Layout>,
// щоб використати темний адмін-хедер. Бічна навігація веде до вкладених
// сторінок (Dashboard / Products / Orders / Users / Reviews), які
// відображаються через <Outlet />. Доступ до всієї гілки /admin захищено
// <ProtectedRoute adminOnly> (див. App.jsx).
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = 'admin';
    return () => { document.body.className = 'page-home'; };
  }, []);

  const onLogout = async () => {
    await logout();
    toast.info('You have been logged out');
    navigate('/');
  };

  return (
    <>
      <header className="admin-header">
        <div className="container header-inner">
          <div className="brand-block">
            <Link className="brand" to="/admin"><h1>TechShop Admin</h1></Link>
            <p className="tagline">Administration panel</p>
          </div>
          <nav className="main-nav" aria-label="Admin top navigation">
            <ul>
              <li><Link to="/">View store</Link></li>
              {user && <li><span style={{ color: '#94a3b8' }}>👤 {user.name}</span></li>}
            </ul>
          </nav>
        </div>
      </header>

      <div className="container admin-shell">
        <aside className="admin-sidebar">
          <nav className="admin-nav" aria-label="Admin navigation">
            <ul>
              <li><NavLink to="/admin" end>Dashboard</NavLink></li>
              <li><NavLink to="/admin/products">Products</NavLink></li>
              <li><NavLink to="/admin/orders">Orders</NavLink></li>
              <li><NavLink to="/admin/users">Users</NavLink></li>
              <li><NavLink to="/admin/reviews">Reviews</NavLink></li>
              <li>
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    width: '100%', background: 'none', border: 0, color: 'inherit',
                    textAlign: 'left', padding: '0.6rem 0.9rem', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>

      <footer className="admin-footer">
        <div className="container footer-grid">
          <p>&copy; 2026 TechShop — Admin</p>
          <nav className="footer-nav"><ul><li><Link to="/">Back to store</Link></li></ul></nav>
        </div>
      </footer>
    </>
  );
}
