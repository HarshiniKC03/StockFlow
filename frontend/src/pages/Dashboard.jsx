import React, { useState, useEffect } from 'react';
import { reportApi, orderApi, inventoryApi } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export const Dashboard = ({ setActivePage }) => {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, ordersRes, lowStockRes] = await Promise.all([
        reportApi.getDashboard(),
        orderApi.getAll(),
        inventoryApi.getLowStock(),
      ]);

      setMetrics(metricsRes.data);
      setRecentOrders((ordersRes.data || []).slice(0, 6));
      setLowStockItems(lowStockRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <div className="page-body">
      {/* Top Banner / Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Operational Overview</h1>
          <p>Real-time telemetry on multi-warehouse inventory, pending orders, and logistics.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={loadDashboardData} className="btn btn-secondary" title="Refresh Telemetry">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={() => setActivePage('orders')} className="btn btn-primary">
            <Plus size={16} />
            Create Customer Order
          </button>
        </div>
      </div>

      {/* Low Stock Urgent Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} color="var(--color-warning)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Stock Shortage Warning: {lowStockItems.length} Products Below Minimum Threshold
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Immediate replenishment required to prevent overselling on pending sales orders.
              </div>
            </div>
          </div>
          <button onClick={() => setActivePage('inventory')} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--color-warning)' }}>
            Inspect & Restock
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="metric-grid">
        <MetricCard
          title="Active Products"
          value={metrics?.totalActiveProducts || 0}
          subtitle="Catalog SKUs ready for sale"
          icon={Boxes}
          color="blue"
        />
        <MetricCard
          title="Total Stock Units"
          value={metrics?.totalStockUnits?.toLocaleString() || 0}
          subtitle={`Across ${metrics?.totalWarehouses || 0} distribution hubs`}
          icon={PackageCheck}
          color="emerald"
        />
        <MetricCard
          title="Low Stock Products"
          value={metrics?.lowStockCount || 0}
          subtitle="At or below minimum threshold"
          icon={AlertTriangle}
          color="amber"
        />
        <MetricCard
          title="Customer Orders"
          value={metrics?.totalOrders || 0}
          subtitle={`${metrics?.confirmedOrders || 0} confirmed, ${metrics?.deliveredOrders || 0} delivered`}
          icon={ShoppingCart}
          color="purple"
        />
        <MetricCard
          title="Total Gross Revenue"
          value={formatCurrency(metrics?.totalRevenue)}
          subtitle="Excludes cancelled transactions"
          icon={IndianRupee}
          color="emerald"
        />
        <MetricCard
          title="Inventory Valuation"
          value={formatCurrency(metrics?.totalInventoryValuation)}
          subtitle="Total asset value at current prices"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Dual Section: Orders by Status & Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginTop: 12 }}>
        {/* Status Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Orders Lifecycle Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {metrics?.ordersByStatus &&
              Object.entries(metrics.ordersByStatus).map(([status, count]) => {
                const total = metrics.totalOrders || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{status}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} orders ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 7, borderRadius: 4, backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor:
                            status === 'DELIVERED'
                              ? 'var(--color-success)'
                              : status === 'CONFIRMED'
                              ? 'var(--accent-primary)'
                              : status === 'CANCELLED'
                              ? 'var(--color-danger)'
                              : status === 'PROCESSING'
                              ? 'var(--color-warning)'
                              : 'var(--color-purple)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Recent Customer Orders</h3>
            <button onClick={() => setActivePage('orders')} className="btn btn-secondary btn-sm">
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>
                      No recent orders recorded
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <Badge variant={order.status}>{order.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
