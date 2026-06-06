import React, { useEffect, useState } from 'react';
import { Filter, AlertCircle, AlertTriangle, ShieldAlert, Shield, Plus, X, CheckCircle } from 'lucide-react';
import client from '../api/client';
import './IncidentsPage.css';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [formData, setFormData] = useState({
    organization_id: '',
    title: '',
    description: '',
    type: 'Malware',
    severity: 'Medium',
    affected_asset_ids: [],
    assigned_analyst_ids: []
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (severity) params.severity = severity;
      const { data } = await client.get('/incidents', { params });
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents", error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRelations = async () => {
    try {
      const [orgsRes, assetsRes, analystsRes] = await Promise.all([
        client.get('/organizations'),
        client.get('/assets'),
        client.get('/analysts')
      ]);
      setOrganizations(orgsRes.data);
      setAssets(assetsRes.data);
      setAnalysts(analystsRes.data);
    } catch (error) {
      console.error("Failed to load relations for modal", error);
    }
  };

  useEffect(() => { 
    load(); 
    loadRelations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions, option => Number(option.value));
      setFormData({ ...formData, [name]: values });
    } else {
      setFormData({ ...formData, [name]: name === 'organization_id' ? Number(value) : value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await client.post('/incidents', formData);
      setShowModal(false);
      setFormData({
        organization_id: '',
        title: '',
        description: '',
        type: 'Malware',
        severity: 'Medium',
        affected_asset_ids: [],
        assigned_analyst_ids: []
      });
      load();
    } catch (error) {
      console.error("Failed to create incident", error);
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to create incident. Check console for details.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await client.patch(`/incidents/${id}/status`, { status: newStatus });
      load();
    } catch (error) {
      console.error("Failed to change incident status", error);
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to change status.");
    }
  };

  const getSeverityBadge = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'critical': return <span className="badge badge-critical"><ShieldAlert size={12} style={{marginRight: 4, display: 'inline'}} /> CRITICAL</span>;
      case 'high': return <span className="badge badge-high"><AlertTriangle size={12} style={{marginRight: 4, display: 'inline'}} /> HIGH</span>;
      case 'medium': return <span className="badge badge-medium"><AlertCircle size={12} style={{marginRight: 4, display: 'inline'}} /> MEDIUM</span>;
      default: return <span className="badge badge-low"><Shield size={12} style={{marginRight: 4, display: 'inline'}} /> LOW</span>;
    }
  };

  const getStatusClass = (stat) => {
    switch(stat?.toLowerCase()) {
      case 'open': return 'text-red-400 font-bold';
      case 'in progress': return 'text-yellow-400 font-bold';
      case 'resolved': return 'text-green-400 font-bold';
      case 'closed': return 'text-gray-400';
      default: return '';
    }
  };

  return (
    <div className="incidents-container animate-fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Active Incidents</h1>
          <p>Track and manage security incidents across the organization.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Create Incident</span>
        </button>
      </header>

      <div className="filters-bar glass-panel">
        <div className="filter-group">
          <label>Status</label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            data-testid="status-input"
            className="filter-input"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Severity</label>
          <select 
            value={severity} 
            onChange={e => setSeverity(e.target.value)}
            data-testid="severity-input"
            className="filter-input"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <button onClick={load} data-testid="filter-btn" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          <Filter size={18} />
          <span>Apply Filters</span>
        </button>
      </div>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Org ID</th>
              <th>Date Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Loading intelligent data...</td></tr>
            ) : incidents.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No incidents found.</td></tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.id}>
                  <td style={{fontFamily: 'monospace', color: 'var(--accent-cyan)'}}>#{inc.id}</td>
                  <td style={{fontWeight: 500}}>{inc.type}</td>
                  <td>{getSeverityBadge(inc.severity)}</td>
                  <td className={getStatusClass(inc.status)}>{inc.status}</td>
                  <td>Org-{inc.organization_id}</td>
                  <td style={{color: 'var(--text-muted)'}}>{new Date(inc.created_at).toLocaleString()}</td>
                  <td>
                    {inc.status === 'Open' && (
                      <button className="btn-resolve" onClick={() => handleStatusChange(inc.id, 'In Progress')} style={{ color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.3)', background: 'rgba(250, 204, 21, 0.1)' }}>
                        <AlertCircle size={14} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'text-bottom' }} />
                        Start Progress
                      </button>
                    )}
                    {inc.status === 'In Progress' && (
                      <button className="btn-resolve" onClick={() => handleStatusChange(inc.id, 'Resolved')}>
                        <CheckCircle size={14} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'text-bottom' }} />
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Issue New Incident</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input required type="text" className="form-input" name="title" value={formData.title} onChange={handleInputChange} placeholder="E.g., Suspicious Login Activity" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" name="description" value={formData.description} onChange={handleInputChange} placeholder="Details about the incident..."></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Type</label>
                  <select required className="form-input" name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="Malware">Malware</option>
                    <option value="Phishing">Phishing</option>
                    <option value="DDoS">DDoS</option>
                    <option value="Brute Force">Brute Force</option>
                    <option value="Data Breach">Data Breach</option>
                    <option value="Vulnerability">Vulnerability</option>
                    <option value="Social Engineering">Social Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Severity</label>
                  <select required className="form-input" name="severity" value={formData.severity} onChange={handleInputChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Organization</label>
                <select required className="form-input" name="organization_id" value={formData.organization_id} onChange={handleInputChange}>
                  <option value="">Select an Organization</option>
                  {organizations.map(org => (
                    <option key={org.org_id} value={org.org_id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Affected Assets (Hold Ctrl/Cmd to select multiple)</label>
                <select multiple className="form-input" name="affected_asset_ids" value={formData.affected_asset_ids} onChange={handleInputChange}>
                  {assets.map(asset => (
                    <option key={asset.asset_id} value={asset.asset_id}>{asset.type} - {asset.ip_address}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Analysts (Hold Ctrl/Cmd to select multiple)</label>
                <select multiple className="form-input" name="assigned_analyst_ids" value={formData.assigned_analyst_ids} onChange={handleInputChange}>
                  {analysts.map(analyst => (
                    <option key={analyst.analyst_id} value={analyst.analyst_id}>{analyst.name} ({analyst.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Incident</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden element to maintain test compatibility with KAN-4 */}
      <div style={{ display: 'none' }}>
        <pre data-testid="incidents-output">{JSON.stringify(incidents, null, 2)}</pre>
      </div>
    </div>
  );
}
