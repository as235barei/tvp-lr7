import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import { badgeClass, money, fmtDate } from './helpers';

const STATUSES = ['new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

// Керування замовленнями: таблиця + зміна статусу (<select> → PATCH) +
// перегляд позицій замовлення у модалці.
export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = async (status = '') => {
    setLoading(true);
    try {
      const { orders: list } = await adminApi.listOrders(status);
      setOrders(list);
    } catch (err) {
      toast.error(err.message, { title: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onStatusChange = async (order, status) => {
    const prev = order.status;
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      await adminApi.updateOrderStatus(order.id, status);
      toast.success(`Order #${order.id} → ${status}`);
    } catch (err) {
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: prev } : o)));
      toast.error(err.message, { title: 'Status update failed' });
    }
  };

  const openDetail = async (id) => {
    try {
      const { order } = await adminApi.getOrder(id);
      setDetail(order);
    } catch (err) {
      toast.error(err.message, { title: 'Failed to load order' });
    }
  };

  const onFilter = (status) => { setFilter(status); load(status); };

  return (
    <>
      <h2>Manage orders</h2>

      <section aria-labelledby="orders-heading">
        <h3 id="orders-heading">Orders</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="order-filter" style={{ display: 'inline', marginRight: '0.5rem' }}>Filter by status</label>
          <select id="order-filter" value={filter} onChange={(e) => onFilter(e.target.value)} style={{ width: 'auto', display: 'inline-block' }}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <p>Loading…</p> : orders.length === 0 ? <p>No orders found.</p> : (
          <table>
            <caption>{orders.length} order(s)</caption>
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Customer</th>
                <th scope="col">Date</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Change status</th>
                <th scope="col">View</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.user_name}<br /><small>{o.user_email}</small></td>
                  <td>{fmtDate(o.created_at)}</td>
                  <td>{o.item_count}</td>
                  <td>{money(o.total)}</td>
                  <td><span className={badgeClass(o.status)}>{o.status}</span></td>
                  <td>
                    <select
                      aria-label={`Status for order ${o.id}`}
                      value={o.status}
                      onChange={(e) => onStatusChange(o, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
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
              <strong>Customer:</strong> {detail.user_name} ({detail.user_email})<br />
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
                    <td>{money(it.price)}</td>
                    <td>{money(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan="3">Total</th>
                  <td>{money(detail.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
