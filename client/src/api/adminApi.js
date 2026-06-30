// Виклики адмін-API (/api/admin/*) через спільний fetch-клієнт.
// До кожного запиту автоматично додається заголовок Authorization: Bearer <token>
// (див. api/client.js). Усі ендпоінти на сервері захищені requireAuth + requireAdmin,
// тому без admin-токена повертається 401/403.
import { api } from './client';

export const adminApi = {
  // Dashboard
  stats: () => api.get('/api/admin/stats'),

  // Products
  listProducts: (search = '') =>
    api.get(`/api/admin/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createProduct: (payload) => api.post('/api/admin/products', payload),
  updateProduct: (id, payload) => api.put(`/api/admin/products/${id}`, payload),
  deleteProduct: (id) => api.del(`/api/admin/products/${id}`),

  // Categories
  listCategories: () => api.get('/api/admin/categories'),
  createCategory: (payload) => api.post('/api/admin/categories', payload),
  updateCategory: (id, payload) => api.put(`/api/admin/categories/${id}`, payload),
  deleteCategory: (id) => api.del(`/api/admin/categories/${id}`),

  // Orders
  listOrders: (status = '') =>
    api.get(`/api/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getOrder: (id) => api.get(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/api/admin/orders/${id}/status`, { status }),

  // Users
  listUsers: () => api.get('/api/admin/users'),
  updateUserRole: (id, role) => api.patch(`/api/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.del(`/api/admin/users/${id}`),

  // Reviews
  listReviews: (status = '') =>
    api.get(`/api/admin/reviews${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  approveReview: (id) => api.patch(`/api/admin/reviews/${id}/approve`, {}),
  deleteReview: (id) => api.del(`/api/admin/reviews/${id}`),
};

export default adminApi;
