/**
 * Login page (§18)
 * Shows after logout or on first visit.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Globe, PlayCircle } from 'lucide-react';
import { auth } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useDemoTour } from '../context/DemoTourContext';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Admin — Full access' },
  { username: 'mp.singhvi', password: 'mp2026', role: 'MP User — Abhishek Manu Singhvi' },
  { username: 'district.chittoor', password: 'district123', role: 'District User — Chittoor' },
];

export default function Login() {
  const { lang, toggleLang, t } = useLanguage();
  const { startTour } = useDemoTour();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login(username, password);
      localStorage.setItem('prahari_token', res.data.token);
      localStorage.setItem('prahari_user', JSON.stringify(res.data));
      if (res.data.role === 'admin') {
        navigate('/admin/ministry');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(account) {
    setUsername(account.username);
    setPassword(account.password);
  }

  return (
    <div className="login-hero">
      {/* Decorative background nodes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.3)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `pulse ${2 + Math.random() * 3}s infinite`,
          }} />
        ))}
      </div>

      <div className="login-card" id="tour-login-card">
        {/* Header actions: Demo Tour & Language switch buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => startTour(0)}
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '0.75rem',
              gap: 6,
              borderRadius: 20,
              padding: '4px 12px',
              background: 'linear-gradient(135deg, var(--navy) 0%, #004566 100%)',
              border: '1px solid var(--accent)',
              color: 'var(--secondary)',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0, 48, 71, 0.2)'
            }}
            title="Start Interactive Guided Tour (SIH 2026 Walkthrough)"
          >
            <PlayCircle size={14} color="var(--secondary)" />
            <span>{lang === 'hi' ? '🎬 डेमो टूर' : '🎬 Guided Tour'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLang}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize: '0.75rem',
              gap: 5,
              borderRadius: 20,
              padding: '4px 10px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--navy)'
            }}
            title={lang === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English'}
          >
            <Globe size={13} color="var(--navy)" />
            <span style={{ fontWeight: lang === 'en' ? 800 : 500 }}>EN</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ fontWeight: lang === 'hi' ? 800 : 500 }}>हिन्दी</span>
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
            borderRadius: '18px', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            boxShadow: '0 8px 24px rgba(0, 48, 71, 0.2)'
          }}>
            <Shield size={34} color="var(--dark-neutral)" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em' }}>
            {t('app_name', 'PRAHARI')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t('login_title', 'AI-Powered MPLADS Audit Engine · SIH 2026')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>
              {t('username_label', 'Username')}
            </label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / mp.singhvi / district.chittoor"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>
              {t('password_label', 'Password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#991B1B' }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.9rem' }}>
            {loading ? '⏳ Logging in...' : `🔐 ${t('login_button', 'Login to PRAHARI')}`}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('demo_accounts', 'Demo Accounts (click to fill)')}
          </div>
          {DEMO_ACCOUNTS.map((acc) => (
            <button key={acc.username} onClick={() => quickLogin(acc)} className="btn btn-ghost btn-sm" style={{ marginBottom: 6, width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontWeight: 700, minWidth: 120 }}>{acc.username}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→ {acc.role}</span>
            </button>
          ))}
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
            {t('citizen_link_hint', 'Citizen view: /citizen/work/<id> — no login required')}
          </p>
        </div>
      </div>
    </div>
  );
}
