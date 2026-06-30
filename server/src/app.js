// Конфігурація Express-застосунку: middleware, маршрути, обробка помилок.
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';

export function createApp() {
  const app = express();

  // CORS: дозволяємо запити з React-клієнта (порт 5173) з обліковими даними.
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Парсинг JSON-тіла запитів.
  app.use(express.json());

  // Простий health-check.
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'techshop-api' }));

  // Маршрути автентифікації.
  app.use('/api/auth', authRoutes);

  // Публічна вітрина (гість + користувач).
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);

  // Користувацький функціонал (захищено requireAuth у самих роутерах).
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  // Адмін-API (захищено requireAuth + requireAdmin).
  app.use('/api/admin', adminRoutes);

  // 404 для невідомих API-шляхів.
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  // Централізований обробник помилок → завжди JSON { error }.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[API error]', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

export default createApp;
