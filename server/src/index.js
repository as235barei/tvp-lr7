// Точка входу сервера: завантажує .env, перевіряє БД і слухає порт PORT.
import 'dotenv/config';
import { createApp } from './app.js';
import { assertDbConnection } from './db.js';

const PORT = Number(process.env.PORT || 3000);

async function start() {
  try {
    await assertDbConnection();
    console.log('[db] connection OK');
  } catch (err) {
    console.error('[db] connection FAILED:', err.message);
    console.error('     Переконайтеся, що MySQL піднято: docker compose up -d db');
    process.exit(1);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[api] TechShop API listening on http://localhost:${PORT}`);
  });
}

start();
