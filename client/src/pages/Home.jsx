import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, products as MOCK } from '../data/products';
import { shopApi } from '../api/shopApi';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

// Головна сторінка: hero, категорії, добірка топових товарів.
// Добірка тепер береться з БД (GET /api/products), з резервом на mock, якщо API
// недоступний. Картки відкривають Quick-view і живлять кошик/тости.
export default function Home() {
  const [quickView, setQuickView] = useState(null);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { products } = await shopApi.listProducts({ sort: 'rating' });
        if (!cancelled) setFeatured(products.filter((p) => p.rating >= 4.7).slice(0, 8));
      } catch {
        // резерв: статичний каталог
        if (!cancelled) setFeatured(MOCK.filter((p) => p.rating >= 4.7).slice(0, 8));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        <h2 id="hero-heading">Top tech, unbeatable prices</h2>
        <p>
          Discover the latest smartphones, laptops, headphones and smartwatches from leading brands.
          Free shipping on orders over $99.
        </p>
        <p>
          <Link to="/catalog">Shop the catalog</Link>
        </p>
      </section>

      <section className="categories" aria-labelledby="categories-heading">
        <h2 id="categories-heading">Categories</h2>
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/catalog?category=${c.id}`}>{c.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="featured product-grid" aria-labelledby="featured-heading">
        <h2 id="featured-heading">Featured products</h2>
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
        ))}
      </section>

      <aside className="promo" aria-labelledby="promo-heading">
        <h2 id="promo-heading">Why shop with TechShop?</h2>
        <ul>
          <li>2-year official warranty on all devices</li>
          <li>Free shipping over $99 and easy returns</li>
          <li>Secure checkout and 24/7 support</li>
        </ul>
      </aside>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
