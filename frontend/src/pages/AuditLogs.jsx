import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Layers,
  ArrowRight,
  Database,
  Info,
} from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (entityFilter) params.entityName = entityFilter;
      if (userFilter) params.username = userFilter;
      if (actionFilter) params.action = actionFilter;

      const res = await auditApi.getLogs(params);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    loadLogs();
  };

  const handleResetFilter = () => {
    setEntityFilter('');
    setUserFilter('');
    setActionFilter('');
    setTimeout(loadLogs, 0);
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('RECEIPT')) return <Badge variant="success">{action}</Badge>;
    if (act.includes('UPDATE') || act.includes('STATUS')) return <Badge variant="info">{action}</Badge>;
    if (act.includes('ADJUST') || act.includes('TRANSFER')) return <Badge variant="warning">{action}</Badge>;
    if (act.includes('CANCEL') || act.includes('DELETE')) return <Badge variant="danger">{action}</Badge>;
    return <Badge variant="purple">{action}</Badge>;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
            <ShieldCheck color="var(--accent-primary)" size={28} />
            Enterprise Audit Trail & Immutable Log
          </h1>
          <p>
            Track system state transitions, critical stock overrides, order cancellations, and security events.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="btn btn-secondary"
          title="Refresh Log Stream"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Trail
        </button>
      </div>

      {/* Filter Toolbar */}
      <form
        onSubmit={handleApplyFilter}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 24,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: 150 }}
        >
          <option value="">All Entities</option>
          <option value="Product">Product</option>
          <option value="Order">Order</option>
          <option value="Inventory">Inventory</option>
          <option value="Supplier">Supplier</option>
          <option value="Warehouse">Warehouse</option>
          <option value="User">User</option>
        </select>

        <input
          type="text"
          placeholder="Filter by Username..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="form-input"
          style={{ width: 180 }}
        />

        <input
          type="text"
          placeholder="Filter by Action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="form-input"
          style={{ width: 180 }}
        />

        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
          <Search size={15} /> Apply
        </button>

        <button
          type="button"
          onClick={handleResetFilter}
          className="btn btn-secondary"
          style={{ padding: '8px 14px' }}
        >
          Reset
        </button>
      </form>

      {/* Logs Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
            No audit records match the current filters.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>IP Address</th>
                  <th>Audit Details</th>
                  <th>Inspector</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--text-dim)" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <User size={14} color="var(--accent-primary)" />
                        {log.username}
                      </span>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>
                      <span className="code-badge">{log.entityName}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      #{log.entityId || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailsModalOpen(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {isDetailsModalOpen && selectedLog && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Audit Record #${selectedLog.id} — ${selectedLog.action}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                backgroundColor: 'var(--bg-primary)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Actor:</span>{' '}
                <strong>{selectedLog.username}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Timestamp:</span>{' '}
                <strong>{formatTimestamp(selectedLog.timestamp)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Entity:</span>{' '}
                <strong>{selectedLog.entityName}</strong> (#{selectedLog.entityId})
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Origin IP:</span>{' '}
                <strong>{selectedLog.ipAddress || 'Internal Loopback'}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                Summary Details:
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                {selectedLog.details || 'No detailed note provided.'}
              </div>
            </div>

            {/* State Diffs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: 6 }}>
                  Previous State (Before):
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-subtle)',
                    minHeight: 80,
                  }}
                >
                  {selectedLog.previousValue || 'None / N/A'}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: 6 }}>
                  New State (After):
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-subtle)',
                    minHeight: 80,
                  }}
                >
                  {selectedLog.newValue || 'None / N/A'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="btn btn-secondary"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
