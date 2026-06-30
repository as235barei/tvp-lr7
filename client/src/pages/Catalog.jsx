import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { shopApi } from '../api/shopApi';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { InfoTip } from '../components/Tooltip';

const SORTS = {
  popular: { label: 'Popularity', fn: (a, b) => b.rating - a.rating },
  price_asc: { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  price_desc: { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  rating: { label: 'Customer rating', fn: (a, b) => b.rating - a.rating },
  name: { label: 'Name (A–Z)', fn: (a, b) => a.title.localeCompare(b.title) },
};

// Каталог тепер бере товари з БД через GET /api/products (а не з mock).
// Динамічні фільтри/сортування/пошук із ЛР3 ЗБЕРЕЖЕНО: список товарів і категорій
// завантажується один раз, а фільтрація відбувається МИТТЄВО на клієнті (useMemo),
// без перезавантаження сторінки. Категорії та бренди — з реальних даних БД.
export default function Catalog() {
  const [params] = useSearchParams();

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]); // [{id: slug, label: name}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedCats, setSelectedCats] = useState(
    () => new Set(params.get('category') ? [params.get('category')] : []),
  );
  const [selectedBrands, setSelectedBrands] = useState(() => new Set());
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [maxPrice, setMaxPrice] = useState(null); // null = «не обмежено» до завантаження
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('popular');
  const [quickView, setQuickView] = useState(null);

  // Одноразове завантаження каталогу + категорій із БД.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [{ products }, { categories: cats }] = await Promise.all([
          shopApi.listProducts(),
          shopApi.listCategories(),
        ]);
        if (cancelled) return;
        setAllProducts(products);
        setCategories(cats.map((c) => ({ id: c.slug, label: c.name })));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Динамічні межі ціни та список брендів — з реально завантажених товарів.
  const priceMax = useMemo(() => {
    const max = allProducts.reduce((m, p) => Math.max(m, p.price), 0);
    return Math.max(50, Math.ceil(max / 50) * 50);
  }, [allProducts]);

  const brands = useMemo(
    () => [...new Set(allProducts.map((p) => p.brand))].sort((a, b) => a.localeCompare(b)),
    [allProducts],
  );

  // Після завантаження товарів ставимо повзунок ціни на максимум.
  // Важливо чекати на НЕпорожній список — інакше priceMax=50 (з порожнього
  // каталогу) передчасно зафіксував би верхню межу ще під час завантаження.
  useEffect(() => {
    if (allProducts.length && maxPrice === null) setMaxPrice(priceMax);
  }, [allProducts, priceMax, maxPrice]);

  // Синхронізація з deep-link (?category=, ?q=).
  useEffect(() => {
    const cat = params.get('category');
    setSelectedCats(cat ? new Set([cat]) : new Set());
    setQuery(params.get('q') ?? '');
  }, [params]);

  const toggleSet = (setter) => (value) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const toggleCat = toggleSet(setSelectedCats);
  const toggleBrand = toggleSet(setSelectedBrands);

  const effectiveMax = maxPrice ?? priceMax;

  // --- миттєвий конвеєр фільтрації + сортування (клієнтський, як у ЛР3) ----
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allProducts.filter((p) => {
      if (selectedCats.size && !selectedCats.has(p.category)) return false;
      if (selectedBrands.size && !selectedBrands.has(p.brand)) return false;
      if (p.price > effectiveMax) return false;
      if (inStockOnly && !p.inStock) return false;
      if (q && !(`${p.title} ${p.brand} ${p.shortDesc}`.toLowerCase().includes(q))) return false;
      return true;
    });
    return [...list].sort(SORTS[sort].fn);
  }, [allProducts, selectedCats, selectedBrands, effectiveMax, inStockOnly, query, sort]);

  const resetAll = () => {
    setSelectedCats(new Set());
    setSelectedBrands(new Set());
    setQuery('');
    setMaxPrice(priceMax);
    setInStockOnly(false);
    setSort('popular');
  };

  const hasActiveFilters =
    selectedCats.size || selectedBrands.size || query.trim() || effectiveMax < priceMax || inStockOnly;

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li>Catalog</li>
        </ul>
      </nav>

      <h2>Product catalog</h2>

      <aside className="filters" aria-labelledby="filters-heading">
        <h3 id="filters-heading">Filters</h3>

        <fieldset>
          <legend>Search</legend>
          <input
            type="search"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products by name"
          />
        </fieldset>

        <fieldset>
          <legend>Category</legend>
          <div className="filter-chips">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`chip${selectedCats.has(c.id) ? ' selected' : ''}`}
                aria-pressed={selectedCats.has(c.id)}
                onClick={() => toggleCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>
            Max price{' '}
            <InfoTip text="Drag the slider to set the highest price you want to see. Results update instantly." />
          </legend>
          <div className="range-row">
            <span>$0</span>
            <strong style={{ marginLeft: 'auto' }}>${effectiveMax}</strong>
          </div>
          <input
            type="range"
            className="range-slider"
            min="0"
            max={priceMax}
            step="50"
            value={effectiveMax}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            aria-label="Maximum price"
          />
        </fieldset>

        <fieldset>
          <legend>Brand</legend>
          {brands.map((b) => (
            <label key={b}>
              <input
                type="checkbox"
                checked={selectedBrands.has(b)}
                onChange={() => toggleBrand(b)}
              />{' '}
              {b}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Availability</legend>
          <label>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />{' '}
            In stock only
          </label>
        </fieldset>

        <button type="button" className="btn-secondary" onClick={resetAll}>
          Reset filters
        </button>
      </aside>

      <section className="results" aria-labelledby="results-heading" aria-live="polite">
        <h3 id="results-heading" className="sr-only">Results</h3>

        <div className="results-bar">
          <span className="results-count">
            <strong>{visible.length}</strong> {visible.length === 1 ? 'product' : 'products'} found
            {selectedCats.size === 1 && ` in ${categories.find((c) => selectedCats.has(c.id))?.label}`}
          </span>
          <div className="sort-inline">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="active-filters">
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Active:</span>
            {query.trim() && (
              <button className="chip selected" onClick={() => setQuery('')}>
                “{query.trim()}” ×
              </button>
            )}
            {[...selectedCats].map((c) => (
              <button key={c} className="chip selected" onClick={() => toggleCat(c)}>
                {categories.find((x) => x.id === c)?.label || c} ×
              </button>
            ))}
            {[...selectedBrands].map((b) => (
              <button key={b} className="chip selected" onClick={() => toggleBrand(b)}>
                {b} ×
              </button>
            ))}
            {effectiveMax < priceMax && (
              <button className="chip selected" onClick={() => setMaxPrice(priceMax)}>
                ≤ ${effectiveMax} ×
              </button>
            )}
            {inStockOnly && (
              <button className="chip selected" onClick={() => setInStockOnly(false)}>
                In stock ×
              </button>
            )}
          </div>
        ) : null}

        <div className="product-grid">
          {loading ? (
            <div className="empty-state">
              <h3>Loading catalog…</h3>
              <p>Fetching products from the database.</p>
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <h3>Could not load the catalog</h3>
              <p>{loadError}</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try widening your price range or clearing some filters.</p>
              <button type="button" style={{ marginTop: 'var(--space-3)' }} onClick={resetAll}>
                Clear all filters
              </button>
            </div>
          ) : (
            visible.map((p) => <ProductCard key={p.id} product={p} onQuickView={setQuickView} />)
          )}
        </div>
      </section>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
