# TechShop — Лабораторна робота №7

Тема роботи — навантажувальне тестування сайту TechShop за допомогою Apache JMeter.
План тесту лежить у `load-testing/shop.jmx`, разом із ним у репозиторії зберігається
код самого застосунку (клієнт, сервер, база даних).

## Технології

- Apache JMeter (`load-testing/shop.jmx`)
- React + Vite (`client/`)
- Node.js + Express (`server/`)
- MySQL (`database/`)

## Як запустити

1. Підняти застосунок:

```bash
docker compose -p techshop up -d db
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

2. Запустити тест:

```bash
jmeter -n -t load-testing/shop.jmx -l results.jtl -e -o report
```

## Тестові акаунти

- Адміністратор: `admin@techshop.local` / `admin1234`
- Користувач: `user@techshop.local` / `user1234`
