-- ============================================================================
--  TechShop — наповнення бази тестовими даними.
--  Каталог збігається з фронтендом (client/src/data/products.js).
--  Застосовується автоматично через initdb або вручну:
--    docker compose exec -T db mysql -ushop -pshoppass techshop < database/seed.sql
--
--  Тестові акаунти (паролі — у відкритому вигляді ЛИШЕ для навчання):
--    admin@techshop.local / admin1234   (роль admin)
--    user@techshop.local  / user1234    (роль user)
--  У БД зберігаються лише bcrypt-хеші паролів.
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
--  Користувачі (bcrypt-хеші згенеровано через bcryptjs, 10 раундів)
-- ----------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Site Administrator', 'admin@techshop.local',
   '$2b$10$JXUsRyafFuRTmAiOg89QSu/PWG56u0FXD91hdommTfKXX12IzIFEu', 'admin'),
  ('Test User', 'user@techshop.local',
   '$2b$10$ABSV1pJFZEBIS7jNVfFmE.ST0BqbywGt7RYxXKMPD87gHrmpmh9fy', 'user')
ON DUPLICATE KEY UPDATE email = email;

-- ----------------------------------------------------------------------------
--  Категорії
-- ----------------------------------------------------------------------------
INSERT INTO categories (id, name, slug) VALUES
  (1, 'Smartphones',  'smartphones'),
  (2, 'Laptops',      'laptops'),
  (3, 'Headphones',   'headphones'),
  (4, 'Smartwatches', 'smartwatches'),
  (5, 'Accessories',  'accessories')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

-- ----------------------------------------------------------------------------
--  Товари (18 позицій, ідентичні mock-каталогу фронтенду)
-- ----------------------------------------------------------------------------
INSERT INTO products (id, category_id, title, brand, description, price, stock, rating, image_url) VALUES
  (1, 1, 'iPhone 15 Pro', 'Apple',
     '6.1" Super Retina XDR, A17 Pro chip, 256 GB.', 1099.00, 24, 4.8, '/placeholder.png'),
  (2, 1, 'Samsung Galaxy S24', 'Samsung',
     '6.2" Dynamic AMOLED, Snapdragon 8 Gen 3, 128 GB.', 799.00, 31, 4.6, '/placeholder.png'),
  (3, 1, 'Google Pixel 8', 'Google',
     '6.2" OLED, Tensor G3, best-in-class camera, 128 GB.', 699.00, 18, 4.5, '/placeholder.png'),
  (4, 1, 'iPhone 15', 'Apple',
     '6.1" Super Retina XDR, A16 Bionic, Dynamic Island, 128 GB.', 899.00, 0, 4.7, '/placeholder.png'),
  (5, 2, 'MacBook Air M3', 'Apple',
     '13.6" Liquid Retina, Apple M3, 8 GB RAM, 256 GB SSD.', 1199.00, 12, 4.9, '/placeholder.png'),
  (6, 2, 'Dell XPS 13', 'Dell',
     '13.4" InfinityEdge, Intel Core i7, 16 GB / 512 GB.', 1299.00, 9, 4.5, '/placeholder.png'),
  (7, 2, 'ASUS ROG Zephyrus G14', 'ASUS',
     '14" QHD 165 Hz, Ryzen 9, RTX 4060, 16 GB / 1 TB.', 1599.00, 6, 4.6, '/placeholder.png'),
  (8, 2, 'MacBook Pro 14 M3 Pro', 'Apple',
     '14.2" Liquid Retina XDR, M3 Pro, 18 GB / 512 GB.', 1999.00, 7, 4.9, '/placeholder.png'),
  (9, 3, 'Sony WH-1000XM5', 'Sony',
     'Wireless over-ear, industry-leading noise cancelling, 30 h.', 399.00, 40, 4.8, '/placeholder.png'),
  (10, 3, 'Apple AirPods Pro 2', 'Apple',
     'In-ear, active noise cancelling, USB-C charging case.', 249.00, 55, 4.7, '/placeholder.png'),
  (11, 3, 'Sony WF-1000XM5', 'Sony',
     'True-wireless earbuds, ANC, 24 h total battery.', 299.00, 0, 4.6, '/placeholder.png'),
  (12, 4, 'Apple Watch Series 9', 'Apple',
     '45 mm GPS, Always-On Retina display, S9 SiP.', 429.00, 22, 4.7, '/placeholder.png'),
  (13, 4, 'Samsung Galaxy Watch 6', 'Samsung',
     '44 mm, Super AMOLED, LTE, Wear OS, BioActive sensor.', 349.00, 17, 4.4, '/placeholder.png'),
  (14, 4, 'Apple Watch Ultra 2', 'Apple',
     '49 mm titanium, rugged, 3000-nit display, S9 SiP.', 799.00, 5, 4.8, '/placeholder.png'),
  (15, 5, 'Anker 65W USB-C Charger', 'Anker',
     'Compact GaN charger, 2x USB-C + 1x USB-A.', 49.00, 120, 4.6, '/placeholder.png'),
  (16, 5, 'Logitech MX Master 3S', 'Logitech',
     'Ergonomic wireless mouse, 8K DPI, quiet clicks, USB-C.', 99.00, 64, 4.9, '/placeholder.png'),
  (17, 5, 'Samsung 49" Odyssey G9', 'Samsung',
     '49" curved QLED ultrawide gaming monitor, 240 Hz.', 1199.00, 4, 4.5, '/placeholder.png'),
  (18, 5, 'Anker PowerCore 20K', 'Anker',
     '20000 mAh power bank, 30 W PD, dual-port fast charge.', 59.00, 88, 4.7, '/placeholder.png')
