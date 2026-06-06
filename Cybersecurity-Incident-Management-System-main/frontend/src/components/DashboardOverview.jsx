import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './DashboardOverview.css';
import apiClient from '../api/client';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    activeIncidents: 12,
    criticalThreats: 3,
    systemHealth: 98.4,
    resolvedToday: 8
  });

  // Mock data for the chart to simulate network activity
  const data = [
    { time: '00:00', traffic: 4000, anomalies: 2400 },
    { time: '04:00', traffic: 3000, anomalies: 1398 },
    { time: '08:00', traffic: 2000, anomalies: 9800 },
    { time: '12:00', traffic: 2780, anomalies: 3908 },
    { time: '16:00', traffic: 1890, anomalies: 4800 },
    { time: '20:00', traffic: 2390, anomalies: 3800 },
    { time: '24:00', traffic: 3490, anomalies: 4300 },
  ];

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h1>Command Center Overview</h1>
          <p>Real-time AI analysis and system status monitoring.</p>
        </div>
        <button className="btn btn-primary">
          <Activity size={18} />
          <span>Run AI Scan</span>
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
            <ShieldAlert size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Critical Threats</span>
            <span className="stat-value">{stats.criticalThreats}</span>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Incidents</span>
            <span className="stat-value">{stats.activeIncidents}</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Resolved Today</span>
            <span className="stat-value">{stats.resolvedToday}</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
            <Shield size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">System Health</span>
            <span className="stat-value">{stats.systemHealth}%</span>
          </div>
        </div>
      </div>

      <div className="chart-section glass-panel">
        <div className="section-header">
          <h2>Network Activity & AI Anomalies</h2>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--status-critical)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--status-critical)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Area type="monotone" dataKey="traffic" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorTraffic)" />
              <Area type="monotone" dataKey="anomalies" stroke="var(--status-critical)" fillOpacity={1} fill="url(#colorAnomalies)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
