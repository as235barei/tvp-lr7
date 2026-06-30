// Контролер автентифікації: реєстрація, вхід, поточний користувач, вихід.
// Паролі зберігаються лише як bcrypt-хеші; сесія — на основі JWT (Bearer).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const BCRYPT_ROUNDS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// --- серверна валідація (дзеркало клієнтської) ------------------------------
function validateRegister({ name, email, password }) {
  const errors = [];
  if (!name || String(name).trim().length === 0) errors.push('Name is required');
  if (!email || !EMAIL_RE.test(String(email))) errors.push('Valid email is required');
  if (!password || String(password).length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  return errors;
}

// Сформувати JWT із корисним навантаженням { id, role }.
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Прибрати з об'єкта користувача чутливе поле password_hash.
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const errors = validateRegister({ name, email, password });
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; '), errors });
    }

    const normEmail = String(email).trim().toLowerCase();

    // перевірка унікальності email
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [String(name).trim(), normEmail, passwordHash, 'user'],
    );

    const rows = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId],
    );
    const user = rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const normEmail = String(email).trim().toLowerCase();

    const rows = await query(
      'SELECT id, name, email, role, password_hash, created_at FROM users WHERE email = ? LIMIT 1',
      [normEmail],
    );
    if (rows.length === 0) {
      // не розкриваємо, чи існує email — однакова відповідь для обох випадків
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.status(200).json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/auth/me  (захищений requireAuth)
export async function me(req, res, next) {
  try {
    const rows = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user: publicUser(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/logout
// Для stateless Bearer-токена серверної дії не потрібно — клієнт видаляє токен.
export function logout(_req, res) {
  return res.status(200).json({ ok: true, message: 'Logged out' });
}
