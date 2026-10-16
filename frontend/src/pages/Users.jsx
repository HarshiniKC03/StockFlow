import React, { useState, useEffect } from 'react';
import { userApi } from '../api/client';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { UserPlus, ShieldAlert, CheckCircle2, User, Key, Mail, AlertCircle } from 'lucide-react';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    roles: ['ROLE_SALES_EMPLOYEE'],
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAll();
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setErrorMsg('');
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      roles: ['ROLE_SALES_EMPLOYEE'],
    });
    setIsModalOpen(true);
  };

  const handleToggleRole = (role) => {
    const exists = formData.roles.includes(role);
    if (exists) {
      if (formData.roles.length === 1) return; // at least one role required
      setFormData({ ...formData, roles: formData.roles.filter((r) => r !== role) });
    } else {
      setFormData({ ...formData, roles: [...formData.roles, role] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await userApi.create(formData);
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await userApi.toggleActive(id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle active status');
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>User & Access Management</h1>
          <p>Administrator control panel for employee accounts, credential issuance, and role boundaries.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <UserPlus size={16} />
          Create Employee Account
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Email</th>
              <th>Assigned Roles</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  Loading employee records...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {(u.fullName || u.username)[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {u.username}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Array.from(u.roles || []).map((r) => (
                        <Badge key={r} variant={r.includes('ADMIN') ? 'danger' : r.includes('MANAGER') ? 'success' : 'purple'}>
                          {r.replace('ROLE_', '')}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge variant={u.active ? 'success' : 'danger'}>
                      {u.active ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleActive(u.id, u.active)}
                      className={`btn ${u.active ? 'btn-outline-danger' : 'btn-secondary'} btn-sm`}
                      disabled={u.username === 'admin'}
                      title={u.username === 'admin' ? 'Primary admin cannot be disabled' : 'Toggle status'}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Employee Account"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="user-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register User'}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        <form id="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Employee Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Vikram Singhania"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Username (Login ID) *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="vsinghania"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Corporate Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vsinghania@stockflow.internal"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password * (At least 6 chars)</label>
            <input
              type="password"
              className="form-input"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role Permissions * (Check all that apply)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                { role: 'ROLE_SALES_EMPLOYEE', label: 'Sales Employee', desc: 'Can create and view customer orders' },
                { role: 'ROLE_INVENTORY_MANAGER', label: 'Inventory Manager', desc: 'Can manage stock, adjust quantities, register deliveries' },
                { role: 'ROLE_ADMIN', label: 'Administrator', desc: 'Full system privileges, user administration, audit logs' },
              ].map((r) => (
                <label
                  key={r.role}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(r.role)}
                    onChange={() => handleToggleRole(r.role)}
                    style={{ marginTop: 4 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
