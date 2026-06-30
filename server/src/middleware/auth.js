// Middleware автентифікації/авторизації на основі JWT (Bearer-токен).
//   requireAuth  — пропускає лише запити з дійсним токеном; кладе { id, role }
//                  у req.user. Інакше → 401.
//   requireAdmin — після requireAuth перевіряє роль 'admin'. Інакше → 403.
// Використовується у захищених маршрутах (GET /api/auth/me) і знадобиться для
// адмін-API в ЛР №5.
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token.trim();
  return null;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator privileges required' });
  }
  return next();
}
