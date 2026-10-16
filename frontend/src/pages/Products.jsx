import React, { useState, useEffect } from 'react';
import { productApi, categoryApi, supplierApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Search, Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const Products = () => {
  const { isManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unitPrice: '',
    minimumStock: 10,
    categoryId: '',
    supplierId: '',
    active: true,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategoriesAndSuppliers();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory, activeOnly]);

  const loadCategoriesAndSuppliers = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        categoryApi.getAll(true),
        supplierApi.getAll(true),
      ]);
      setCategories(catRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll({
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        activeOnly: activeOnly || undefined,
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      unitPrice: '',
      minimumStock: 10,
      categoryId: categories[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      unitPrice: product.unitPrice,
      minimumStock: product.minimumStock,
      categoryId: product.categoryId || categories[0]?.id || '',
      supplierId: product.supplierId || '',
      active: product.active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice),
        minimumStock: parseInt(formData.minimumStock, 10),
        categoryId: parseInt(formData.categoryId, 10),
        supplierId: formData.supplierId ? parseInt(formData.supplierId, 10) : null,
        active: formData.active,
      };

      if (editingProduct) {
        await productApi.update(editingProduct.id, payload);
      } else {
        await productApi.create(payload);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate or remove "${name}"? Historical orders will remain preserved.`)) {
      try {
        await productApi.delete(id);
        loadProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Product Catalog</h1>
          <p>Maintain enterprise SKUs, price schedules, and minimum stock safety margins.</p>
        </div>
        {isManager && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={16} />
            Register New SKU
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search product name or SKU (e.g. LAP-1001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 38 }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
            style={{ flex: '0 1 200px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Active Status Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active SKUs only
          </label>
        </div>
      </div>

      {/* Product Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Total Stock</th>
              <th>Safety Threshold</th>
              <th>Status</th>
              {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isManager ? 8 : 7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  Loading product catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={isManager ? 8 : 7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  No products found matching your filter criteria.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLow = p.totalStock <= p.minimumStock;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                      {p.sku}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>{p.description || 'No description'}</div>
                    </td>
                    <td>
                      <Badge variant="info">{p.categoryName || 'General'}</Badge>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{parseFloat(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isLow ? 'var(--color-warning)' : 'var(--color-success)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {p.totalStock} units
                        {isLow && <Badge variant="warning">Low</Badge>}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.minimumStock} units</td>
                    <td>
                      <Badge variant={p.active ? 'success' : 'danger'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="btn btn-outline-danger btn-sm"
                            title="Deactivate or Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Modify Product SKU' : 'Register New Enterprise SKU'}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        {formError && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form id="product-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Business Laptop 15-inch"
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU (Unique) *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. LAP-1001"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Supplier</label>
              <select
                className="form-select"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">No Supplier Assigned</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Unit Price (₹ INR) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="55000.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Safety Stock Level *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                required
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technical Specification / Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide product dimensions, processor specs, package inclusions..."
            />
          </div>

          {editingProduct && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              Product is actively available for ordering
            </label>
          )}
        </form>
      </Modal>
    </div>
  );
};
