import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import client from '../api/client';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // For now, using remediation trails as audit logs
    const loadLogs = async () => {
      setLoading(true);
      try {
        const { data } = await client.get('/remediation/all'); // Need to ensure this endpoint exists
        setLogs(data);
      } catch (error) {
        console.error("Failed to load audit logs", error);
        setLogs([]);
      } finally {

        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="audit-logs-container animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <header className="page-header">
        <h1>Security Audit Logs</h1>
        <p>Comprehensive trail of system actions, remediations, and administrative changes.</p>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Loading audit trail...</td></tr>
            ) : (
              logs.map((log, index) => (
                <tr key={index}>
                  <td style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Clock size={14} />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td style={{fontWeight: 500}}>{log.action_taken}</td>
                  <td>{log.name || 'System'}</td>
                  <td>
                    <span className="badge" style={{background: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-low)'}}>
                      {log.result}
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
