/**
 * Sidebar layout shared by Admin and User panels
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, AlertTriangle, Settings, Map,
  GitBranch, MessageCircle, Users, LogOut, Shield, Eye,
  BarChart3, ChevronRight, Globe, Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDemoTour } from '../context/DemoTourContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLang, t } = useLanguage();
  const { startTour } = useDemoTour();
  const userRaw = localStorage.getItem('prahari_user');
  const user = userRaw ? JSON.parse(userRaw) : {};
  const isAdmin = user.role === 'admin';

  const adminNav = [
    { label: t('nav_ministry', 'Ministry View'), icon: LayoutDashboard, to: '/admin/ministry' },
    { label: t('nav_state', 'State View'), icon: Map, to: '/admin/state' },
    { label: t('nav_district', 'District View'), icon: BarChart3, to: '/admin/district' },
    { label: t('nav_upload', 'Upload Data'), icon: Upload, to: '/admin/upload' },
    { label: t('nav_review', 'Review Queue'), icon: AlertTriangle, to: '/admin/review' },
    { label: t('nav_vendors', 'Vendor Network'), icon: GitBranch, to: '/admin/vendors' },
    { label: t('nav_engines', 'Engine Control'), icon: Settings, to: '/admin/engines' },
    { label: t('nav_assistant', 'AI Assistant'), icon: MessageCircle, to: '/admin/assistant' },
  ];

  const userNav = [
    { label: t('nav_my_dashboard', 'My Dashboard'), icon: LayoutDashboard, to: '/user/dashboard' },
    { label: t('nav_my_works', 'My Works'), icon: Eye, to: '/user/works' },
    { label: t('nav_alerts', 'Alerts'), icon: AlertTriangle, to: '/user/alerts' },
    { label: t('nav_assistant', 'AI Assistant'), icon: MessageCircle, to: '/user/assistant' },
  ];

  const navLinks = isAdmin ? adminNav : userNav;

  function logout() {
    localStorage.removeItem('prahari_token');
    localStorage.removeItem('prahari_user');
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(155, 222, 255, 0.3)'
            }}>
              <Shield size={22} color="var(--dark-neutral)" />
            </div>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>{t('app_name', 'PRAHARI')}</div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em' }}>{t('app_subtitle', 'MPLADS AUDIT ENGINE')}</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">{isAdmin ? t('admin_panel', 'Admin Panel') : t('user_panel', 'User Panel')}</div>
          {navLinks.map((link) => {
            const active = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
            return (
              <Link key={link.to} to={link.to} className={`nav-link ${active ? 'active' : ''}`}>
                <link.icon size={16} />
                {link.label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </div>

        {/* User info + logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.875rem'
            }}>
              {(user.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>{user.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'capitalize' }}>{user.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: '100%', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)' }}>
            <LogOut size={14} /> {t('logout', 'Logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {/* Top bar */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid var(--border)',
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {location.pathname.split('/').filter(Boolean).join(' › ')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Guided Tour Trigger Button */}
            <button
              onClick={() => startTour(0)}
              className="btn btn-sm"
              style={{
                fontSize: '0.8rem',
                gap: 6,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '5px 14px',
                border: 'none',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              title={lang === 'hi' ? 'इंटरैक्टिव डेमो टूर प्रारंभ करें' : 'Start Interactive Demo Tour'}
            >
              <Sparkles size={14} color="#FFFFFF" />
              <span>{lang === 'hi' ? '🎬 डेमो टूर' : '🎬 Guided Tour'}</span>
            </button>

            {/* Interactive Language Toggle Button */}
            <button
              onClick={toggleLang}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.8rem',
                gap: 6,
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--navy)',
                borderRadius: '20px',
                padding: '5px 14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 6px rgba(0, 48, 71, 0.06)'
              }}
              title={lang === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English'}
            >
              <Globe size={14} color="var(--navy)" />
              <span style={{ color: lang === 'en' ? 'var(--navy)' : 'var(--text-muted)', fontWeight: lang === 'en' ? 800 : 500 }}>EN</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <span style={{ color: lang === 'hi' ? 'var(--navy)' : 'var(--text-muted)', fontWeight: lang === 'hi' ? 800 : 500 }}>हिन्दी</span>
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('sih_tag', 'SIH 2026 · The_Semicolons')}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '24px 28px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
