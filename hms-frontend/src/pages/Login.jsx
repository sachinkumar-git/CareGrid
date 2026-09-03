import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'patient' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);
    if (isLogin) {
      const result = await loginUser({ email: formData.email, password: formData.password });
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        if (result.user.role === 'admin') navigate('/admin');
        else if (result.user.role === 'doctor') navigate('/doctor');
        else navigate('/patient');
      } else {
        setMessage({ text: result.message || 'Invalid credentials', type: 'error' });
      }
    } else {
      const result = await registerUser(formData);
      if (result.success) {
        setMessage({ text: 'Account created! Please sign in.', type: 'success' });
        setIsLogin(true);
      } else {
        setMessage({ text: result.message || 'Registration failed', type: 'error' });
      }
    }
    setLoading(false);
  };

  const fillDemo = (email, password) => {
    setFormData(prev => ({ ...prev, email, password }));
    setIsLogin(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#fff' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: '48%', background: '#0c1428', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 56px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle top-right accent block */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '180px', height: '180px',
          background: 'rgba(37,99,235,0.08)', borderBottomLeftRadius: '100%'
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '120px', height: '120px',
          background: 'rgba(37,99,235,0.05)', borderTopRightRadius: '100%'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '40px', height: '40px', background: '#2563eb', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <div>
            <span style={{ color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>
              Care<span style={{ color: '#3b82f6' }}>Grid</span>
            </span>
          </div>
        </div>

        {/* Main Copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '46px',
            lineHeight: 1.1, color: '#fff', marginBottom: '20px', letterSpacing: '-1.5px'
          }}>
            Integrated<br />
            <span style={{ color: '#3b82f6' }}>Healthcare</span><br />
            Platform
          </h1>

          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7, maxWidth: '340px', marginBottom: '48px' }}>
            A unified platform for managing doctors, patients,
            and appointments with role-based access control.
          </p>

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '48px' }}>
            {[
              { icon: '⬡', label: 'Role-based Access', sub: 'Admin · Doctor · Patient' },
              { icon: '⬡', label: 'Appointment Management', sub: 'Book, approve & track' },
              { icon: '⬡', label: 'Live Statistics', sub: 'Real-time dashboard data' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', background: 'rgba(37,99,235,0.15)',
                  border: '1px solid rgba(37,99,235,0.25)', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#3b82f6', fontSize: '14px', flexShrink: 0
                }}>
                  <svg width="14" height="14" fill="#3b82f6" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5 1.4-1.4L9 14.2 18.6 4.6z" />
                  </svg>
                </div>
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, margin: 0 }}>{f.label}</p>
                  <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Credentials */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '28px' }}>
            <p style={{ color: '#475569', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginBottom: '12px' }}>
              QUICK DEMO ACCESS
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: 'Admin', email: 'admin@hms.com', pw: 'admin123', color: '#7c3aed' },
                { label: 'Doctor', email: 'ramesh@hms.com', pw: 'doc123', color: '#0891b2' },
                { label: 'Patient', email: 'rahul@hms.com', pw: 'pat123', color: '#059669' },
              ].map(d => (
                <button key={d.label} onClick={() => fillDemo(d.email, d.pw)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: '8px', border: `1px solid ${d.color}33`,
                    background: `${d.color}15`, color: d.color, fontSize: '12px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                    letterSpacing: '0.3px'
                  }}
                  onMouseEnter={e => { e.target.style.background = `${d.color}28`; e.target.style.borderColor = `${d.color}66`; }}
                  onMouseLeave={e => { e.target.style.background = `${d.color}15`; e.target.style.borderColor = `${d.color}33`; }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ color: '#334155', fontSize: '12px', position: 'relative', zIndex: 1 }}>
          © 2026 CareGrid
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', background: '#f8fafc'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Tab Toggle */}
          <div style={{
            display: 'flex', background: '#e2e8f0', borderRadius: '10px',
            padding: '4px', marginBottom: '36px'
          }}>
            {['Sign In', 'Register'].map((t, i) => (
              <button key={t} onClick={() => { setIsLogin(i === 0); setMessage({ text: '', type: '' }); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '7px', border: 'none',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '14px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: (isLogin && i === 0) || (!isLogin && i === 1) ? '#fff' : 'transparent',
                  color: (isLogin && i === 0) || (!isLogin && i === 1) ? '#0f172a' : '#94a3b8',
                  boxShadow: (isLogin && i === 0) || (!isLogin && i === 1) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '28px',
              color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.8px'
            }}>
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              {isLogin ? 'Access your role-based dashboard' : 'Get started with CareGrid'}
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
              fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
              background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: message.type === 'error' ? '#b91c1c' : '#15803d',
              border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
            }}>
              <span style={{ fontSize: '14px' }}>{message.type === 'error' ? '⚠' : '✓'}</span>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input name="full_name" type="text" required onChange={handleChange}
                  placeholder="Dr. John Smith"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
                    border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a',
                    outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Email address
              </label>
              <input name="email" type="email" required onChange={handleChange} value={formData.email}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
                  border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a',
                  outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Password</label>
              </div>
              <input name="password" type="password" required onChange={handleChange} value={formData.password}
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
                  border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a',
                  outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Register as
                </label>
                <select name="role" onChange={handleChange}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
                    border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a',
                    outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
                    transition: 'border-color 0.15s', cursor: 'pointer'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: '9px', border: 'none',
                background: loading ? '#93c5fd' : '#2563eb', color: '#fff',
                fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
                transition: 'all 0.2s', letterSpacing: '0.1px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)'
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#2563eb'; }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Continue' : 'Create account'}
            </button>
          </form>

          {/* Switch Mode */}
          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#64748b' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={() => { setIsLogin(!isLogin); setMessage({ text: '', type: '' }); }}
              style={{
                background: 'none', border: 'none', color: '#2563eb', fontWeight: 700,
                fontSize: '13px', cursor: 'pointer', marginLeft: '5px', fontFamily: "'DM Sans', sans-serif"
              }}>
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>OR CONTINUE AS</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Role Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { role: 'Admin', email: 'admin@hms.com', pw: 'admin123', icon: '⚙', color: '#7c3aed', light: '#f5f3ff' },
              { role: 'Doctor', email: 'ramesh@hms.com', pw: 'doc123', icon: '⚕', color: '#0891b2', light: '#ecfeff' },
              { role: 'Patient', email: 'rahul@hms.com', pw: 'pat123', icon: '♥', color: '#059669', light: '#f0fdf4' },
            ].map(r => (
              <button key={r.role} onClick={() => fillDemo(r.email, r.pw)}
                style={{
                  padding: '14px 10px', borderRadius: '10px', border: `1.5px solid ${r.color}22`,
                  background: r.light, cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s', boxSizing: 'border-box'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${r.color}55`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${r.color}22`; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '18px', marginBottom: '5px', color: r.color }}>{r.icon}</div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: r.color, fontFamily: "'Outfit', sans-serif" }}>{r.role}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Demo</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;