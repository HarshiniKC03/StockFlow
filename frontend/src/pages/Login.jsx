import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, ShieldCheck, UserCheck, ShoppingBag, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Glows */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 36,
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
              marginBottom: 16,
            }}
          >
            <Layers size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Sign in to Stock<span style={{ color: 'var(--accent-primary)' }}>Flow</span>
          </h2>
          <p style={{ fontSize: '0.85rem' }}>Full-Stack Enterprise Inventory & Order Platform</p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Corporate Email</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="e.g. admin or manager"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Enter System'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Roles Quick-Select */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            Quick Demo Accounts (1-Click Switch)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '10px 6px', gap: 4 }}
            >
              <ShieldCheck size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('manager', 'manager123')}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '10px 6px', gap: 4 }}
            >
              <UserCheck size={16} color="var(--color-success)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Manager</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('sales', 'sales123')}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '10px 6px', gap: 4 }}
            >
              <ShoppingBag size={16} color="var(--color-purple)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
