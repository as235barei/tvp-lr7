import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import { badgeClass, money, fmtDate } from './helpers';

// Адмін-дашборд: картки зведеної статистики (/api/admin/stats) + таблиця
// останніх замовлень. Дані реальні — з MySQL через бекенд.
export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    adminApi.stats()
      .then((res) => { if (alive) setData(res); })
      .catch((err) => toast.error(err.message, { title: 'Failed to load stats' }))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <><h2>Dashboard</h2><p>Loading…</p></>;
  if (!data) return <><h2>Dashboard</h2><p>No data available.</p></>;

  const { stats, recentOrders } = data;

  return (
    <>
      <h2>Dashboard</h2>

      <section className="stats" aria-labelledby="stats-heading">
        <h3 id="stats-heading">Overview statistics</h3>
        <article><h4>Total products</h4><p>{stats.products}</p></article>
        <article><h4>Total orders</h4><p>{stats.orders}</p></article>
        <article><h4>Registered users</h4><p>{stats.users}</p></article>
        <article><h4>Revenue</h4><p>{money(stats.revenue)}</p></article>
        <article><h4>Categories</h4><p>{stats.categories}</p></article>
        <article><h4>Pending reviews</h4><p>{stats.pendingReviews}</p></article>
      </section>

      <section aria-labelledby="recent-heading">
        <h3 id="recent-heading">Latest orders</h3>
        {recentOrders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <table>
            <caption>Most recent customer orders</caption>
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Customer</th>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.user_name}</td>
                  <td>{fmtDate(o.created_at)}</td>
                  <td>{money(o.total)}</td>
                  <td><span className={badgeClass(o.status)}>{o.status}</span></td>
                  <td><Link to="/admin/orders">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
