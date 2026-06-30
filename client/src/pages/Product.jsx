import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatPrice } from '../data/products';
import { shopApi } from '../api/shopApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Stars from '../components/Stars';
import Accordion from '../components/Accordion';
import Tooltip from '../components/Tooltip';
import NotFound from './NotFound';

// Сторінка товару під'єднана до БД:
//   • деталі     — GET /api/products/:id;
//   • відгуки    — GET /api/products/:id/reviews (лише approved, з іменем автора);
//   • новий відгук — POST /api/products/:id/reviews (для залогінених; статус pending
//     → toast «Review submitted for moderation»). Гостю показуємо підказку увійти.
export default function Product() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Завантаження товару + його схвалених відгуків.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const p = await shopApi.getProduct(id);
        if (cancelled) return;
        setProduct(p);
        const rv = await shopApi.listReviews(id);
        if (!cancelled) setReviews(rv);
      } catch (err) {
        if (!cancelled) {
          if (err.status === 404) setNotFound(true);
          else toast.error(err.message, { title: 'Failed to load product' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) return <NotFound />;
  if (loading || !product) {
    return (
      <>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/catalog">Catalog</Link></li>
            <li>Loading…</li>
          </ul>
        </nav>
        <h2>Loading product…</h2>
      </>
    );
  }

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${qty}× ${product.title} added to cart`, { title: 'Added to cart' });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await shopApi.addReview(product.id, { rating: Number(rating), comment: comment.trim() });
      toast.success('Review submitted for moderation', { title: 'Thank you!' });
      setComment('');
      setRating(5);
    } catch (err) {
      toast.error(err.message, { title: 'Could not submit review' });
    } finally {
      setSubmitting(false);
    }
  };

  const specItems = [
    {
      title: 'Key details',
      content: (
        <table>
          <caption>Key details of {product.title}</caption>
          <tbody>
            <tr><th scope="row">Brand</th><td>{product.brand}</td></tr>
            <tr><th scope="row">Category</th><td>{product.categoryName || product.category}</td></tr>
            <tr><th scope="row">Rating</th><td>{product.rating.toFixed(1)} / 5</td></tr>
            <tr><th scope="row">Availability</th><td>{product.inStock ? `In stock (${product.units} units)` : 'Out of stock'}</td></tr>
          </tbody>
        </table>
      ),
    },
    {
      title: 'Shipping & returns',
      content: <p>Free shipping on orders over $99. 30-day no-questions returns and a 2-year official warranty on all devices.</p>,
    },
    {
      title: 'In the box',
      content: <p>{product.title}, USB-C cable, quick-start guide and warranty card.</p>,
    },
  ];

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/catalog">Catalog</Link></li>
          <li><Link to={`/catalog?category=${product.category}`}>{product.categoryName || product.category}</Link></li>
          <li>{product.title}</li>
        </ul>
      </nav>

      <article className="product-detail">
        <h2>{product.title}</h2>

        <section className="gallery" aria-labelledby="gallery-heading">
          <h3 id="gallery-heading">Gallery</h3>
          <img src={product.image} alt={`${product.title} main view`} />
          <img src={product.image} alt={`${product.title} angle view`} />
          <img src={product.image} alt={`${product.title} rear view`} />
          <img src={product.image} alt={`${product.title} detail view`} />
        </section>

        <section className="purchase" aria-labelledby="buy-heading">
          <h3 id="buy-heading">Purchase</h3>
          <p className="price">
            Price: <strong>{formatPrice(product.price)}</strong>
          </p>
          <p>
            Availability:{' '}
            <strong>{product.inStock ? `In stock (${product.units} units)` : 'Out of stock'}</strong>
          </p>
          <Stars value={product.rating} />

          <div style={{ marginTop: 'var(--space-4)' }}>
            <label style={{ marginBottom: 'var(--space-2)' }}>Quantity</label>
            <div className="qty-stepper" role="group" aria-label="Quantity selector">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <input
                type="number"
                min="1"
                max="10"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                aria-label="Quantity"
              />
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              {product.inStock ? (
                <button type="button" className="btn-block" onClick={handleAdd}>Add to cart</button>
              ) : (
                <Tooltip text="This item is out of stock and cannot be ordered right now.">
                  <button type="button" className="btn-block" disabled>Add to cart</button>
                </Tooltip>
              )}
            </div>
          </div>
        </section>

        <section className="specs" aria-labelledby="specs-heading">
          <h3 id="specs-heading">Details</h3>
          <Accordion items={specItems} />
        </section>

        <section className="description" aria-labelledby="desc-heading">
          <h3 id="desc-heading">Description</h3>
          <p>{product.shortDesc} {product.title} combines premium build quality with leading performance, making it a standout choice in the {(product.categoryName || product.category).toLowerCase()} category from {product.brand}.</p>
        </section>

        <section className="reviews" aria-labelledby="reviews-heading">
          <h3 id="reviews-heading">Customer reviews</h3>

          {reviews.length === 0 ? (
            <p>No approved reviews yet. Be the first to share your experience!</p>
          ) : (
            reviews.map((rv) => (
              <article key={rv.id}>
                <p><Stars value={rv.rating} /></p>
                <p>By <strong>{rv.author}</strong> on {new Date(rv.created_at).toLocaleDateString()}</p>
                {rv.comment && <p>{rv.comment}</p>}
              </article>
            ))
          )}

          {/* Форма «залишити відгук» */}
          <div className="review-form-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <h4>Leave a review</h4>
            {isAuthenticated ? (
              <form onSubmit={submitReview}>
                <div className="field">
                  <label htmlFor="rv-rating">Rating</label>
                  <select id="rv-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: 'auto' }}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rv-comment">Comment</label>
                  <textarea
                    id="rv-comment"
                    rows="3"
                    placeholder="Share your thoughts about this product…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
                  Reviews are published after moderation by our team.
                </p>
              </form>
            ) : (
              <p>
                Please <Link to="/login">log in</Link> to leave a review.
              </p>
            )}
          </div>
        </section>
      </article>
    </>
  );
}
