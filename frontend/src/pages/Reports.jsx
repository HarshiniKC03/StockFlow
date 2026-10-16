import React, { useState, useEffect } from 'react';
import { reportApi, inventoryApi, orderApi, warehouseApi } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  IndianRupee,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';

export const Reports = () => {
  const [metrics, setMetrics] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingInventory, setExportingInventory] = useState(false);
  const [exportingOrders, setExportingOrders] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  useEffect(() => {
    loadAllReportData();
  }, []);

  const loadAllReportData = async () => {
    setLoading(true);
    try {
      const [dashRes, whRes, ordersRes, lowStockRes] = await Promise.all([
        reportApi.getDashboard(),
        warehouseApi.getAll(true),
        orderApi.getAll(),
        inventoryApi.getLowStock(),
      ]);

      setMetrics(dashRes.data);
      setWarehouses(whRes.data || []);
      setRecentOrders(ordersRes.data || []);
      setLowStockCount((lowStockRes.data || []).length);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventoryCsv = async () => {
    setExportingInventory(true);
    setExportSuccess('');
    try {
      const res = await reportApi.exportInventoryCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `StockFlow_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportSuccess('Inventory CSV report generated and downloaded successfully.');
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export inventory CSV. Please check permissions.');
    } finally {
      setExportingInventory(false);
    }
  };

  const handleExportOrdersCsv = async () => {
    setExportingOrders(true);
    setExportSuccess('');
    try {
      const res = await reportApi.exportOrdersCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `StockFlow_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportSuccess('Orders CSV report generated and downloaded successfully.');
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export orders CSV. Please check permissions.');
    } finally {
      setExportingOrders(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const fulfillmentRate =
    metrics?.totalOrders > 0
      ? Math.round(((metrics?.deliveredOrders || 0) / metrics.totalOrders) * 100)
      : 100;

  return (
    <div className="page-body">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileBarChart color="var(--accent-primary)" size={28} />
            Enterprise Reports & Operational Telemetry
          </h1>
          <p>
            Audit-ready business intelligence, stock valuations, fulfillment metrics, and automated CSV ledger exports.
          </p>
        </div>
        <button
          onClick={loadAllReportData}
          className="btn btn-secondary"
          title="Refresh Metrics"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Metrics
        </button>
      </div>

      {exportSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.9rem',
          }}
        >
          <CheckCircle2 size={18} />
          {exportSuccess}
        </div>
      )}

      {/* KPI Metrics Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <MetricCard
          title="Total Stock Valuation"
          value={formatCurrency(metrics?.totalInventoryValuation)}
          subtitle="Estimated on current unit prices"
          icon={IndianRupee}
          color="accent"
        />
        <MetricCard
          title="Gross Order Sales"
          value={formatCurrency(metrics?.totalSalesValue)}
          subtitle={`${metrics?.totalOrders || 0} lifetime orders logged`}
          icon={TrendingUp}
          color="success"
        />
        <MetricCard
          title="Active Stock Units"
          value={(metrics?.totalInventoryItems || 0).toLocaleString()}
          subtitle="Across all registered warehouses"
          icon={Boxes}
          color="info"
        />
        <MetricCard
          title="Fulfillment Success"
          value={`${fulfillmentRate}%`}
          subtitle={`${metrics?.deliveredOrders || 0} delivered safely`}
          icon={ShoppingCart}
          color="purple"
        />
      </div>

      {/* Export Ledger Center */}
      <div
        className="card"
        style={{
          marginBottom: 28,
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%)',
          border: '1px solid var(--border-accent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              padding: 10,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-primary)',
            }}
          >
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', marginBottom: 2 }}>Export Operational Records & Audit Ledgers</h2>
            <p style={{ fontSize: '0.85rem' }}>
              Download cryptographically traceable, RFC-4180 standard CSV files for offline accounting, ERP sync, or compliance.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
            marginTop: 12,
          }}
        >
          {/* Inventory Export Box */}
          <div
            style={{
              padding: 18,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Boxes size={18} color="var(--accent-primary)" />
                Comprehensive Inventory Ledger
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 16 }}>
                Contains item SKU, product name, category, warehouse location, quantity on hand, unit cost, total valuation, and replenishment status.
              </p>
            </div>
            <button
              onClick={handleExportInventoryCsv}
              disabled={exportingInventory}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Download size={16} />
              {exportingInventory ? 'Generating CSV...' : 'Download Inventory CSV'}
            </button>
          </div>

          {/* Orders Export Box */}
          <div
            style={{
              padding: 18,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={18} color="var(--color-success)" />
                Sales & Customer Orders Ledger
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 16 }}>
                Contains order tracking number, customer info, order timestamps, status lifecycle transitions, item line counts, and calculated totals.
              </p>
            </div>
            <button
              onClick={handleExportOrdersCsv}
              disabled={exportingOrders}
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'var(--border-accent)' }}
            >
              <Download size={16} />
              {exportingOrders ? 'Generating CSV...' : 'Download Orders CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Operational Breakdown Tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 24,
        }}
      >
        {/* Warehouse Network Distribution */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <WarehouseIcon size={18} color="var(--accent-primary)" />
              Facility Network Distribution
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{warehouses.length} Active Hubs</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => (
                  <tr key={wh.id}>
                    <td style={{ fontWeight: 600 }}>{wh.name}</td>
                    <td>
                      <span className="code-badge">{wh.code}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{wh.location || 'Hub'}</td>
                    <td>
                      <Badge variant={wh.active ? 'success' : 'danger'}>
                        {wh.active ? 'Operational' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Lifecycle Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--color-purple)" />
              Order Pipeline Distribution
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Total: {metrics?.totalOrders || 0}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="warning">PENDING</Badge>
                <span style={{ fontSize: '0.85rem' }}>Awaiting Confirmation & Stock Deduction</span>
              </div>
              <span style={{ fontWeight: 700 }}>{metrics?.pendingOrders || 0}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="info">PROCESSING</Badge>
                <span style={{ fontSize: '0.85rem' }}>Stock Reserved & Warehouse Pick-Pack</span>
              </div>
              <span style={{ fontWeight: 700 }}>{metrics?.processingOrders || 0}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="purple">SHIPPED</Badge>
                <span style={{ fontSize: '0.85rem' }}>En-Route with Freight Carrier</span>
              </div>
              <span style={{ fontWeight: 700 }}>{metrics?.shippedOrders || 0}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="success">DELIVERED</Badge>
                <span style={{ fontSize: '0.85rem' }}>Fulfilled Customer Handover</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{metrics?.deliveredOrders || 0}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge variant="danger">CANCELLED</Badge>
                <span style={{ fontSize: '0.85rem' }}>Voided with Stock Rolled Back</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{metrics?.cancelledOrders || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
