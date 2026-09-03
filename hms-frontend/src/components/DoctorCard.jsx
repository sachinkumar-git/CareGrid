import React from 'react';

const emojiMap = {
  'Cardiologist': '❤️', 'Neurologist': '🧠', 'Dermatologist': '🩺',
  'Orthopedic': '🦴', 'Pediatrician': '👶', 'Gynecologist': '👩‍⚕️',
  'Dentist': '🦷', 'Ophthalmologist': '👁️', 'Psychiatrist': '🧘',
  'General Physician': '👨‍⚕️', 'ENT': '👂', 'Oncologist': '🔬',
};

const gradients = [
  'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
  'linear-gradient(135deg, #059669, #06b6d4)',
  'linear-gradient(135deg, #7c3aed, #3b82f6)',
  'linear-gradient(135deg, #dc2626, #f97316)',
  'linear-gradient(135deg, #0891b2, #059669)',
  'linear-gradient(135deg, #d97706, #f59e0b)',
];

const DoctorCard = ({ doctor, onBook }) => {
  const emoji = emojiMap[doctor.specialization] || '👨‍⚕️';
  const grad = gradients[doctor.doc_id % gradients.length];

  return (
    <div className="glass-card rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Card Header */}
      <div className="p-5 relative overflow-hidden" style={{ background: grad }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border border-white/30">
              {emoji}
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base leading-tight">{doctor.doc_name}</h3>
              <p className="text-white/70 text-xs mt-0.5">{doctor.specialization}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Available
          </span>
        </div>

        <div className="relative z-10 mt-4">
          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
            <p className="text-white font-display font-black text-lg">₹{doctor.fees}</p>
            <p className="text-white/60 text-xs">Consultation Fee</p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: '#f8faff' }}>
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-slate-600 text-xs font-medium">{doctor.timing || 'Contact for schedule'}</span>
        </div>

        <button onClick={() => onBook(doctor.doc_id)}
          className="mt-auto w-full py-3 rounded-xl text-white text-sm font-display font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:shadow-lg"
          style={{ background: grad, boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;