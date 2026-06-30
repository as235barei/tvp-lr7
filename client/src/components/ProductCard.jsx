import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { categoryLabel, formatPrice } from '../data/products';
import Stars from './Stars';
import Tooltip from './Tooltip';

// Catalogue / home product card.
// "Add to cart" triggers the live cart badge + a toast; "Quick view" opens the
// modal (handled by the parent through onQuickView). Out-of-stock items show a
// tooltip explaining the disabled button.
export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const toast = useToast();

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem(product, 1);
    toast.success(`${product.title} added to cart`, { title: 'Added to cart' });
  };

  return (
    <article>
      <div className="card-media">
        <img src={product.image} alt={product.title} loading="lazy" />
        {!product.inStock && <span className="out-badge">Out of stock</span>}
        {onQuickView && (
          <button type="button" className="quickview-btn" onClick={() => onQuickView(product)}>
            Quick view
          </button>
        )}
      </div>

      <h3>{product.title}</h3>
      <p>
        {categoryLabel(product.category)} · {product.brand}
      </p>
      <Stars value={product.rating} />
      <div className="tag-row">
        {Object.values(product.specs)
          .slice(0, 2)
          .map((s) => (
            <span className="spec-pill" key={s}>
              {s}
            </span>
          ))}
      </div>
      <p className="price">{formatPrice(product.price)}</p>

      <div className="card-actions">
        <Link className="card-btn ghost" to={`/product/${product.id}`}>
          View
        </Link>
        {product.inStock ? (
          <button type="button" className="card-btn" onClick={handleAdd}>
            Add to cart
          </button>
        ) : (
          <Tooltip text="This item is currently out of stock. Check back soon.">
            <button type="button" className="card-btn" disabled>
              Add to cart
            </button>
          </Tooltip>
        )}
      </div>
    </article>
  );
}
