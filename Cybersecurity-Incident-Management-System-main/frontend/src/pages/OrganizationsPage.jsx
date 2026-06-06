import React, { useEffect, useState } from 'react';
import { Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import client from '../api/client';

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await client.get('/organizations');
        setOrgs(data);
      } catch (error) {
        console.error("Failed to load organizations", error);
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="organizations-container animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <header className="page-header">
        <h1>Member Organizations</h1>
        <p>List of national and international entities protected by CIMS.</p>
      </header>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Organization</th>
              <th>Industry</th>
              <th>Country</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Loading organization data...</td></tr>
            ) : (
              orgs.map(org => (
                <tr key={org.org_id}>
                  <td style={{fontFamily: 'monospace', color: 'var(--accent-cyan)'}}>#ORG-{org.org_id}</td>
                  <td>
                    <div style={{fontWeight: 600}}>{org.name}</div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                      <Globe size={12} style={{display: 'inline', marginRight: 4}} />
                      {org.website}
                    </div>
                  </td>
                  <td>{org.industry}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                      <MapPin size={14} />
                      {org.country}
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize: '0.85rem'}}>
                      <Mail size={12} style={{display: 'inline', marginRight: 4}} />
                      {org.contact_email}
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
