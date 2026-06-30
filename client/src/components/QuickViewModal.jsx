import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { categoryLabel, formatPrice } from '../data/products';
import Modal from './Modal';
import Stars from './Stars';

// Contents of the product "Quick view" modal opened from a catalogue card.
export default function QuickViewModal({ product, onClose }) {
  const { addItem } = useCart();
  const toast = useToast();
  const open = !!product;

  const handleAdd = () => {
    addItem(product, 1);
    toast.success(`${product.title} added to cart`, { title: 'Added to cart' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={product?.title}>
      {product && (
        <div className="quickview">
          <img src={product.image} alt={product.title} />
          <div>
            <p className="qv-meta">
              {categoryLabel(product.category)} · {product.brand}
            </p>
            <Stars value={product.rating} />
            <p className="price">{formatPrice(product.price)}</p>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              {product.shortDesc}
            </p>
            <p style={{ fontWeight: 600 }}>
              {product.inStock ? `In stock (${product.units} units)` : 'Out of stock'}
            </p>
            <div className="modal-actions">
              <button type="button" onClick={handleAdd} disabled={!product.inStock}>
                Add to cart
              </button>
              <Link className="btn-secondary btn" to={`/product/${product.id}`} onClick={onClose}>
                Full details
              </Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
