import React, { useState, useEffect } from 'react';
import { supplierApi, categoryApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Plus, Edit2, Truck, FolderTree, AlertCircle } from 'lucide-react';

export const SuppliersCategories = () => {
  const { isManager, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('suppliers');

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([supplierApi.getAll(), categoryApi.getAll()]);
      setSuppliers(sRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supplier handlers
  const handleOpenSupplierModal = (supplier = null) => {
    setErrorMsg('');
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier?.name || '',
      contactPerson: supplier?.contactPerson || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      address: supplier?.address || '',
    });
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await supplierApi.update(editingSupplier.id, supplierForm);
      } else {
        await supplierApi.create(supplierForm);
      }
      setIsSupplierModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save supplier details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSupplier = async (id) => {
    try {
      await supplierApi.toggleActive(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle supplier status');
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (category = null) => {
    setErrorMsg('');
    setEditingCategory(category);
    setCategoryForm({
      name: category?.name || '',
      description: category?.description || '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, categoryForm);
      } else {
        await categoryApi.create(categoryForm);
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save category details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCategory = async (id) => {
    try {
      await categoryApi.toggleActive(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle category status');
    }
  };

  return (
    <div className="page-body">
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Suppliers & Classification</h1>
          <p>Vendor registries, contact protocols, and taxonomy categorization.</p>
        </div>
        {isManager && (
          <button
            onClick={() => (activeTab === 'suppliers' ? handleOpenSupplierModal() : handleOpenCategoryModal())}
            className="btn btn-primary"
          >
            <Plus size={16} />
            {activeTab === 'suppliers' ? 'Register New Supplier' : 'Create New Category'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`btn ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Truck size={16} />
          Registered Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FolderTree size={16} />
          Product Categories ({categories.length})
        </button>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'suppliers' ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Primary Contact</th>
                <th>Email Address</th>
                <th>Telephone</th>
                <th>Facility Address</th>
                <th>Status</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.contactPerson || 'N/A'}</td>
                  <td>{s.email || 'N/A'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{s.phone || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.address || 'N/A'}</td>
                  <td>
                    <Badge variant={s.active ? 'success' : 'danger'}>
                      {s.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  {isManager && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button onClick={() => handleOpenSupplierModal(s)} className="btn btn-secondary btn-sm">
                          <Edit2 size={13} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleSupplier(s.id)}
                            className="btn btn-secondary btn-sm"
                            title="Toggle active"
                          >
                            {s.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.description || 'No description provided'}</td>
                  <td>
                    <Badge variant={c.active ? 'success' : 'danger'}>
                      {c.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  {isManager && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button onClick={() => handleOpenCategoryModal(c)} className="btn btn-secondary btn-sm">
                          <Edit2 size={13} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleCategory(c.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
        footer={
          <>
            <button onClick={() => setIsSupplierModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="supplier-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        <form id="supplier-form" onSubmit={handleSupplierSubmit}>
          <div className="form-group">
            <label className="form-label">Supplier Entity Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="e.g. Apex Components Ltd"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                placeholder="Anita Roy"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                className="form-input"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="sales@apexcomp.in"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              placeholder="+91-9811223344"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Office / Warehouse Address</label>
            <textarea
              className="form-textarea"
              rows="2"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="Okhla Phase III, New Delhi, India"
            />
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Product Category'}
        footer={
          <>
            <button onClick={() => setIsCategoryModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="category-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Category'}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        <form id="category-form" onSubmit={handleCategorySubmit}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g. Networking Hardware"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Routers, switches, optical cables..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
