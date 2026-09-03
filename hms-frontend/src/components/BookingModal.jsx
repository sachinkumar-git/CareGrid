import React, { useState } from 'react';

const BookingModal = ({ doctor, onConfirm, onClose }) => {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    await onConfirm(date);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fadeInUp"
        style={{ background: '#fff' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative p-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition text-xl">
            ×
          </button>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl border border-white/20">
              {doctor?.doc_name?.charAt(0)}
            </div>
            <div>
              <p className="text-white font-display font-bold text-xl">{doctor?.doc_name}</p>
              <p className="text-blue-200 text-sm">{doctor?.specialization}</p>
            </div>
          </div>
        </div>

        {/* Doctor Info Strip */}
        <div className="flex" style={{ borderBottom: '1px solid #f1f5f9' }}>
          {[
            { label: 'Consultation Fee', value: `₹${doctor?.fees}` },
            { label: 'Timing', value: doctor?.timing || 'Contact clinic' },
            { label: 'Status', value: '● Available' },
          ].map((item, i) => (
            <div key={i} className="flex-1 p-4 text-center" style={{ borderRight: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              <p className="font-display font-bold text-slate-800 text-sm mt-1" style={i === 2 ? { color: '#10b981' } : {}}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Appointment Date
            </label>
            <input type="date" min={today} value={date}
              onChange={e => setDate(e.target.value)} required
              className="input-field font-display font-semibold text-slate-800" />
          </div>

          {date && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium animate-fadeIn"
              style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              📅 Booking for: {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-display font-semibold text-sm hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading || !date}
              className="flex-1 py-3 rounded-xl text-white font-display font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: date ? '0 4px 15px rgba(37,99,235,0.4)' : 'none' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Booking...
                </span>
              ) : 'Confirm Booking ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;