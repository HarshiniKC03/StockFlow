import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  PackageCheck,
  ShoppingCart,
  Truck,
  Users,
  FileBarChart,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Boxes },
    { id: 'inventory', label: 'Inventory', icon: PackageCheck },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'suppliers-categories', label: 'Suppliers & Categories', icon: Truck },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
    ...(isAdmin ? [{ id: 'audit-logs', label: 'Audit Trail', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div
        style={{
          height: 70,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
          }}
        >
          <Layers size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>
            Stock<span style={{ color: 'var(--accent-primary)' }}>Flow</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Enterprise v1.0
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: '20px 14px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', padding: '0 12px 10px', letterSpacing: '0.05em' }}>
          Operations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Icon size={19} color={isActive ? '#ffffff' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Status Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>System Online • MySQL / H2</span>
      </div>
    </aside>
  );
};
