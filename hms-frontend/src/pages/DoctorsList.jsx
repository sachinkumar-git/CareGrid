import React, { useState, useEffect } from 'react';
import { getDoctors, getPatientAppointments, cancelAppointment, predictDepartment, getReceiptData } from '../services/api';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';

const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
    approved: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
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

const DoctorsList = () => {
  const [activeTab, setActiveTab] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [toast, setToast] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('all');

  const [symptoms, setSymptoms] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [viewPrescription, setViewPrescription] = useState(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const loadData = async () => {
    const [docs, appts] = await Promise.all([getDoctors(), getPatientAppointments(user.id)]);
    setDoctors(Array.isArray(docs) ? docs : []);
    setMyAppointments(Array.isArray(appts) ? appts : []);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const showToast = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast({ text: '', type: '' }), 3000); };

  const handleConfirmBooking = async (date) => {
    try {
      if (typeof window.Razorpay === 'undefined') {
        showToast('Razorpay SDK not loaded. Please refresh the page.', 'error');
        return;
      }

      const orderRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedDoctor.fees })
      });

      const data = await orderRes.json();

      if (!data.success || !data.order) {
        showToast('Could not create payment order. Please try again.', 'error');
        return;
      }

      const order = data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'CareGrid',
        description: `Consultation with ${selectedDoctor.doc_name}`,
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              appointmentData: {
                patient_id: user.id,
                doctor_id: selectedDoctor.doc_id,
                appointment_date: date,
              }
            })
          });

          const finalData = await verifyRes.json();
          if (finalData.success) {
            showToast('Payment verified. Appointment booked!');
            setSelectedDoctor(null);
            loadData();
          } else {
            showToast('Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email,
        },
        theme: { color: '#1d4ed8' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Booking error:', error);
      showToast('Network error. Could not connect to server.', 'error');
    }
  };

  const handleCancelBooking = async (app_id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    const res = await cancelAppointment(app_id);
    if (res.success) { showToast('✅ Appointment cancelled!'); loadData(); }
    else showToast('❌ ' + (res.message || 'Could not cancel'), 'error');
  };

  const handleAIPredict = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setAiLoading(true);
    const res = await predictDepartment(symptoms);
    if (res && res.success) {
      setAiSuggestion(res.department);
      setSearch(''); 
      setFilterSpec('all');
      showToast(`✨ AI routed you to: ${res.department}`);
    } else {
      showToast('❌ AI Prediction failed. Try again.', 'error');
    }
    setAiLoading(false);
  };

  const clearAIFilter = () => { setAiSuggestion(null); setSymptoms(''); };

  const handleViewPrescription = async (app_id) => {
    try {
        const response = await getReceiptData(app_id);
        if (response.success && response.data && response.data.medicine_name) {
            setViewPrescription(response.data);
        } else {
            showToast("❌ No prescription added yet.", "error");
        }
    } catch {
        showToast('Error fetching prescription.', 'error');
    }
  };

  const handleDownloadPrescriptionPDF = async (app_id) => {
    try {
        const response = await getReceiptData(app_id);
        if (response.success && response.data && response.data.medicine_name) {
            const data = response.data;
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(30, 58, 138); 
            doc.text('CareGrid', 105, 20, { align: 'center' });
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text("Official Clinical Prescription", 105, 28, { align: 'center' });
            doc.line(20, 35, 190, 35); 
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Patient: ${data.patient_name}`, 20, 45);
            doc.text(`Date: ${new Date(data.appointment_date).toLocaleDateString()}`, 140, 45);
            doc.text(`Doctor: Dr. ${data.doctor_name} (${data.specialization})`, 20, 55);
            doc.line(20, 65, 190, 65); 
            doc.setFontSize(20);
            doc.setTextColor(30, 58, 138);
            doc.text("Rx", 20, 80);
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(data.medicine_name, 20, 95);
            doc.setFontSize(11);
            doc.text(`Dosage: ${data.dosage}`, 20, 105);
            doc.text(`Duration: ${data.duration}`, 20, 112);
            if (data.instructions) {
                doc.text("Instructions:", 20, 125);
                const splitInstructions = doc.splitTextToSize(data.instructions, 170);
                doc.text(splitInstructions, 20, 132);
            }
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text("Computer-generated document. No signature required.", 105, 280, { align: 'center' });
            doc.save(`Prescription_${data.patient_name.replace(/\s+/g, '_')}.pdf`);
            showToast('✅ Prescription PDF saved!');
        }
    } catch {
        showToast('PDF generation failed. Please try again.', 'error');
    }
  };

  const specializations = ['all', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const filteredDoctors = doctors.filter(d => {
    if (aiSuggestion) return d.specialization?.toLowerCase().includes(aiSuggestion.toLowerCase());
    const matchSearch = d.doc_name?.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase());
    const matchSpec = filterSpec === 'all' || d.specialization === filterSpec;
    return matchSearch && matchSpec;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab}>
      {toast.text && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-medium text-sm animate-fadeInUp"
          style={{ background: toast.type === 'error' ? '#7f1d1d' : '#064e3b', border: `1px solid ${toast.type === 'error' ? '#dc2626' : '#10b981'}` }}>
          {toast.text}
        </div>
      )}

      {selectedDoctor && (
        <BookingModal doctor={selectedDoctor} onConfirm={handleConfirmBooking} onClose={() => setSelectedDoctor(null)} />
      )}

      {/* Prescription View Modal */}
      {viewPrescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeInUp">
            <div className="bg-blue-50 p-5 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2"><span>💊</span> Doctor's Prescription</h3>
              <button onClick={() => setViewPrescription(null)} className="w-8 h-8 bg-white text-blue-400 rounded-full font-bold hover:bg-blue-100 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between border-b pb-4">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Consulted</p>
                      <p className="font-black text-slate-800">Dr. {viewPrescription.doctor_name}</p>
                      <p className="text-xs font-bold text-blue-600">{viewPrescription.specialization}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
                      <p className="font-bold text-slate-800">{new Date(viewPrescription.appointment_date).toLocaleDateString()}</p>
                  </div>
              </div>
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                  <p className="text-base font-black text-blue-900 mb-2">{viewPrescription.medicine_name}</p>
                  <div className="flex gap-4 text-xs font-bold text-blue-700/80">
                      <span>⏱️ {viewPrescription.dosage}</span>
                      <span>📅 For {viewPrescription.duration}</span>
                  </div>
              </div>
              {viewPrescription.instructions && (
                  <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {viewPrescription.instructions}
                  </p>
              )}
              <button onClick={() => setViewPrescription(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <p className="text-sm text-slate-500 mb-1">Patient Portal</p>
        <h1 className="text-3xl font-display font-black text-slate-900">Hello, {user?.full_name} 👋</h1>
      </div>

      <div className="px-8 pb-8 space-y-5">
        <div className="flex gap-1 p-1.5 rounded-2xl w-fit" style={{ background: '#e8edf5' }}>
          {[{ id: 'doctors', label: '🔍 Find Doctors' }, { id: 'bookings', label: `📋 My Bookings (${myAppointments.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold font-display transition-all ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'doctors' && (
          <div className="space-y-5 animate-fadeIn">
            {/* AI Box */}
            <div className="glass-card bg-white rounded-3xl p-6 border border-purple-100 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/3">
                  <h3 className="text-xl font-display font-black text-slate-900">AI Symptom Checker ✨</h3>
                  <p className="text-slate-500 text-xs mt-1">Describe symptoms and let AI find the right specialist.</p>
                </div>
                <div className="w-full md:w-2/3">
                  <form onSubmit={handleAIPredict} className="flex gap-2">
                    <input type="text" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="E.g., severe headache..." className="input-field flex-1 text-sm bg-slate-50" required />
                    <button type="submit" disabled={aiLoading} className="btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 border-none shadow-lg shadow-purple-500/30">
                      {aiLoading ? 'Analyzing...' : 'Analyze ✨'}
                    </button>
                  </form>
                  {aiSuggestion && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-xl flex items-center justify-between border border-purple-100 animate-fadeInUp">
                      <p className="text-sm font-medium text-slate-700">AI Recommends: <span className="font-bold text-purple-700">{aiSuggestion}</span></p>
                      <button onClick={clearAIFilter} className="text-xs font-bold text-purple-500 underline">Clear</button>
                    </div>
                  )}
                </div>
            </div>

            {/* Manual Search */}
            {!aiSuggestion && (
              <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search manually by name or spec..." value={search} onChange={e => setSearch(e.target.value)} className="input-field text-sm w-full relative" style={{ paddingLeft: '2.5rem' }} />
                </div>
                <div className="flex gap-2">
                  {specializations.slice(0, 5).map(s => (
                    <button key={s} onClick={() => setFilterSpec(s)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterSpec === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{s === 'all' ? '🏥 All' : s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDoctors.map((doc, i) => (
                <div key={doc.doc_id} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}>
                  <DoctorCard doctor={doc} onBook={(id) => setSelectedDoctor(doctors.find(d => d.doc_id === id))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass-card rounded-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 border-b"><h2 className="font-display font-bold text-slate-900 text-lg">My Appointments</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {['#', 'Doctor', 'Specialization', 'Date', 'Status', 'Action'].map(h => (<th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {myAppointments.map((a, i) => (
                    <tr key={a.app_id} className="border-t animate-fadeInUp" style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: 'forwards' }}>
                      <td className="px-6 py-4 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{a.doctor_name}</td>
                      <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{a.specialization}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(a.appointment_date)}</td>
                      <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                      <td className="px-6 py-4 flex gap-2">
                        {a.status === 'pending' && <button onClick={() => handleCancelBooking(a.app_id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all">Cancel</button>}
                        {a.status === 'completed' && (
                          <>
                            <button onClick={() => handleViewPrescription(a.app_id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">View Prescription </button>
                            <button onClick={() => handleDownloadPrescriptionPDF(a.app_id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all">Save Prescription</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default DoctorsList;