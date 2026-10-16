import React, { useState, useEffect } from 'react';
import { orderApi, productApi, warehouseApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  CheckCheck,
  Ban,
  Trash2,
  AlertCircle,
  ShoppingCart,
  User,
} from 'lucide-react';

export const Orders = () => {
  const { isManager, warehouses, selectedWarehouse } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState(null);

  // New Order Form State
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    warehouseId: '',
    autoConfirm: true,
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, selectedWarehouse]);

  const loadProducts = async () => {
    try {
      const res = await productApi.getAll({ activeOnly: true });
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll({
        status: statusFilter || undefined,
        warehouseId: selectedWarehouse?.id || undefined,
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setErrorMsg('');
    const defaultProduct = products[0];
    setOrderForm({
      customerName: 'Global Solutions Ltd',
      customerEmail: 'procurement@globalsolutions.com',
      customerPhone: '+91-9876500000',
      customerAddress: 'Cyber City, Phase 2, Gurugram, India',
      warehouseId: selectedWarehouse?.id || warehouses[0]?.id || '',
      autoConfirm: true,
      items: [
        {
          productId: defaultProduct?.id || '',
          quantity: 2,
          unitPrice: defaultProduct?.unitPrice || 0,
        },
      ],
    });
    setIsCreateModalOpen(true);
  };

  const handleAddItem = () => {
    const defaultProduct = products[0];
    setOrderForm({
      ...orderForm,
      items: [
        ...orderForm.items,
        {
          productId: defaultProduct?.id || '',
          quantity: 1,
          unitPrice: defaultProduct?.unitPrice || 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (orderForm.items.length <= 1) return;
    const newItems = [...orderForm.items];
    newItems.splice(index, 1);
    setOrderForm({ ...orderForm, items: newItems });
  };

  const handleItemProductChange = (index, productId) => {
    const prod = products.find((p) => p.id === Number(productId));
    const newItems = [...orderForm.items];
    newItems[index] = {
      ...newItems[index],
      productId: Number(productId),
      unitPrice: prod?.unitPrice || 0,
    };
    setOrderForm({ ...orderForm, items: newItems });
  };

  const handleItemQuantityChange = (index, quantity) => {
    const newItems = [...orderForm.items];
    newItems[index] = {
      ...newItems[index],
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
    };
    setOrderForm({ ...orderForm, items: newItems });
  };

  const calculateFormTotal = () => {
    return orderForm.items.reduce((acc, item) => {
      return acc + (item.unitPrice || 0) * (item.quantity || 1);
    }, 0);
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        customerName: orderForm.customerName,
        customerEmail: orderForm.customerEmail,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        warehouseId: parseInt(orderForm.warehouseId, 10),
        autoConfirm: orderForm.autoConfirm,
        items: orderForm.items.map((i) => ({
          productId: parseInt(i.productId, 10),
          quantity: parseInt(i.quantity, 10),
        })),
      };

      await orderApi.create(payload);
      setIsCreateModalOpen(false);
      loadOrders();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create customer order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (id) => {
    try {
      await orderApi.confirm(id);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm order');
    }
  };

  const handleProgressStatus = async (id, nextStatus) => {
    try {
      await orderApi.updateStatus(id, nextStatus);
      loadOrders();
      if (selectedOrder && selectedOrder.id === id) {
        const updated = await orderApi.getById(id);
        setSelectedOrder(updated.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleOpenCancelModal = (order) => {
    setCancelOrderId(order.id);
    setCancelReason('');
    setErrorMsg('');
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    try {
      await orderApi.cancel(cancelOrderId, { reason: cancelReason });
      setIsCancelModalOpen(false);
      loadOrders();
      if (selectedOrder && selectedOrder.id === cancelOrderId) {
        setIsDetailsModalOpen(false);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const formatCurrency = (val) => {
    return '₹' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  return (
    <div className="page-body">
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Customer Orders</h1>
          <p>Controlled order lifecycle, stock allocation, and cancellation reversibility.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={16} />
          Create New Order
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>FILTER BY STATUS:</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Warehouse</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  Loading customer orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  No customer orders found matching this filter.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                    {o.orderNumber}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{o.customerEmail || o.customerPhone}</div>
                  </td>
                  <td>{o.warehouseCode || 'Main Hub'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{o.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(o.totalAmount)}</td>
                  <td>
                    <Badge variant={o.status}>{o.status}</Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsDetailsModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Quick State Transitions */}
                      {o.status === 'CREATED' && isManager && (
                        <button
                          onClick={() => handleConfirmOrder(o.id)}
                          className="btn btn-primary btn-sm"
                          title="Confirm & Deduct Stock"
                        >
                          Confirm
                        </button>
                      )}

                      {o.status === 'CONFIRMED' && isManager && (
                        <button
                          onClick={() => handleProgressStatus(o.id, 'PROCESSING')}
                          className="btn btn-secondary btn-sm"
                          title="Begin Processing"
                        >
                          <Clock size={14} />
                        </button>
                      )}

                      {o.status === 'PROCESSING' && isManager && (
                        <button
                          onClick={() => handleProgressStatus(o.id, 'SHIPPED')}
                          className="btn btn-secondary btn-sm"
                          title="Dispatch & Ship"
                        >
                          <Truck size={14} />
                        </button>
                      )}

                      {o.status === 'SHIPPED' && isManager && (
                        <button
                          onClick={() => handleProgressStatus(o.id, 'DELIVERED')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-success)' }}
                          title="Mark Delivered"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}

                      {/* Cancellation */}
                      {['CREATED', 'CONFIRMED', 'PROCESSING'].includes(o.status) && (
                        <button
                          onClick={() => handleOpenCancelModal(o)}
                          className="btn btn-outline-danger btn-sm"
                          title="Cancel Order"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 1. Modal: Create Order */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Customer Order"
        maxWidth="750px"
        footer={
          <>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="order-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Placing Order...' : `Place Order (${formatCurrency(calculateFormTotal())})`}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        <form id="order-form" onSubmit={handleCreateOrderSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Customer / Client Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={orderForm.customerName}
                onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                placeholder="e.g. Alpha Enterprise Solutions"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Corporate Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={orderForm.customerEmail}
                onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                placeholder="procurement@alphaent.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-input"
                value={orderForm.customerPhone}
                onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                placeholder="+91-9871112233"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fulfillment Warehouse *</label>
              <select
                className="form-select"
                required
                value={orderForm.warehouseId}
                onChange={(e) => setOrderForm({ ...orderForm, warehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Shipping / Delivery Address</label>
            <input
              type="text"
              className="form-input"
              value={orderForm.customerAddress}
              onChange={(e) => setOrderForm({ ...orderForm, customerAddress: e.target.value })}
              placeholder="e.g. DLF Cyber City, Tower B, Gurugram"
            />
          </div>

          {/* Dynamic Line Items Section */}
          <div style={{ marginTop: 20, marginBottom: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Order Line Items</span>
              <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                <Plus size={14} /> Add Product Line
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orderForm.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1.5fr 40px',
                    gap: 12,
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    padding: 10,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <select
                    className="form-select"
                    value={item.productId}
                    onChange={(e) => handleItemProductChange(idx, e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name} (₹{p.unitPrice})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                    placeholder="Qty"
                  />

                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>
                    {formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: 6, color: 'var(--color-danger)' }}
                    disabled={orderForm.items.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Total calculation indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '12px 16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Estimated Server Total:</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                {formatCurrency(calculateFormTotal())}
              </span>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', marginTop: 10 }}>
            <input
              type="checkbox"
              checked={orderForm.autoConfirm}
              onChange={(e) => setOrderForm({ ...orderForm, autoConfirm: e.target.checked })}
            />
            <span>Auto-confirm order immediately & allocate warehouse inventory (Pessimistic lock protected)</span>
          </label>
        </form>
      </Modal>

      {/* 2. Modal: Order Details */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber || ''}`}
        maxWidth="700px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              {selectedOrder && ['CREATED', 'CONFIRMED', 'PROCESSING'].includes(selectedOrder.status) && (
                <button
                  onClick={() => handleOpenCancelModal(selectedOrder)}
                  className="btn btn-outline-danger btn-sm"
                >
                  Cancel Order
                </button>
              )}
            </div>
            <button onClick={() => setIsDetailsModalOpen(false)} className="btn btn-secondary">
              Close
            </button>
          </div>
        }
      >
        {selectedOrder && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Order Status</span>
                <div style={{ marginTop: 4 }}>
                  <Badge variant={selectedOrder.status}>{selectedOrder.status}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Total Amount</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="var(--accent-primary)" /> Customer Information
              </div>
              <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                <div><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</div>
                <div><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</div>
                <div><strong>Facility:</strong> {selectedOrder.warehouseName} ({selectedOrder.warehouseCode})</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {selectedOrder.customerAddress || 'N/A'}</div>
              </div>
            </div>

            {selectedOrder.cancellationReason && (
              <div style={{ padding: 12, backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                <strong style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>Cancellation Reason:</strong>
                <div style={{ fontSize: '0.825rem', marginTop: 4 }}>{selectedOrder.cancellationReason}</div>
              </div>
            )}

            <h4>Line Items Snapshot</h4>
            <table className="data-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Snapshot Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((it) => (
                  <tr key={it.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{it.sku}</td>
                    <td>{it.productName}</td>
                    <td>{formatCurrency(it.unitPrice)}</td>
                    <td>{it.quantity}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* 3. Modal: Cancel Order */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Customer Order"
        footer={
          <>
            <button type="button" onClick={() => setIsCancelModalOpen(false)} className="btn btn-secondary">
              Dismiss
            </button>
            <button type="submit" form="cancel-form" className="btn btn-danger">
              Confirm Order Cancellation
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        <form id="cancel-form" onSubmit={handleCancelSubmit}>
          <p style={{ marginBottom: 14 }}>
            Cancelling this order will release allocated stock back into warehouse inventory and log an audit movement.
          </p>
          <div className="form-group">
            <label className="form-label">Mandatory Cancellation Reason *</label>
            <textarea
              className="form-textarea"
              required
              rows="3"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation due to corporate budget freeze..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
