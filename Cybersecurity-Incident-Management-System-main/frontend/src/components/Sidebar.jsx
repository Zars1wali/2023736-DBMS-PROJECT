import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, LayoutDashboard, AlertTriangle, Activity, Settings, 
  Users, Server, LogOut, Building2, Bug, Network 
} from 'lucide-react';


import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <ShieldAlert size={32} color="var(--accent-cyan)" />
        <div className="brand">
          <span className="brand-title">CIMS</span>
          <span className="brand-subtitle">Command Center</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-group-title">MAIN</div>
        
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/incidents" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <AlertTriangle size={20} />
          <span>Incidents</span>
        </NavLink>
        
        <NavLink to="/assets" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Server size={20} />
          <span>Assets</span>
        </NavLink>

        <NavLink to="/vulnerabilities" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Bug size={20} />
          <span>Vulnerabilities</span>
        </NavLink>

        <NavLink to="/asset-vulnerabilities" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Network size={20} />
          <span>Asset Vulnerabilities</span>
        </NavLink>

        
        <div className="nav-group-title" style={{marginTop: '2rem'}}>MANAGEMENT</div>
        
        <NavLink to="/organizations" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Building2 size={20} />
          <span>Organizations</span>
        </NavLink>

        <NavLink to="/analysts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} />
          <span>Analysts</span>
        </NavLink>
        
        <NavLink to="/remediation-actions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Activity size={20} />
          <span>Remediation Actions</span>
        </NavLink>

        
        <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">
            {(() => {
              try {
                const user = JSON.parse(localStorage.getItem('user'));
                return user?.name?.charAt(0) || 'A';
              } catch {
                return 'A';
              }
            })()}
          </div>
          <div className="user-info">
            <span className="user-name">
              {(() => {
                try {
                  const user = JSON.parse(localStorage.getItem('user'));
                  return user?.name || 'Admin User';
                } catch {
                  return 'Admin User';
                }
              })()}
            </span>
            <span className="user-role">
              {(() => {
                try {
                  const user = JSON.parse(localStorage.getItem('user'));
                  return user?.role || 'SOC Manager';
                } catch {
                  return 'SOC Manager';
                }
              })()}
            </span>
          </div>
          <button 
            className="logout-btn" 
            title="Logout"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            <LogOut size={16} />
          </button>

        </div>
      </div>


    </aside>
  );
};

export default Sidebar;
