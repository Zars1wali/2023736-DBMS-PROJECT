import React, { useEffect, useState } from 'react';
import { Network, Server, Bug, ShieldCheck, ShieldAlert } from 'lucide-react';
import client from '../api/client';

export default function ThreatMapPage() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await client.get('/assets/vulnerabilities/unpatched-critical'); 
        setMappings(data);
      } catch (error) {

        console.error("Failed to load threat map", error);
        setMappings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="threat-map-container animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <header className="page-header">
        <h1>Threat Mapping</h1>
        <p>Live relationship between assets and active vulnerabilities.</p>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>CVE ID</th>
              <th>Score</th>
              <th>Patch Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Mapping attack vectors...</td></tr>
            ) : (
              mappings.map((m, i) => (
                <tr key={i}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Server size={14} color="var(--text-muted)" />
                      {m.asset_type} ({m.ip_address})
                    </div>
                  </td>
                  <td style={{fontFamily: 'monospace', color: 'var(--status-critical)'}}>{m.cve_id}</td>
                  <td>{m.cvss_score}</td>
                  <td>
                    <span className={`badge ${m.patch_status === 'Patched' ? 'badge-low' : 'badge-critical'}`}>
                      {m.patch_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
