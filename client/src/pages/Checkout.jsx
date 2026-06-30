import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { shopApi } from '../api/shopApi';
import { formatPrice } from '../data/products';

// Оформлення замовлення (ЛР №6).
//   • Гостю пропонуємо увійти (історія замовлень потрібна авторизованим).
//   • Користувач заповнює адресу → POST /api/orders (бере серверний кошик,
//     рахує total за цінами БД, очищає кошик). Успіх → toast + редірект на
//     сторінку підтвердження замовлення (/account з відкритою історією).
export default function Checkout() {
  const { items, subtotal, shipping, tax, total, refresh } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Гість — спершу логін.
  if (!isAuthenticated) {
    return (
      <>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li>Checkout</li>
          </ul>
        </nav>
        <h2>Checkout</h2>
        <div className="empty-cart">
          <h3>Please sign in to place your order</h3>
          <p>Your order history and tracking are tied to your account.</p>
          <Link className="btn" to="/login" state={{ from: '/checkout' }}>Log in to continue</Link>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li>Checkout</li>
          </ul>
        </nav>
        <h2>Checkout</h2>
        <div className="empty-cart">
          <h3>Your cart is empty</h3>
          <p>Add a few products before checking out.</p>
          <Link className="btn" to="/catalog">Go to catalog</Link>
        </div>
      </>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const fullAddress = [form.city, form.address].filter(Boolean).join(', ');
    if (fullAddress.trim().length < 5) {
      toast.error('Please enter your city and delivery address', { title: 'Address required' });
      return;
    }
    setSubmitting(true);
    try {
      const order = await shopApi.createOrder({ address: fullAddress });
      await refresh(); // кошик очищено на сервері — синхронізуємо лічильник
      toast.success(`Order #${order.id} placed successfully! Total ${formatPrice(order.total)}.`, {
        title: 'Order confirmed',
      });
      navigate(`/account?order=${order.id}`);
    } catch (err) {
      toast.error(err.message, { title: 'Checkout failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/cart">Cart</Link></li>
          <li>Checkout</li>
        </ul>
      </nav>

      <h2>Checkout</h2>

      <form onSubmit={onSubmit}>
        <section className="checkout-shipping" aria-labelledby="ship-heading">
          <h3 id="ship-heading">Shipping details</h3>
          <div className="field">
            <label htmlFor="co-name">Full name</label>
            <input id="co-name" name="name" value={form.name} onChange={onChange} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="co-city">City</label>
            <input id="co-city" name="city" value={form.city} onChange={onChange} placeholder="e.g. Одеса" required />
          </div>
          <div className="field">
            <label htmlFor="co-address">Address (street, building, apartment)</label>
            <input id="co-address" name="address" value={form.address} onChange={onChange} placeholder="вул. Дерибасівська, 12" required />
          </div>
          <div className="field">
            <label htmlFor="co-phone">Phone</label>
            <input id="co-phone" name="phone" value={form.phone} onChange={onChange} autoComplete="tel" />
          </div>
        </section>

        <aside className="order-summary" aria-labelledby="co-summary-heading">
          <h3 id="co-summary-heading">Order summary</h3>
          <table>
            <caption>Items in your order</caption>
            <thead>
              <tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Subtotal</th></tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.title}</td>
                  <td>{it.qty}</td>
                  <td>{formatPrice(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row">Subtotal</th><td /><td>{formatPrice(subtotal)}</td></tr>
              <tr><th scope="row">Shipping</th><td /><td>{shipping === 0 ? 'Free' : formatPrice(shipping)}</td></tr>
              <tr><th scope="row">Tax (estimated)</th><td /><td>{formatPrice(tax)}</td></tr>
              <tr><th scope="row">Total</th><td /><td><strong>{formatPrice(total)}</strong></td></tr>
            </tfoot>
          </table>
        </aside>

        <p>
          <button type="submit" className="btn-block" disabled={submitting}>
            {submitting ? 'Placing order…' : `Place order — ${formatPrice(total)}`}
          </button>
        </p>
      </form>
    </>
  );
}