ON DUPLICATE KEY UPDATE
  title = VALUES(title), brand = VALUES(brand), description = VALUES(description),
  price = VALUES(price), stock = VALUES(stock), rating = VALUES(rating),
  image_url = VALUES(image_url), category_id = VALUES(category_id);

-- ----------------------------------------------------------------------------
--  Замовлення (для демонстрації керування у ЛР №5)
--  Прив'язані до тестового користувача (user@techshop.local, id = 2).
-- ----------------------------------------------------------------------------
INSERT INTO orders (id, user_id, status, total, address) VALUES
  (1, 2, 'new',        1348.00, 'Київ, вул. Хрещатик, 1'),
  (2, 2, 'paid',        799.00, 'Львів, пл. Ринок, 5'),
  (3, 2, 'processing',  157.00, 'Одеса, вул. Дерибасівська, 12')
ON DUPLICATE KEY UPDATE
  status = VALUES(status), total = VALUES(total), address = VALUES(address);

INSERT INTO order_items (id, order_id, product_id, qty, price) VALUES
  (1, 1, 1,  1, 1099.00),   -- iPhone 15 Pro
  (2, 1, 10, 1,  249.00),   -- AirPods Pro 2          → разом 1348.00
  (3, 2, 2,  1,  799.00),   -- Samsung Galaxy S24     → разом  799.00
  (4, 3, 15, 2,   49.00),   -- Anker 65W USB-C x2
  (5, 3, 18, 1,   59.00)    -- Anker PowerCore 20K    → разом  157.00
ON DUPLICATE KEY UPDATE
  qty = VALUES(qty), price = VALUES(price);

-- ----------------------------------------------------------------------------
--  Відгуки (для модерації у ЛР №5): кілька pending + кілька approved
--  Автор — тестовий користувач (id = 2).
-- ----------------------------------------------------------------------------
INSERT INTO reviews (id, product_id, user_id, rating, comment, status) VALUES
  (1, 1,  2, 5, 'Неймовірно швидкий, титановий корпус відчувається преміально.', 'pending'),
  (2, 1,  2, 4, 'Якість камери приголомшлива, лише ціна зависока.',               'pending'),
  (3, 9,  2, 5, 'Найкраще шумозаглушення, яке я пробував. Дуже раджу.',            'pending'),
  (4, 5,  2, 3, 'Гарний ноутбук, але 8 ГБ RAM замало для такої ціни.',            'approved'),
  (5, 10, 2, 5, 'AirPods Pro 2 звучать чудово, активне шумозаглушення на висоті.', 'approved')
ON DUPLICATE KEY UPDATE
  rating = VALUES(rating), comment = VALUES(comment), status = VALUES(status);
