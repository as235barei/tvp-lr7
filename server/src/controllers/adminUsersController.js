// Адмін-контролер користувачів: список, зміна ролі, видалення.
// Захист: не можна видалити самого себе або останнього адміністратора.
import { query } from '../db.js';

const ROLES = ['user', 'admin'];

// GET /api/admin/users — без password_hash
export async function listUsers(_req, res, next) {
  try {
    const users = await query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.id ASC`);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/admin/users/:id/role  { role: 'user' | 'admin' }
export async function updateUserRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    const role = String(req.body?.role || '').trim();
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Allowed: ${ROLES.join(', ')}` });
    }
    const rows = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Не дати знизити роль останнього адміністратора
    if (rows[0].role === 'admin' && role === 'user') {
      const [{ admins }] = await query("SELECT COUNT(*) AS admins FROM users WHERE role = 'admin'");
      if (admins <= 1) {
        return res.status(409).json({ error: 'Cannot demote the last administrator' });
      }
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const [user] = await query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(409).json({ error: 'You cannot delete your own account' });
    }
    const rows = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    if (rows[0].role === 'admin') {
      const [{ admins }] = await query("SELECT COUNT(*) AS admins FROM users WHERE role = 'admin'");
      if (admins <= 1) {
        return res.status(409).json({ error: 'Cannot delete the last administrator' });
      }
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ ok: true, id });
  } catch (err) {
    return next(err);
  }
}
