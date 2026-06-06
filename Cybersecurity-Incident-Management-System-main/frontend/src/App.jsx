import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import IncidentsPage from './pages/IncidentsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AssetsPage from './pages/AssetsPage';
import AnalystsPage from './pages/AnalystsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import OrganizationsPage from './pages/OrganizationsPage';
import VulnerabilitiesPage from './pages/VulnerabilitiesPage';
import ThreatMapPage from './pages/ThreatMapPage';


// Layout component for the protected area
const ProtectedLayout = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const token = localStorage.getItem('token');

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" replace />} />

      {/* Protected Area */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
        <Route path="/asset-vulnerabilities" element={<ThreatMapPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/analysts" element={<AnalystsPage />} />
        <Route path="/remediation-actions" element={<AuditLogsPage />} />


        <Route path="/settings" element={<SettingsPage />} />

      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;




