import React, { useState, useEffect } from 'react';
import { inventoryApi, productApi, warehouseApi, supplierApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  PackagePlus,
  Sliders,
  ArrowLeftRight,
  History,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

export const Inventory = () => {
  const { isManager, warehouses, selectedWarehouse, setSelectedWarehouse } = useAuth();
  const [inventoryList, setInventoryList] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Movement History Data
  const [movements, setMovements] = useState([]);

  // Form states
  const [receiptForm, setReceiptForm] = useState({
    supplierId: '',
    warehouseId: '',
    productId: '',
    quantity: 10,
    unitCost: '',
    notes: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    warehouseId: '',
    adjustmentQuantity: '',
    reason: '',
  });

  const [transferForm, setTransferForm] = useState({
    productId: '',
    sourceWarehouseId: '',
    targetWarehouseId: '',
    quantity: 5,
    notes: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProductsAndSuppliers();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [selectedWarehouse, showLowStockOnly]);

  const loadProductsAndSuppliers = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([
        productApi.getAll({ activeOnly: true }),
        supplierApi.getAll(true),
      ]);
      setProducts(prodRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      if (showLowStockOnly) {
        const res = await inventoryApi.getLowStock();
        setInventoryList(res.data || []);
      } else {
        const res = await inventoryApi.getInventory(selectedWarehouse?.id || undefined);
        setInventoryList(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovementHistory = async () => {
    try {
      const res = await inventoryApi.getMovements({
        warehouseId: selectedWarehouse?.id || undefined,
      });
      setMovements(res.data || []);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Submit Stock Receipt
  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await inventoryApi.recordReceipt({
        supplierId: parseInt(receiptForm.supplierId, 10),
        warehouseId: parseInt(receiptForm.warehouseId, 10),
        notes: receiptForm.notes,
        items: [
          {
            productId: parseInt(receiptForm.productId, 10),
            quantity: parseInt(receiptForm.quantity, 10),
            unitCost: receiptForm.unitCost ? parseFloat(receiptForm.unitCost) : null,
          },
        ],
      });
      setSuccessMsg('Stock receipt recorded and inventory balance updated successfully!');
      setIsReceiptModalOpen(false);
      loadInventory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record stock receipt');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Stock Adjustment
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await inventoryApi.adjustStock({
        productId: parseInt(adjustForm.productId, 10),
        warehouseId: parseInt(adjustForm.warehouseId, 10),
        adjustmentQuantity: parseInt(adjustForm.adjustmentQuantity, 10),
        reason: adjustForm.reason,
      });
      setSuccessMsg('Stock adjustment processed and audited successfully!');
      setIsAdjustModalOpen(false);
      loadInventory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Submit Transfer Stock
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await inventoryApi.transferStock({
        productId: parseInt(transferForm.productId, 10),
        sourceWarehouseId: parseInt(transferForm.sourceWarehouseId, 10),
        targetWarehouseId: parseInt(transferForm.targetWarehouseId, 10),
        quantity: parseInt(transferForm.quantity, 10),
        notes: transferForm.notes,
      });
      setSuccessMsg('Inter-warehouse stock transfer completed safely!');
      setIsTransferModalOpen(false);
      loadInventory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Inventory & Warehousing</h1>
          <p>Multi-facility stock tracking, supplier receipts, approved adjustments, and full audit movements.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={loadMovementHistory} className="btn btn-secondary">
            <History size={16} />
            Movement Audit
          </button>
          {isManager && (
            <>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setTransferForm({
                    productId: products[0]?.id || '',
                    sourceWarehouseId: warehouses[0]?.id || '',
                    targetWarehouseId: warehouses[1]?.id || '',
                    quantity: 5,
                    notes: 'Rebalancing inventory',
                  });
                  setIsTransferModalOpen(true);
                }}
                className="btn btn-secondary"
              >
                <ArrowLeftRight size={16} />
                Transfer Stock
              </button>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setAdjustForm({
                    productId: products[0]?.id || '',
                    warehouseId: selectedWarehouse?.id || warehouses[0]?.id || '',
                    adjustmentQuantity: -1,
                    reason: 'Physical recount variance',
                  });
                  setIsAdjustModalOpen(true);
                }}
                className="btn btn-secondary"
              >
                <Sliders size={16} />
                Adjust Stock
              </button>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setReceiptForm({
                    supplierId: suppliers[0]?.id || '',
                    warehouseId: selectedWarehouse?.id || warehouses[0]?.id || '',
                    productId: products[0]?.id || '',
                    quantity: 25,
                    unitCost: '',
                    notes: 'Standard supplier PO delivery',
                  });
                  setIsReceiptModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <PackagePlus size={16} />
                Record Supplier Receipt
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--color-success)', fontSize: '0.875rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>VIEW FACILITY:</span>
          <select
            value={selectedWarehouse?.id || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setSelectedWarehouse(null);
              } else {
                const wh = warehouses.find((w) => w.id === Number(val));
                if (wh) setSelectedWarehouse(wh);
              }
            }}
            className="form-select"
            style={{ width: 260 }}
          >
            <option value="">All Warehouses Combined</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`btn ${showLowStockOnly ? 'btn-danger' : 'btn-secondary'} btn-sm`}
        >
          <AlertTriangle size={15} />
          {showLowStockOnly ? 'Showing Low Stock Alerts Only' : 'Filter Low Stock SKUs'}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product & SKU</th>
              <th>Category</th>
              <th>Facility / Warehouse</th>
              <th>Available Stock</th>
              <th>Threshold</th>
              <th>Valuation</th>
              <th>Stock Status</th>
              {isManager && <th style={{ textAlign: 'right' }}>Quick Adjust</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  Loading warehouse inventory...
                </td>
              </tr>
            ) : inventoryList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                  No inventory records found for this facility.
                </td>
              </tr>
            ) : (
              inventoryList.map((inv) => {
                const isLow = inv.lowStock || inv.quantityAvailable <= inv.minimumStock;
                const valuation = (inv.unitPrice || 0) * inv.quantityAvailable;
                return (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.productName}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{inv.sku}</div>
                    </td>
                    <td>{inv.categoryName || 'General'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <WarehouseIcon size={14} color="var(--text-dim)" />
                        <span style={{ fontWeight: 500 }}>{inv.warehouseName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({inv.warehouseCode})</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: isLow ? 'var(--color-warning)' : 'var(--text-main)' }}>
                        {inv.quantityAvailable} units
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{inv.minimumStock} units</td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      {inv.quantityAvailable === 0 ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Low Stock Alert</Badge>
                      ) : (
                        <Badge variant="success">Well Stocked</Badge>
                      )}
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setAdjustForm({
                              productId: inv.productId,
                              warehouseId: inv.warehouseId,
                              adjustmentQuantity: 5,
                              reason: 'Restocking adjustment',
                            });
                            setIsAdjustModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <Sliders size={13} />
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 1. Modal: Record Stock Receipt */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Record Incoming Supplier Delivery"
        footer={
          <>
            <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="receipt-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Confirm Delivery & Increase Stock'}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        <form id="receipt-form" onSubmit={handleReceiptSubmit}>
          <div className="form-group">
            <label className="form-label">Authorized Supplier *</label>
            <select
              className="form-select"
              required
              value={receiptForm.supplierId}
              onChange={(e) => setReceiptForm({ ...receiptForm, supplierId: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactPerson})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Destination Warehouse *</label>
              <select
                className="form-select"
                required
                value={receiptForm.warehouseId}
                onChange={(e) => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Delivered Product SKU *</label>
              <select
                className="form-select"
                required
                value={receiptForm.productId}
                onChange={(e) => setReceiptForm({ ...receiptForm, productId: e.target.value })}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Quantity Received *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                required
                value={receiptForm.quantity}
                onChange={(e) => setReceiptForm({ ...receiptForm, quantity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Cost (₹ optional)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={receiptForm.unitCost}
                onChange={(e) => setReceiptForm({ ...receiptForm, unitCost: e.target.value })}
                placeholder="Optional purchase cost"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Notes / Consignment Number</label>
            <input
              type="text"
              className="form-input"
              value={receiptForm.notes}
              onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
              placeholder="e.g. PO-78901 Airway Bill #5524"
            />
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Stock Adjustment */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Record Approved Stock Adjustment"
        footer={
          <>
            <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="adjust-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        <form id="adjust-form" onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Product SKU *</label>
            <select
              className="form-select"
              required
              value={adjustForm.productId}
              onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Facility *</label>
              <select
                className="form-select"
                required
                value={adjustForm.warehouseId}
                onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Adjustment Quantity (+ or -) *</label>
              <input
                type="number"
                className="form-input"
                required
                value={adjustForm.adjustmentQuantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentQuantity: e.target.value })}
                placeholder="e.g. -2 for damaged, +5 for count variance"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mandatory Audit Reason *</label>
            <input
              type="text"
              className="form-input"
              required
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              placeholder="e.g. Two damaged units during warehouse inspection"
            />
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Inter-Warehouse Transfer */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Inter-Warehouse Stock Transfer"
        footer={
          <>
            <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="transfer-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Transferring...' : 'Execute Atomic Transfer'}
            </button>
          </>
        }
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        <form id="transfer-form" onSubmit={handleTransferSubmit}>
          <div className="form-group">
            <label className="form-label">Product to Transfer *</label>
            <select
              className="form-select"
              required
              value={transferForm.productId}
              onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Source Warehouse *</label>
              <select
                className="form-select"
                required
                value={transferForm.sourceWarehouseId}
                onChange={(e) => setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Warehouse *</label>
              <select
                className="form-select"
                required
                value={transferForm.targetWarehouseId}
                onChange={(e) => setTransferForm({ ...transferForm, targetWarehouseId: e.target.value })}
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
            <label className="form-label">Quantity to Move *</label>
            <input
              type="number"
              min="1"
              className="form-input"
              required
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transfer Reference / Logistics Notes</label>
            <input
              type="text"
              className="form-input"
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="e.g. Internal dispatch truck #DL-12-8821"
            />
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Movement History Audit Drawer */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Inventory Movement Audit Trail"
        maxWidth="850px"
        footer={
          <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="btn btn-secondary">
            Close
          </button>
        }
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>New Stock</th>
                <th>Reference / Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
                    No movement records logged for this facility yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.product?.sku}</td>
                    <td>{m.warehouse?.code}</td>
                    <td>
                      <Badge variant={m.movementType.includes('CONFIRM') ? 'info' : m.movementType.includes('RECEIPT') ? 'success' : 'purple'}>
                        {m.movementType}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 700, color: m.quantityChange > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.resultingQuantity}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>{m.reason}</div>
                      {m.referenceNumber && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ref: {m.referenceNumber}</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
