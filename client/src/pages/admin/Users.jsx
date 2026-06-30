import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fmtDate } from './helpers';

// Керування користувачами: таблиця + зміна ролі (user↔admin) + видалення з
// підтвердженням. Захист (не видалити себе / останнього адміна) дублюється на
// сервері — клієнт лише показує повідомлення.
export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { users: list } = await adminApi.listUsers();
      setUsers(list);
    } catch (err) {
      toast.error(err.message, { title: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onRoleChange = async (u, role) => {
    const prev = u.role;
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
    try {
      await adminApi.updateUserRole(u.id, role);
      toast.success(`${u.name} is now ${role}`);
    } catch (err) {
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role: prev } : x)));
      toast.error(err.message, { title: 'Role update failed' });
    }
  };

  const confirmDelete = async () => {
    const u = toDelete;
    setToDelete(null);
    try {
      await adminApi.deleteUser(u.id);
      toast.success(`Deleted ${u.name}`);
      await load();
    } catch (err) {
      toast.error(err.message, { title: 'Delete failed' });
    }
  };

  return (
    <>
      <h2>Manage users</h2>

      <section aria-labelledby="users-heading">
        <h3 id="users-heading">Registered users</h3>
        {loading ? <p>Loading…</p> : (
          <table>
            <caption>{users.length} registered account(s)</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Orders</th>
                <th scope="col">Registered</th>
                <th scope="col">Role</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}{u.id === me?.id && <strong> (you)</strong>}</td>
                  <td>{u.email}</td>
                  <td>{u.order_count}</td>
                  <td>{fmtDate(u.created_at)}</td>
                  <td>
                    <select
                      aria-label={`Role for ${u.name}`}
                      value={u.role}
                      onChange={(e) => onRoleChange(u, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={u.id === me?.id}
                      title={u.id === me?.id ? 'You cannot delete your own account' : 'Delete user'}
                      onClick={() => setToDelete(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete user?">
        <p>Delete account <strong>{toDelete?.name}</strong> ({toDelete?.email})? This cannot be undone.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={confirmDelete} style={{ background: 'var(--status-cancelled, crimson)', borderColor: 'transparent' }}>Delete</button>
          <button type="button" className="btn-secondary" onClick={() => setToDelete(null)}>Cancel</button>
        </div>
      </Modal>
    </>
  );
}
