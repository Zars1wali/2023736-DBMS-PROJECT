import React, { useEffect, useState } from 'react';
import { Bug, AlertCircle, ShieldOff } from 'lucide-react';
import client from '../api/client';

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await client.get('/assets/vulnerabilities'); // Endpoint based on controller naming
        setVulns(data);
      } catch (error) {
        console.error("Failed to load vulnerabilities", error);
        setVulns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="vulnerabilities-container animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <header className="page-header">
        <h1>Vulnerability Database</h1>
        <p>Master catalog of identified CVEs and system weaknesses.</p>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>Description</th>
              <th>CVSS Score</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Synchronizing with CVE database...</td></tr>
            ) : (
              vulns.map(vuln => (
                <tr key={vuln.id}>
                  <td style={{fontFamily: 'monospace', color: 'var(--status-critical)', fontWeight: 'bold'}}>{vuln.cve_id}</td>
                  <td style={{maxWidth: '400px', fontSize: '0.9rem'}}>{vuln.description}</td>
                  <td style={{fontWeight: 700}}>{vuln.cvss_score}</td>
                  <td>
                    <span className={`badge ${vuln.cvss_score >= 9 ? 'badge-critical' : vuln.cvss_score >= 7 ? 'badge-high' : 'badge-medium'}`}>
                      {vuln.cvss_score >= 9 ? 'CRITICAL' : vuln.cvss_score >= 7 ? 'HIGH' : 'MEDIUM'}
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
