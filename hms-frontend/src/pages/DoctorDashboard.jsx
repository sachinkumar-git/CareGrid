import React, { useState, useEffect } from 'react';
import { getDoctorProfile, getDoctorAppointments, updateAppointmentStatus, addPrescription } from '../services/api';
import Sidebar from '../components/Sidebar';

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

const Toast = ({ msg }) => msg ? (
  <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-medium text-sm animate-fadeInUp"
    style={{ background: msg.includes('❌') ? '#7f1d1d' : '#064e3b', border: `1px solid ${msg.includes('❌') ? '#dc2626' : '#10b981'}` }}>
    {msg}
  </div>
) : null;

const SkeletonRow = () => (
  <tr style={{ borderTop: '1px solid #f8faff' }}>
    {[1,2,3,4,5].map(i => (
      <td key={i} className="px-5 py-4">
        <div className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: i === 2 ? '60%' : '80%' }} />
      </td>
    ))}
  </tr>
);

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescForm, setPrescForm] = useState({
    medicine_name: '', dosage: '', duration: '', instructions: ''
  });

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const init = async () => {
    setLoading(true);
    try {
      const prof = await getDoctorProfile(user.id);
      if (prof?.doc_id) {
        setProfile(prof);
        const appts = await getDoctorAppointments(prof.doc_id);
        setAppointments(Array.isArray(appts) ? appts : []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleStatus = async (app_id, status) => {
    const res = await updateAppointmentStatus({ app_id, status });
    if (res.success) { showToast(`✅ Appointment ${status}!`); init(); }
    else showToast('❌ ' + res.message);
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    if (!prescForm.medicine_name) {
        showToast('❌ Medicine name is required');
        return;
    }

    setIsSubmitting(true);
    const payload = {
        app_id: selectedAppt.app_id,
        doctor_id: profile.doc_id,
        patient_id: selectedAppt.patient_id,
        ...prescForm
    };

    const res = await addPrescription(payload);
    if (res && res.success) {
        showToast('✅ Prescription saved & Appointment Completed!');
        setSelectedAppt(null); // Close modal
        setPrescForm({ medicine_name: '', dosage: '', duration: '', instructions: '' }); // Reset
        init(); // Refresh data
    } else {
        showToast('❌ Failed to save prescription.');
    }
    setIsSubmitting(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    approved: appointments.filter(a => a.status === 'approved').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const filtered = filterStatus === 'all' ? appointments : appointments.filter(a => a.status === filterStatus);

  const statCards = [
    { label: 'Total', value: counts.all, gradient: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', icon: '📋' },
    { label: 'Pending', value: counts.pending, gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', icon: '⏳' },
    { label: 'Approved', value: counts.approved, gradient: 'linear-gradient(135deg,#059669,#10b981)', icon: '✅' },
    { label: 'Completed', value: counts.completed, gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)', icon: '🏁' },
  ];

  const renderTable = (compact) => (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h2 className="font-display font-bold text-slate-900">Appointments</h2>
          <p className="text-slate-400 text-xs">{filtered.length} records</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'pending', 'approved', 'completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {s} {s !== 'all' && <span className="opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#f8faff' }}>
              {['#', 'Patient', 'Date', 'Status', 'Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3].map(i => <SkeletonRow key={i} />)
            ) : (
              <>
                {(compact ? filtered.slice(0, 5) : filtered).map((a, i) => (
                  <tr key={a.app_id} className="table-row animate-fadeInUp" style={{ borderTop: '1px solid #f8faff', animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-700 font-display font-bold text-sm" style={{ background: '#d1fae5' }}>
                          {a.patient_name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-600">{formatDate(a.appointment_date)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5">
                      {a.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleStatus(a.app_id, 'approved')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleStatus(a.app_id, 'cancelled')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>
                            ✕ Cancel
                          </button>
                        </div>
                      ) : a.status === 'approved' ? (
                        <button
                          onClick={() => setSelectedAppt(a)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 shadow-md shadow-blue-500/20 flex items-center gap-1"
                          style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>
                          <span>💊</span> Write Prescription
                        </button>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="5" className="py-16 text-center">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-slate-400 text-sm">No appointments found.</p>
                  </td></tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab}>
      <Toast msg={toast} />

      {selectedAppt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeInUp">
            
            <div className="bg-blue-50 p-5 border-b border-blue-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-blue-900 flex items-center gap-2"><span>💊</span> Clinical Prescription</h3>
                <p className="text-xs font-bold text-blue-600 mt-0.5">Patient: {selectedAppt.patient_name}</p>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="w-8 h-8 bg-white text-blue-400 rounded-full font-bold hover:bg-blue-100 hover:text-blue-600 transition-colors">✕</button>
            </div>

            <form onSubmit={handlePrescribeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Medication Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Paracetamol 500mg" 
                  value={prescForm.medicine_name}
                  onChange={(e) => setPrescForm({...prescForm, medicine_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dosage</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 1-0-1" 
                    value={prescForm.dosage}
                    onChange={(e) => setPrescForm({...prescForm, dosage: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 5 Days" 
                    value={prescForm.duration}
                    onChange={(e) => setPrescForm({...prescForm, duration: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Special Instructions</label>
                <textarea 
                  rows="2"
                  placeholder="e.g., Take after meals" 
                  value={prescForm.instructions}
                  onChange={(e) => setPrescForm({...prescForm, instructions: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedAppt(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/30 disabled:opacity-70 disabled:scale-100 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save & Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Doctor Portal</p>
            <h1 className="text-3xl font-display font-black text-slate-900">
              {activeTab === 'appointments' ? 'My Appointments'
                : activeTab === 'profile' ? 'My Profile'
                : `Dr. ${user?.full_name}`}
            </h1>
            <p className="text-blue-600 font-semibold mt-0.5">{profile?.specialization || 'Loading profile...'}</p>
          </div>
          <button onClick={init}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition border border-blue-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="px-8 pb-8 space-y-6">
        {/* Stat Cards — always visible */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={s.label} className={`rounded-2xl p-5 text-white shadow-lg animate-fadeInUp stagger-${i + 1} relative overflow-hidden`}
              style={{ background: s.gradient }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span className="text-3xl">{s.icon}</span>
              <p className="text-4xl font-display font-black mt-2">{s.value}</p>
              <p className="text-white/70 text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Card */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display font-black text-3xl shadow-lg mb-4"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)' }}>
                {user?.full_name?.charAt(0)}
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Dr. {user?.full_name}</h3>
              <p className="text-blue-600 text-sm font-semibold">{profile?.specialization}</p>
              <div className="mt-4 w-full space-y-3 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                {[
                  { label: 'Doctor ID', value: `#${profile?.doc_id || '—'}` },
                  { label: 'Consult Fee', value: profile?.fees ? `₹${profile.fees}` : '—' },
                  { label: 'Timing', value: profile?.timing || '—' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                    <span className="text-xs font-bold text-slate-700">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5"
                style={{ background: '#d1fae5' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Currently Active
              </div>
            </div>
            {/* Compact Appointments */}
            <div className="lg:col-span-3">
              {renderTable(true)}
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && renderTable(false)}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp">
            {/* Profile card */}
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-white font-display font-black text-5xl shadow-xl mb-5"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)' }}>
                {user?.full_name?.charAt(0)}
              </div>
              <h2 className="font-display font-bold text-slate-900 text-2xl">Dr. {user?.full_name}</h2>
              <p className="text-blue-600 font-semibold mt-1">{profile?.specialization}</p>
              <div className="mt-4 w-full px-4 py-2 rounded-xl text-sm font-bold text-emerald-700 flex items-center justify-center gap-2"
                style={{ background: '#d1fae5' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Active & Accepting Patients
              </div>
            </div>
            {/* Details */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-lg">Professional Details</h3>
              {[
                { label: '🆔 Doctor ID', value: `#${profile?.doc_id || '—'}` },
                { label: '🩺 Specialization', value: profile?.specialization || '—' },
                { label: '💰 Consultation Fee', value: profile?.fees ? `₹${profile.fees}` : '—' },
                { label: '⏰ Clinic Timing', value: profile?.timing || '—' },
                { label: '📧 Email', value: user?.email || '—' },
                { label: '📊 Total Appointments', value: counts.all },
                { label: '✅ Approved', value: counts.approved },
                { label: '🏁 Completed', value: counts.completed },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-sm text-slate-500 font-medium">{item.label}</span>
                  <span className="text-sm font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default DoctorDashboard;