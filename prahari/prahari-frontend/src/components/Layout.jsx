/**
 * Modern Sidebar & Topbar Layout shared by Admin and User panels
 * PRAHARI — AI Sentinel for MPLADS Surveillance | SIH 2026
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, AlertTriangle, Settings, Map,
  GitBranch, MessageCircle, Users, LogOut, Shield, Eye,
  BarChart3, ChevronRight, Globe, Sparkles, Activity, Bell
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

  // Format breadcrumbs nicely
  const breadcrumbMapHi = {
    'admin': 'प्रशासक',
    'user': 'उपयोगकर्ता',
    'ministry': 'मंत्रालय',
    'state': 'राज्य',
    'district': 'ज़िला',
    'works': 'कार्य',
    'upload': 'डेटा अपलोड',
    'review': 'समीक्षा',
    'vendors': 'विक्रेता',
    'engines': 'इंजन नियंत्रण',
    'assistant': 'एआई सहायक',
    'dashboard': 'डैशबोर्ड',
    'alerts': 'चेतावनियां',
    'citizen': 'नागरिक',
  };
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbText = pathParts.map((p) => {
    if (lang === 'hi' && breadcrumbMapHi[p.toLowerCase()]) {
      return breadcrumbMapHi[p.toLowerCase()];
    }
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' › ');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      {/* ── Modern Sleek Sidebar ── */}
      <aside style={{
        width: '260px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #020B14 0%, #031424 50%, #010810 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 20
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 22px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/prahari-emblem.png"
              alt="PRAHARI Data Governance Emblem"
              style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 14px rgba(13, 148, 136, 0.45))'
              }}
            />
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 850, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>PRAHARI</span>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#F59E0B',
                  padding: '1px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>AI</span>
              </div>
              <div style={{ color: '#38BDF8', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('app_subtitle', 'MPLADS AUDIT ENGINE')}
              </div>
            </div>
          </div>

          {/* Live Engine Status Pill */}
          <div style={{
            marginTop: '14px',
            background: 'rgba(13, 148, 136, 0.1)',
            border: '1px solid rgba(13, 148, 136, 0.25)',
            borderRadius: '8px',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.68rem',
            color: '#2DD4BF',
            fontWeight: 700
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2DD4BF', boxShadow: '0 0 8px #2DD4BF', animation: 'pulse 1.2s infinite' }} />
            <span>{lang === 'hi' ? 'एआई निगरानी सक्रिय (15-मिनट)' : 'AI SURVEILLANCE ACTIVE'}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.66rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#64748B',
            padding: '8px 12px 6px'
          }}>
            {isAdmin ? (lang === 'hi' ? 'मंत्रालय पैनल' : 'National Ministry') : (lang === 'hi' ? 'उपयोगकर्ता पैनल' : 'Constituency Panel')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map((link) => {
              const active = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderRadius: '10px',
                    color: active ? '#FFFFFF' : '#94A3B8',
                    background: active
                      ? 'linear-gradient(90deg, rgba(13, 148, 136, 0.25) 0%, rgba(13, 148, 136, 0.08) 100%)'
                      : 'transparent',
                    borderLeft: active ? '3px solid #2DD4BF' : '3px solid transparent',
                    borderTop: active ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid transparent',
                    borderRight: active ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid transparent',
                    borderBottom: active ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid transparent',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    fontWeight: active ? 700 : 500,
                    transition: 'all 0.18s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <Icon size={16} color={active ? '#2DD4BF' : '#94A3B8'} />
                  <span>{link.label}</span>
                  {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6, color: '#2DD4BF' }} />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Card + Logout */}
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D9488 0%, #0369A1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem',
              border: '1.5px solid rgba(255, 255, 255, 0.2)'
            }}>
              {(user.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.68rem', textTransform: 'capitalize' }}>
                {user.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.18s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
          >
            <LogOut size={13} />
            <span>{t('logout', 'Sign Out')}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Sleek Topbar */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 15
        }}>
          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600 }}>PRAHARI</span>
            <ChevronRight size={13} style={{ opacity: 0.5 }} />
            <span style={{ color: 'var(--navy)', fontWeight: 750 }}>
              {breadcrumbText || 'Dashboard'}
            </span>
          </div>

          {/* Action Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Guided Tour Trigger Button */}
            <button
              onClick={() => startTour(0)}
              style={{
                fontSize: '0.78rem',
                gap: 6,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '6px 15px',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 3px 12px rgba(245, 158, 11, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              title={lang === 'hi' ? 'इंटरैक्टिव डेमो टूर प्रारंभ करें' : 'Start Interactive Demo Tour'}
            >
              <Sparkles size={14} color="#FFFFFF" />
              <span>{lang === 'hi' ? '🎬 डेमो टूर' : '🎬 Guided Tour'}</span>
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLang}
              style={{
                fontSize: '0.78rem',
                gap: 6,
                border: '1.5px solid var(--border)',
                background: 'var(--surface-card)',
                color: 'var(--navy)',
                borderRadius: '20px',
                padding: '5px 14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 6px rgba(0, 48, 71, 0.05)'
              }}
              title={lang === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English'}
            >
              <Globe size={13} color="var(--navy)" />
              <span style={{ color: lang === 'en' ? 'var(--navy)' : 'var(--text-muted)', fontWeight: lang === 'en' ? 800 : 500 }}>EN</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span style={{ color: lang === 'hi' ? 'var(--navy)' : 'var(--text-muted)', fontWeight: lang === 'hi' ? 800 : 500 }}>हिन्दी</span>
            </button>

            {/* Ministry Seal Tag */}
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              borderLeft: '1px solid var(--border)',
              paddingLeft: '12px',
              fontWeight: 600
            }}>
              MoSPI · SIH 2026
            </div>
          </div>
        </header>

        {/* Page Container with Ample Breathing Room */}
        <div style={{
          padding: '28px 36px 48px',
          maxWidth: '1440px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
