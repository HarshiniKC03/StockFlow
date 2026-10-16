import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/client';
import { Bell, Sun, Moon, LogOut, Warehouse as WarehouseIcon, CheckCircle2, AlertTriangle, Package, Check } from 'lucide-react';
import { Badge } from './Badge';

export const Navbar = () => {
  const { user, logout, warehouses, selectedWarehouse, setSelectedWarehouse, theme, toggleTheme } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // poll alerts every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getUnread();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleDisplayName = () => {
    const roles = user?.roles || [];
    if (roles.includes('ROLE_ADMIN')) return 'Administrator';
    if (roles.includes('ROLE_INVENTORY_MANAGER')) return 'Inventory Manager';
    if (roles.includes('ROLE_SALES_EMPLOYEE')) return 'Sales Employee';
    return 'User';
  };

  return (
    <header className="navbar">
      {/* Warehouse Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <WarehouseIcon size={18} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>FACILITY:</span>
        <select
          value={selectedWarehouse?.id || ''}
          onChange={(e) => {
            const wh = warehouses.find((w) => w.id === Number(e.target.value));
            if (wh) setSelectedWarehouse(wh);
          }}
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
        >
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.code} - {wh.name}
            </option>
          ))}
        </select>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-secondary"
            style={{ padding: '8px', position: 'relative', borderRadius: '50%' }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: 'var(--color-danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 45,
                width: 360,
                maxHeight: 450,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                  <Badge variant="info">{unreadCount} New</Badge>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: 'var(--color-success)', opacity: 0.6 }} />
                    All operational alerts cleared
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ marginTop: 2 }}>
                        {n.type === 'LOW_STOCK' && <AlertTriangle size={16} color="var(--color-warning)" />}
                        {n.type === 'ORDER_CONFIRMATION' && <Package size={16} color="var(--accent-primary)" />}
                        {n.type === 'SUPPLIER_RECEIPT' && <CheckCircle2 size={16} color="var(--color-success)" />}
                        {n.type === 'ORDER_CANCELLATION' && <AlertTriangle size={16} color="var(--color-danger)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 4 }}
                        title="Dismiss"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '8px', borderRadius: '50%' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Role Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.fullName || user?.username}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{getRoleDisplayName()}</div>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'white',
            }}
          >
            {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px', color: 'var(--color-danger)' }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
