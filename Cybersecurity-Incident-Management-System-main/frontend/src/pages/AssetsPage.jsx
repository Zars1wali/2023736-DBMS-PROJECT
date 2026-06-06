import React, { useEffect, useState } from 'react';
import { Server, ShieldAlert, MapPin, Activity, HardDrive } from 'lucide-react';
import client from '../api/client';
import './AssetsPage.css';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/assets');
      setAssets(data);
    } catch (error) {
      console.error("Failed to load assets", error);
      setAssets([]);
    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const getCriticalityBadge = (crit) => {
    switch(crit?.toLowerCase()) {
      case 'critical': return <span className="badge badge-critical">CRITICAL</span>;
      case 'high': return <span className="badge badge-high">HIGH</span>;
      case 'medium': return <span className="badge badge-medium">MEDIUM</span>;
      default: return <span className="badge badge-low">LOW</span>;
    }
  };

  return (
    <div className="assets-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Infrastructure Assets</h1>
          <p>Inventory of protected servers, endpoints, and networking hardware.</p>
        </div>
        <button className="btn btn-primary" onClick={loadAssets}>
          <Activity size={18} />
          <span>Scan Network</span>
        </button>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Type</th>
              <th>Operating System</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Criticality</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Querying asset inventory...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No assets registered.</td></tr>
            ) : (
              assets.map(asset => (
                <tr key={asset.asset_id}>
                  <td style={{fontFamily: 'monospace', color: 'var(--accent-cyan)'}}>#AST-{asset.asset_id}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Server size={16} color="var(--text-muted)" />
                      {asset.type}
                    </div>
                  </td>
                  <td>{asset.os}</td>
                  <td style={{fontFamily: 'monospace'}}>{asset.ip_address}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem'}}>
                      <MapPin size={14} />
                      {asset.location}
                    </div>
                  </td>
                  <td>{getCriticalityBadge(asset.criticality)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
