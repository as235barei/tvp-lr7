import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import { money } from './helpers';

const EMPTY = { title: '', brand: '', category_id: '', price: '', stock: '', description: '', image_url: '/placeholder.png' };

// Керування товарами: таблиця + модалка створення/редагування + видалення з
// підтвердженням. Усі дії йдуть у реальну БД через /api/admin/products.
export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const [{ products: list }, { categories: cats }] = await Promise.all([
        adminApi.listProducts(q),
        adminApi.listCategories(),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      toast.error(err.message, { title: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const categoryName = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id || '' });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title, brand: p.brand, category_id: p.category_id,
      price: p.price, stock: p.stock, description: p.description || '',
      image_url: p.image_url || '/placeholder.png',
    });
    setErrors({});
    setFormOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.title || form.title.trim().length < 2) e.title = 'Title is required (min 2 chars)';
    if (!form.brand || !form.brand.trim()) e.brand = 'Brand is required';
    if (!form.category_id) e.category_id = 'Category is required';
    if (form.price === '' || Number(form.price) < 0) e.price = 'Price must be ≥ 0';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Stock must be an integer ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      brand: form.brand.trim(),
      category_id: Number(form.category_id),
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description.trim(),
      image_url: form.image_url.trim() || '/placeholder.png',
    };
    try {
      if (editing) {
        await adminApi.updateProduct(editing.id, payload);
        toast.success('Product updated');
      } else {
        await adminApi.createProduct(payload);
        toast.success('Product created');
      }
      setFormOpen(false);
      await load(search);
    } catch (err) {
      toast.error(err.message, { title: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const p = toDelete;
    setToDelete(null);
    try {
      await adminApi.deleteProduct(p.id);
      toast.success(`Deleted “${p.title}”`);
      await load(search);
    } catch (err) {
      toast.error(err.message, { title: 'Delete failed' });
    }
  };

  return (
    <>
      <h2>Manage products</h2>

      <section aria-labelledby="products-heading">
        <h3 id="products-heading">Product list</h3>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); load(search); }}
            style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: 220 }}
          >
            <input
              type="search"
              placeholder="Search by title or brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <button type="button" onClick={openCreate}>+ Add product</button>
        </div>

        {loading ? <p>Loading…</p> : (
          <table>
            <caption>{products.length} product(s) in the catalog</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Title</th>
                <th scope="col">Brand</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.brand}</td>
                  <td>{p.category_name || categoryName[p.category_id]}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button type="button" className="btn-secondary" onClick={() => openEdit(p)}>Edit</button>{' '}
                    <button type="button" className="btn-secondary" onClick={() => setToDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Create / edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit product #${editing.id}` : 'Add product'}>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="p-title">Title</label>
          <input id="p-title" type="text" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          {errors.title && <p className="field-error-text" style={{ color: 'crimson' }}>{errors.title}</p>}

          <label htmlFor="p-brand">Brand</label>
          <input id="p-brand" type="text" value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          {errors.brand && <p className="field-error-text" style={{ color: 'crimson' }}>{errors.brand}</p>}

          <label htmlFor="p-cat">Category</label>
          <select id="p-cat" value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">— select —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className="field-error-text" style={{ color: 'crimson' }}>{errors.category_id}</p>}

          <label htmlFor="p-price">Price (USD)</label>
          <input id="p-price" type="number" min="0" step="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} />
          {errors.price && <p className="field-error-text" style={{ color: 'crimson' }}>{errors.price}</p>}

          <label htmlFor="p-stock">Stock</label>
          <input id="p-stock" type="number" min="0" step="1" value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          {errors.stock && <p className="field-error-text" style={{ color: 'crimson' }}>{errors.stock}</p>}

          <label htmlFor="p-img">Image URL</label>
          <input id="p-img" type="text" value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

          <label htmlFor="p-desc">Description</label>
          <textarea id="p-desc" rows="3" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete product?">
        <p>Are you sure you want to delete <strong>{toDelete?.title}</strong>? This action cannot be undone.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={confirmDelete} style={{ background: 'var(--status-cancelled, crimson)', borderColor: 'transparent' }}>Delete</button>
          <button type="button" className="btn-secondary" onClick={() => setToDelete(null)}>Cancel</button>
        </div>
      </Modal>
    </>
  );
}
