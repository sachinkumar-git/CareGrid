import React, { useState, useEffect } from 'react';
import { getDoctors, addDoctor, deleteDoctor, getAdminStats, getAdminAppointments } from '../services/api';
import Sidebar from '../components/Sidebar';

const Toast = ({ msg }) => msg ? (
  <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-fadeInUp font-medium text-sm"
    style={{ background: msg.includes('❌') ? '#7f1d1d' : '#064e3b', color: '#fff', border: `1px solid ${msg.includes('❌') ? '#dc2626' : '#10b981'}` }}>
    {msg}
  </div>
) : null;

const StatusBadge = ({ status }) => {
  const styles = {
    pending:   { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
    approved:  { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
    cancelled: { bg: '#fee2e2', color: '#7f1d1d', dot: '#ef4444' },
    completed: { bg: '#dbeafe', color: '#1e3a5f', dot: '#3b82f6' },
  };
  const s = styles[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

const StatCard = ({ title, value, icon, gradient, delay }) => (
  <div className={`rounded-2xl p-6 text-white shadow-lg animate-fadeInUp ${delay} relative overflow-hidden`}
    style={{ background: gradient }}>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2"
      style={{ background: 'rgba(255,255,255,0.1)' }} />
    <div className="relative z-10">
      <span className="text-4xl">{icon}</span>
      <p className="text-4xl font-display font-black mt-3">{value ?? '—'}</p>
      <p className="text-white/70 text-sm font-medium mt-1">{title}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', specialization: '', fees: '', timing: '' });
  const [loading, setLoading] = useState(false);
  const [apptLoading, setApptLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [apptSearch, setApptSearch] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    const [docs, st] = await Promise.all([getDoctors(), getAdminStats()]);
    setDoctors(Array.isArray(docs) ? docs : []);
    setStats(st || {});
  };

  const loadAppointments = async () => {
    setApptLoading(true);
    const appts = await getAdminAppointments();
    setAllAppointments(Array.isArray(appts) ? appts : []);
    setApptLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (activeTab === 'appointments') loadAppointments(); }, [activeTab]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await addDoctor(formData);
    if (res.success) {
      showToast('✅ Doctor registered successfully!');
      setFormData({ full_name: '', email: '', password: '', specialization: '', fees: '', timing: '' });
      setShowForm(false);
      loadData();
    } else showToast('❌ ' + res.message);
    setLoading(false);
  };

  const handleDelete = async (doc_id, name) => {
    if (!window.confirm(`Remove Dr. ${name} from the system?`)) return;
    const res = await deleteDoctor(doc_id);
    if (res.success) { showToast('✅ Doctor removed!'); loadData(); }
    else showToast('❌ ' + res.message);
  };

  const filtered = doctors.filter(d =>
    d.doc_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const fields = [
    { key: 'full_name', label: 'Full Name', placeholder: 'Dr. John Smith' },
    { key: 'email', label: 'Email', placeholder: 'doctor@hospital.com', type: 'email' },
    { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
    { key: 'specialization', label: 'Specialization', placeholder: 'Cardiologist' },
    { key: 'fees', label: 'Consultation Fee (₹)', placeholder: '500', type: 'number' },
    { key: 'timing', label: 'Timing', placeholder: 'Mon-Fri, 10AM-4PM' },
  ];

  return (
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab}>
      <Toast msg={toast} />

      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Welcome back 👋 {user?.full_name}</p>
            <h1 className="text-3xl font-display font-black text-slate-900">
              {activeTab === 'stats' ? 'Statistics' : activeTab === 'doctors' ? 'Doctors' : activeTab === 'appointments' ? 'All Appointments' : 'Admin Dashboard'}
            </h1>
            <p className="text-slate-500 mt-1">Manage CareGrid operations</p>
          </div>
          {activeTab !== 'stats' && activeTab !== 'appointments' && (
            <button onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 text-sm">
              <span className="text-lg leading-none">+</span> Add Doctor
            </button>
          )}
        </div>
      </div>

      <div className="px-8 pb-8 space-y-6">
        {/* Stat Cards — always visible */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Doctors" value={stats.totalDoctors} icon="👨‍⚕️" gradient="linear-gradient(135deg,#1d4ed8,#3b82f6)" delay="stagger-1" />
          <StatCard title="Total Patients" value={stats.totalPatients} icon="🧑" gradient="linear-gradient(135deg,#059669,#10b981)" delay="stagger-2" />
          <StatCard title="Appointments" value={stats.totalAppointments} icon="📅" gradient="linear-gradient(135deg,#7c3aed,#a78bfa)" delay="stagger-3" />
          <StatCard title="Pending" value={stats.pendingAppointments} icon="⏳" gradient="linear-gradient(135deg,#d97706,#f59e0b)" delay="stagger-4" />
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
            <h2 className="font-display font-bold text-slate-900 text-lg mb-5">Hospital Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Total Registered Doctors', value: stats.totalDoctors ?? '—', icon: '👨‍⚕️', color: '#1d4ed8' },
                { label: 'Total Registered Patients', value: stats.totalPatients ?? '—', icon: '🧑', color: '#059669' },
                { label: 'Total Appointments', value: stats.totalAppointments ?? '—', icon: '📅', color: '#7c3aed' },
                { label: 'Pending Appointments', value: stats.pendingAppointments ?? '—', icon: '⏳', color: '#d97706' },
                { label: 'Approved Appointments', value: (stats.totalAppointments - stats.pendingAppointments) >= 0 ? stats.totalAppointments - stats.pendingAppointments : '—', icon: '✅', color: '#059669' },
                { label: 'Avg Fee per Doctor', value: doctors.length ? '₹' + Math.round(doctors.reduce((s, d) => s + parseFloat(d.fees || 0), 0) / doctors.length) : '—', icon: '💰', color: '#0891b2' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#f8faff', border: '1px solid #e2e8f0' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: item.color + '18' }}>{item.icon}</div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                    <p className="text-2xl font-display font-black" style={{ color: item.color }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Doctor Form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6 animate-fadeInUp" style={{ border: '1.5px solid #dbeafe' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg">Register New Doctor</h3>
                <p className="text-slate-500 text-sm">Fill in the details below</p>
              </div>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg transition">
                ×
              </button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    value={formData[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    required className="input-field" />
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary text-sm">
                  {loading ? 'Registering...' : '✓ Register Doctor'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="glass-card rounded-2xl overflow-hidden animate-fadeInUp">
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-lg">All Appointments</h2>
                <p className="text-slate-500 text-sm">{allAppointments.length} total records</p>
              </div>
              <div className="flex gap-3 items-center">
                <input type="text" placeholder="Search patient or doctor..." value={apptSearch}
                  onChange={e => setApptSearch(e.target.value)}
                  className="input-field text-sm" style={{ width: '220px', padding: '9px 14px' }} />
                <button onClick={loadAppointments}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition border border-blue-100">
                  ↻ Refresh
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8faff' }}>
                    {['#', 'Patient', 'Doctor', 'Specialization', 'Date', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apptLoading ? (
                    [1,2,3,4].map(i => (
                      <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                        {[1,2,3,4,5,6].map(j => (
                          <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-100 rounded-full animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <>
                      {allAppointments
                        .filter(a => !apptSearch ||
                          a.patient_name?.toLowerCase().includes(apptSearch.toLowerCase()) ||
                          a.doctor_name?.toLowerCase().includes(apptSearch.toLowerCase()))
                        .map((a, i) => (
                          <tr key={a.app_id} className="table-row animate-fadeInUp" style={{ borderTop: '1px solid #f1f5f9', animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                            <td className="px-6 py-4 text-xs text-slate-400">{i + 1}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                  {a.patient_name?.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{a.patient_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
                                  {a.doctor_name?.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{a.doctor_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                                {a.specialization}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                          </tr>
                        ))}
                      {allAppointments.length === 0 && (
                        <tr><td colSpan="6" className="py-16 text-center">
                          <p className="text-4xl mb-3">📭</p>
                          <p className="text-slate-400 text-sm">No appointments in the system yet.</p>
                        </td></tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Doctors Table — only on dashboard/doctors tabs */}
        {activeTab !== 'stats' && activeTab !== 'appointments' && (
          <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 className="font-display font-bold text-slate-900 text-lg">Medical Staff</h2>
              <p className="text-slate-500 text-sm">{doctors.length} doctors registered</p>
            </div>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search doctors..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 text-sm" style={{ width: '220px', padding: '9px 12px 9px 36px' }} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8faff' }}>
                  {['#', 'Doctor', 'Specialization', 'Timing', 'Fee', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.doc_id} className="table-row animate-fadeInUp" style={{ borderTop: '1px solid #f1f5f9', animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                    <td className="px-6 py-4 text-sm text-slate-400 font-medium">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
                          {d.doc_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm font-display">{d.doc_name}</p>
                          <p className="text-slate-400 text-xs">{d.email || 'ID: #' + d.doc_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                        {d.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{d.timing || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="font-display font-bold text-slate-900">₹{d.fees}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(d.doc_id, d.doc_name)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all border text-red-500 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="text-slate-400 text-sm">No doctors found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminDashboard;