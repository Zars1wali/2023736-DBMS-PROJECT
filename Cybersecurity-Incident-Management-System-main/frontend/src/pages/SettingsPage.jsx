import React from 'react';
import { Settings, Bell, Shield, Database, Globe, User } from 'lucide-react';

export default function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('user')) || {};

  return (
    <div className="settings-container animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <header className="page-header">
        <h1>System Settings</h1>
        <p>Manage your account preferences and global CIMS configuration.</p>
      </header>

      <div className="settings-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem'}}>
        
        {/* Profile Section */}
        <div className="settings-card glass-panel" style={{padding: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
            <User size={24} color="var(--accent-cyan)" />
            <h2 style={{margin: 0}}>Analyst Profile</h2>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Full Name</span>
              <span style={{fontWeight: 600}}>{user.name}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Email</span>
              <span style={{fontWeight: 600}}>{user.email}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Access Level</span>
              <span className="badge badge-high">{user.role}</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{marginTop: '1.5rem', width: '100%'}}>Update Profile</button>
        </div>

        {/* System Configuration */}
        <div className="settings-card glass-panel" style={{padding: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
            <Shield size={24} color="var(--accent-cyan)" />
            <h2 style={{margin: 0}}>Security Protocols</h2>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontWeight: 600}}>AI-Driven Threat Detection</div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Real-time anomaly analysis on network traffic.</div>
              </div>
              <div style={{width: '40px', height: '20px', background: 'var(--accent-cyan)', borderRadius: '20px', position: 'relative'}}>
                <div style={{width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px'}}></div>
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontWeight: 600}}>Automatic Remediation</div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Auto-block IPs on critical brute force detection.</div>
              </div>
              <div style={{width: '40px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative'}}>
                <div style={{width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', left: '2px', top: '2px'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Connection */}
        <div className="settings-card glass-panel" style={{padding: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
            <Database size={24} color="var(--accent-cyan)" />
            <h2 style={{margin: 0}}>DBMS Connectivity</h2>
          </div>
          <div style={{padding: '1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '1rem'}}>
            <div style={{color: 'var(--status-low)', fontSize: '0.9rem', fontWeight: 600}}>Connected to CIMS-db</div>
            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>PostgreSQL Cluster: 127.0.0.1:5432</div>
          </div>
          <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
            Last sync: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Global Notifications */}
        <div className="settings-card glass-panel" style={{padding: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
            <Bell size={24} color="var(--accent-cyan)" />
            <h2 style={{margin: 0}}>Notifications</h2>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
               <input type="checkbox" defaultChecked style={{accentColor: 'var(--accent-cyan)'}} />
               <span>Critical Incident Alerts (Email)</span>
             </label>
             <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
               <input type="checkbox" defaultChecked style={{accentColor: 'var(--accent-cyan)'}} />
               <span>System Health Weekly Report</span>
             </label>
          </div>
        </div>

      </div>
    </div>
  );
}
