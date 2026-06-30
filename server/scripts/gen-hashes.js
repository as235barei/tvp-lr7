// Допоміжний скрипт: генерує bcrypt-хеші для паролів насіннєвих акаунтів.
// Запуск:  node scripts/gen-hashes.js
import bcrypt from 'bcryptjs';

const accounts = [
  { label: 'admin', password: 'admin1234' },
  { label: 'user', password: 'user1234' },
];

for (const a of accounts) {
  const hash = await bcrypt.hash(a.password, 10);
  console.log(`${a.label}\t${a.password}\t${hash}`);
}
