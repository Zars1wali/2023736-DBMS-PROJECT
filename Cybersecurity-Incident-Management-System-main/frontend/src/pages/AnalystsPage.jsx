import React, { useEffect, useState } from 'react';
import { Users, Mail, Phone, Briefcase, ShieldCheck } from 'lucide-react';
import client from '../api/client';

export default function AnalystsPage() {
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAnalysts = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/analysts');
      setAnalysts(data);
    } catch (error) {
      console.error("Failed to load analysts", error);
      setAnalysts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysts();
  }, []);

  return (
    <div className="analysts-container animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <header className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1>Security Personnel</h1>
          <p>Manage analyst assignments, roles, and contact information.</p>
        </div>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Fetching personnel directory...</td></tr>
            ) : analysts.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No analysts found.</td></tr>
            ) : (
              analysts.map(analyst => (
                <tr key={analyst.analyst_id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div className="avatar" style={{width: 32, height: 32, fontSize: '0.8rem'}}>
                        {analyst.name?.charAt(0)}
                      </div>
                      <span style={{fontWeight: 600}}>{analyst.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-cyan)'}}>
                      {analyst.role}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                      <Briefcase size={14} />
                      {analyst.department}
                    </div>
                  </td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'}}>
                      <Mail size={14} color="var(--text-muted)" />
                      {analyst.email}
                    </div>
                  </td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'}}>
                      <Phone size={14} color="var(--text-muted)" />
                      {analyst.phone}
                    </div>
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
