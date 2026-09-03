import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Logo = () => (
  <div className="flex items-center gap-3 px-2 py-1">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    </div>
    <div>
      <p className="text-white font-display font-bold text-base leading-none">CareGrid</p>
      <p className="text-slate-400 text-xs">Healthcare Platform</p>
    </div>
  </div>
);

const navConfig = {
  admin: [
    { icon: '⊞', label: 'Dashboard', id: 'dashboard' },
    { icon: '👨‍⚕️', label: 'Doctors', id: 'doctors' },
    { icon: '📅', label: 'Appointments', id: 'appointments' },
    { icon: '📊', label: 'Statistics', id: 'stats' },
  ],
  doctor: [
    { icon: '⊞', label: 'Overview', id: 'overview' },
    { icon: '📋', label: 'Appointments', id: 'appointments' },
    { icon: '👤', label: 'My Profile', id: 'profile' },
  ],
  patient: [
    { icon: '⊞', label: 'Find Doctors', id: 'doctors' },
    { icon: '📅', label: 'My Bookings', id: 'bookings' },
  ],
};

const Sidebar = ({ activeTab, setActiveTab, children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [collapsed, setCollapsed] = useState(false);
  const navItems = navConfig[user?.role] || [];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  const roleColors = {
    admin: 'from-purple-500 to-purple-700',
    doctor: 'from-blue-500 to-blue-700',
    patient: 'from-emerald-500 to-emerald-700',
  };

  const roleLabels = { admin: 'Administrator', doctor: 'Doctor', patient: 'Patient' };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--body-bg)' }}>
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 flex flex-col transition-all duration-300`}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)', minHeight: '100vh' }}>

        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          {!collapsed && <Logo />}
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        <div className="p-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[user?.role]} flex items-center justify-center text-white font-display font-bold text-base flex-shrink-0 animate-pulse-glow`}>
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-white font-semibold text-sm truncate font-display">{user?.full_name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa' }}>
                  {roleLabels[user?.role]}
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {!collapsed && <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-3">Navigation</p>}
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => setActiveTab && setActiveTab(item.id)}
              className={`sidebar-link w-full ${activeTab === item.id ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}>
              <span className="text-lg leading-none">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && activeTab === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <button onClick={handleLogout}
            className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default Sidebar;