import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { shopApi } from '../api/shopApi';

// Кошик із ДВОМА режимами роботи (ЛР №6):
//   • ГІСТЬ           — стан зберігається у localStorage (як у ЛР3);
//   • АВТОРИЗОВАНИЙ    — джерело істини на сервері (таблиця cart_items, /api/cart).
// При вході локальний кошик гостя зливається на сервер (POST /api/cart/merge),
// після чого localStorage очищується. Лічильник у Header читає `count` звідси й
// працює в обох режимах. Підсумки (subtotal/shipping/tax/total) рахуються тут.
const CartContext = createContext(null);

const STORAGE_KEY = 'techshop.cart.v1';
const TAX_RATE = 0.08;
const FREE_SHIPPING_OVER = 99;
const SHIPPING_FEE = 12;
const MAX_QTY = 10;
const clamp = (n) => Math.max(1, Math.min(MAX_QTY, Math.trunc(Number(n) || 1)));

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState(readStorage);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false); // чи вже синхронізовано серверний кошик

  // Гість: зберігаємо кошик у localStorage. Авторизований: джерело — сервер,
  // тому в localStorage НЕ пишемо (інакше після виходу кошик "воскресне").
  useEffect(() => {
    if (isAuthenticated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* приватний режим — ігноруємо */
    }
  }, [items, isAuthenticated]);

  // Синхронізація при зміні стану автентифікації.
  // syncedRef виставляється СИНХРОННО перед await — це блокує повторний злив
  // (зокрема подвійний виклик ефекту в React.StrictMode у dev-режимі), щоб
  // кількості в кошику не подвоювалися.
  useEffect(() => {
    if (authLoading) return; // чекаємо завершення відновлення сесії

    if (isAuthenticated) {
      if (syncedRef.current) return;
      syncedRef.current = true;
      setSyncing(true);
      (async () => {
        try {
          const local = readStorage();
          const serverItems = local.length
            ? await shopApi.mergeCart(local.map((i) => ({ productId: i.id, qty: i.qty })))
            : await shopApi.getCart();
          setItems(serverItems);
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        } catch {
          syncedRef.current = false; // дозволити повторну спробу
          setItems(readStorage());
        } finally {
          setSyncing(false);
        }
      })();
    } else {
      // вихід із системи → повертаємось до (порожнього) гостьового кошика
      syncedRef.current = false;
      setItems(readStorage());
    }
  }, [isAuthenticated, authLoading]);

  // --- мутації (однаковий API для обох режимів) ---------------------------
  const addItem = useCallback((product, qty = 1) => {
    const n = clamp(qty);
    // оптимістичне оновлення — лічильник реагує миттєво в обох режимах
    setItems((list) => {
      const existing = list.find((i) => i.id === product.id);
      if (existing) {
        return list.map((i) => (i.id === product.id ? { ...i, qty: clamp(i.qty + n) } : i));
      }
      return [...list, { id: product.id, title: product.title, price: Number(product.price), image: product.image, qty: n }];
    });
    if (isAuthenticated) {
      shopApi.addToCart(product.id, n).then(setItems).catch(() => { /* лишаємо оптимістичний стан */ });
    }
  }, [isAuthenticated]);

  const setQty = useCallback((id, qty) => {
    const n = clamp(qty);
    setItems((list) => list.map((i) => (i.id === id ? { ...i, qty: n } : i)));
    if (isAuthenticated) {
      shopApi.updateCartItem(id, n).then(setItems).catch(() => {});
    }
  }, [isAuthenticated]);

  const removeItem = useCallback((id) => {
    setItems((list) => list.filter((i) => i.id !== id));
    if (isAuthenticated) {
      shopApi.removeCartItem(id).then(setItems).catch(() => {});
    }
  }, [isAuthenticated]);

  const clear = useCallback(() => {
    setItems([]);
    if (isAuthenticated) {
      shopApi.clearCart().then(setItems).catch(() => {});
    }
  }, [isAuthenticated]);

  // Перезавантажити кошик із сервера (напр., після оформлення замовлення).
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const serverItems = await shopApi.getCart();
      setItems(serverItems);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  const derived = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shipping + tax;
    return { count, subtotal, shipping, tax, total };
  }, [items]);

  const value = { items, addItem, removeItem, setQty, clear, refresh, syncing, ...derived };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
