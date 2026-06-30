import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { shopApi } from '../api/shopApi';
import { formatPrice } from '../data/products';
import Modal from '../components/Modal';

// Захищена сторінка акаунта. Доступ обмежено <ProtectedRoute>. Показує
// JWT-перевіреного користувача (GET /api/auth/me) і РЕАЛЬНУ історію замовлень
// (GET /api/orders) зі статусами (badge) та деталями (GET /api/orders/:id).
function badgeClass(status) {
  const known = ['new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  return known.includes(status) ? `badge badge-${status}` : 'badge';
}

function fmtDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString(); } catch { return String(value); }
}

export default function Account() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const justOrdered = params.get('order');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await shopApi.listOrders();
        if (!cancelled) setOrders(list);
      } catch (err) {
        if (!cancelled) toast.error(err.message, { title: 'Failed to load orders' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const onLogout = async () => {
    await logout();
    toast.info('You have been logged out');
    navigate('/');
  };

  const openDetail = async (id) => {
    try {
      const order = await shopApi.getOrder(id);
      setDetail(order);
    } catch (err) {
      toast.error(err.message, { title: 'Failed to load order' });
    }
  };

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li>My Account</li>
        </ul>
      </nav>

      <h2>My account</h2>

      {justOrdered && (
        <p className="form-success" role="status" style={{ color: 'var(--color-success, #2e7d32)', fontWeight: 600 }}>
          ✓ Thank you! Order #{justOrdered} has been placed and appears in your history below.
        </p>
      )}

      <section aria-labelledby="profile-heading">
        <h3 id="profile-heading">Profile</h3>
        <table>
          <caption>Account details</caption>
          <tbody>
            <tr><th scope="row">Full name</th><td>{user.name}</td></tr>
            <tr><th scope="row">Email</th><td>{user.email}</td></tr>
            <tr><th scope="row">Role</th><td>{user.role}</td></tr>
            <tr><th scope="row">Member since</th><td>{memberSince}</td></tr>
          </tbody>
        </table>
        <p>
          <button type="button" className="btn-danger" onClick={onLogout}>Log out</button>
        </p>
      </section>

      <section aria-labelledby="orders-heading">
        <h3 id="orders-heading">Order history</h3>

        {loading ? (
          <p>Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="empty-cart">
            <h3>No orders yet</h3>
            <p>When you place an order it will show up here.</p>
            <Link className="btn" to="/catalog">Start shopping</Link>
          </div>
        ) : (
          <table>
            <caption>Your previous orders</caption>
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Date</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={String(o.id) === justOrdered ? 'row-highlight' : undefined}>
                  <td>#{o.id}</td>
                  <td>{fmtDate(o.created_at)}</td>
                  <td>{o.items_preview || `${o.item_count} item(s)`}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><span className={badgeClass(o.status)}>{o.status}</span></td>
                  <td><button type="button" className="btn-secondary" onClick={() => openDetail(o.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order #${detail.id}` : ''} size="modal-lg">
        {detail && (
          <div>
            <p>
              <strong>Date:</strong> {fmtDate(detail.created_at)}<br />
              <strong>Address:</strong> {detail.address || '—'}<br />
              <strong>Status:</strong> <span className={badgeClass(detail.status)}>{detail.status}</span>
            </p>
            <table>
              <caption>Order items</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Price</th>
                  <th scope="col">Line total</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.product_title}</td>
                    <td>{it.qty}</td>
                    <td>{formatPrice(it.price)}</td>
                    <td>{formatPrice(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan="3">Total</th>
                  <td>{formatPrice(detail.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
