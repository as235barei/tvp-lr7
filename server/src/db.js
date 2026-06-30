// Пул з'єднань MySQL (mysql2/promise). Параметри читаються з .env.
// Експортує:
//   pool  — пул з'єднань для виконання запитів;
//   query — зручна обгортка, що повертає лише рядки результату.
import mysql from 'mysql2/promise';
import 'dotenv/config';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'shop',
  password: process.env.DB_PASSWORD || 'shoppass',
  database: process.env.DB_NAME || 'techshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Виконати SQL-запит з параметрами (prepared statement захищає від SQL-ін'єкцій).
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Перевірка з'єднання при старті сервера.
export async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
