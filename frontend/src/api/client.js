import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized calls
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto logout on login endpoint failure
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
        window.location.href = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
};

export const productApi = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export const categoryApi = {
  getAll: (activeOnly = false) => apiClient.get('/categories', { params: { activeOnly } }),
  getById: (id) => apiClient.get(`/categories/${id}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  toggleActive: (id) => apiClient.patch(`/categories/${id}/toggle-active`),
};

export const supplierApi = {
  getAll: (activeOnly = false) => apiClient.get('/suppliers', { params: { activeOnly } }),
  getById: (id) => apiClient.get(`/suppliers/${id}`),
  create: (data) => apiClient.post('/suppliers', data),
  update: (id, data) => apiClient.put(`/suppliers/${id}`, data),
  toggleActive: (id) => apiClient.patch(`/suppliers/${id}/toggle-active`),
};

export const warehouseApi = {
  getAll: (activeOnly = false) => apiClient.get('/warehouses', { params: { activeOnly } }),
  getById: (id) => apiClient.get(`/warehouses/${id}`),
  create: (data) => apiClient.post('/warehouses', data),
  update: (id, data) => apiClient.put(`/warehouses/${id}`, data),
  toggleActive: (id) => apiClient.patch(`/warehouses/${id}/toggle-active`),
};

export const inventoryApi = {
  getInventory: (warehouseId) => apiClient.get('/inventory', { params: { warehouseId } }),
  getLowStock: () => apiClient.get('/inventory/low-stock'),
  getMovements: (params) => apiClient.get('/inventory/movements', { params }),
  recordReceipt: (data) => apiClient.post('/inventory/receipts', data),
  adjustStock: (data) => apiClient.post('/inventory/adjust', data),
  transferStock: (params) => apiClient.post('/inventory/transfer', null, { params }),
};

export const orderApi = {
  getAll: (params) => apiClient.get('/orders', { params }),
  getById: (id) => apiClient.get(`/orders/${id}`),
  getByNumber: (number) => apiClient.get(`/orders/number/${number}`),
  create: (data) => apiClient.post('/orders', data),
  confirm: (id) => apiClient.post(`/orders/${id}/confirm`),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, null, { params: { status } }),
  cancel: (id, data) => apiClient.post(`/orders/${id}/cancel`, data),
};

export const reportApi = {
  getDashboard: () => apiClient.get('/reports/dashboard'),
  exportInventoryCsv: () => apiClient.get('/reports/inventory/csv', { responseType: 'blob' }),
  exportOrdersCsv: () => apiClient.get('/reports/orders/csv', { responseType: 'blob' }),
};

export const userApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  toggleActive: (id) => apiClient.patch(`/users/${id}/toggle-active`),
};

export const auditApi = {
  getLogs: (params) => apiClient.get('/audit-logs', { params }),
};

export const notificationApi = {
  getAll: () => apiClient.get('/notifications'),
  getUnread: () => apiClient.get('/notifications/unread'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};

export default apiClient;
