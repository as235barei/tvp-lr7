import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../data/products';
import Modal from '../components/Modal';

// Shopping cart. Quantity changes and removals update the header badge and the
// order summary instantly. Removing an item opens a confirmation modal first.
export default function Cart() {
  const { items, setQty, removeItem, clear, subtotal, shipping, tax, total, count } = useCart();
  const toast = useToast();
  const [pendingRemove, setPendingRemove] = useState(null);

  const confirmRemove = () => {
    removeItem(pendingRemove.id);
    toast.info(`${pendingRemove.title} removed from cart`, { title: 'Removed from cart' });
    setPendingRemove(null);
  };

  if (items.length === 0) {
    return (
      <>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li>Cart</li>
          </ul>
        </nav>
        <h2>Shopping cart</h2>
        <div className="empty-cart">
          <h3>Your cart is empty</h3>
          <p>Browse the catalog and add a few gadgets to get started.</p>
          <Link className="btn" to="/catalog">Go to catalog</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li>Cart</li>
        </ul>
      </nav>

      <h2>Shopping cart</h2>

      <form onSubmit={(e) => e.preventDefault()}>
        <section className="cart-items" aria-labelledby="cart-items-heading">
          <h3 id="cart-items-heading">Items in your cart ({count})</h3>
          <table>
            <caption>Products currently in the cart</caption>
            <thead>
              <tr>
                <th scope="col">Image</th>
                <th scope="col">Product</th>
                <th scope="col">Unit price</th>
                <th scope="col">Quantity</th>
                <th scope="col">Subtotal</th>
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td><img src={it.image} alt={it.title} /></td>
                  <td><Link to={`/product/${it.id}`}>{it.title}</Link></td>
                  <td>{formatPrice(it.price)}</td>
                  <td>
                    <div className="qty-stepper" role="group" aria-label={`Quantity for ${it.title}`}>
                      <button type="button" aria-label="Decrease" onClick={() => setQty(it.id, it.qty - 1)}>−</button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={it.qty}
                        onChange={(e) => setQty(it.id, Number(e.target.value) || 1)}
                      />
                      <button type="button" aria-label="Increase" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                    </div>
                  </td>
                  <td>{formatPrice(it.price * it.qty)}</td>
                  <td>
                    <button type="button" className="btn-danger" onClick={() => setPendingRemove(it)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <button type="button" className="btn-secondary" onClick={() => { clear(); toast.info('Cart cleared'); }}>
              Clear cart
            </button>
            <Link to="/catalog">Continue shopping</Link>
          </p>
        </section>

        <aside className="order-summary" aria-labelledby="summary-heading">
          <h3 id="summary-heading">Order summary</h3>
          <table>
            <tbody>
              <tr><th scope="row">Subtotal</th><td>{formatPrice(subtotal)}</td></tr>
              <tr><th scope="row">Shipping</th><td>{shipping === 0 ? 'Free' : formatPrice(shipping)}</td></tr>
              <tr><th scope="row">Tax (estimated)</th><td>{formatPrice(tax)}</td></tr>
              <tr><th scope="row">Total</th><td><strong>{formatPrice(total)}</strong></td></tr>
            </tbody>
          </table>
          <p>
            <Link className="btn" to="/checkout">
              Proceed to checkout
            </Link>
          </p>
        </aside>
      </form>

      <Modal
        open={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        title="Remove item?"
        size="small"
      >
        <p style={{ marginBottom: 'var(--space-5)' }}>
          Remove <strong>{pendingRemove?.title}</strong> from your cart?
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-danger" onClick={confirmRemove}>Yes, remove</button>
          <button type="button" className="btn-secondary" onClick={() => setPendingRemove(null)}>Cancel</button>
        </div>
      </Modal>
    </>
  );
}
