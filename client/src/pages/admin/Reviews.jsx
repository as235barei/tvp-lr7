import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import { badgeClass, fmtDate } from './helpers';

// Модерація відгуків: таблиця з фільтром за статусом + approve (pending→approved)
// + видалення з підтвердженням.
export default function Reviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  const load = async (status = '') => {
    setLoading(true);
    try {
      const { reviews: list } = await adminApi.listReviews(status);
      setReviews(list);
    } catch (err) {
      toast.error(err.message, { title: 'Failed to load reviews' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onFilter = (status) => { setFilter(status); load(status); };

  const approve = async (r) => {
    try {
      await adminApi.approveReview(r.id);
      toast.success('Review approved');
      await load(filter);
    } catch (err) {
      toast.error(err.message, { title: 'Approve failed' });
    }
  };

  const confirmDelete = async () => {
    const r = toDelete;
    setToDelete(null);
    try {
      await adminApi.deleteReview(r.id);
      toast.success('Review deleted');
      await load(filter);
    } catch (err) {
      toast.error(err.message, { title: 'Delete failed' });
    }
  };

  return (
    <>
      <h2>Moderate reviews</h2>

      <section aria-labelledby="reviews-heading">
        <h3 id="reviews-heading">Customer reviews</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="rev-filter" style={{ display: 'inline', marginRight: '0.5rem' }}>Filter by status</label>
          <select id="rev-filter" value={filter} onChange={(e) => onFilter(e.target.value)} style={{ width: 'auto', display: 'inline-block' }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {loading ? <p>Loading…</p> : reviews.length === 0 ? <p>No reviews found.</p> : (
          <table>
            <caption>{reviews.length} review(s)</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Product</th>
                <th scope="col">Author</th>
                <th scope="col">Rating</th>
                <th scope="col">Comment</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.product_title}</td>
                  <td>{r.user_name}</td>
                  <td>{r.rating} / 5</td>
                  <td>{r.comment}<br /><small>{fmtDate(r.created_at)}</small></td>
                  <td><span className={badgeClass(r.status)}>{r.status}</span></td>
                  <td>
                    {r.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => approve(r)}>Approve</button>{' '}
                      </>
                    )}
                    <button type="button" className="btn-secondary" onClick={() => setToDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete review?">
        <p>Delete this review by <strong>{toDelete?.user_name}</strong>? This cannot be undone.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={confirmDelete} style={{ background: 'var(--status-cancelled, crimson)', borderColor: 'transparent' }}>Delete</button>
          <button type="button" className="btn-secondary" onClick={() => setToDelete(null)}>Cancel</button>
        </div>
      </Modal>
    </>
  );
}
