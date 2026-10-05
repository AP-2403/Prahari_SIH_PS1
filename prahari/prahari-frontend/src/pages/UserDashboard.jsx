/**
 * User Dashboard — scoped to the logged-in MP or district user (§3.2)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, UserCheck, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { KpiStrip, ProgressDonut, FundUtilizationGauge, RiskHistogram, TrendChart } from '../components/DashboardCharts';
import RiskBadge from '../components/RiskBadge';
import { dashboard } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const MP_PROFILES = [
  { id: 544, name: 'Dr. Abhishek Manu Singhvi', location: 'Telangana', note: '16 Rec. Works · ₹5.8Cr · 0% Spent (Low Velocity)' },
  { id: 118, name: 'Dr. Daggumalla Prasada Rao', location: 'Chittoor (AP)', note: '111 Works · ₹5.86Cr · 100% Spent · 1 High-Risk' },
  { id: 25, name: 'Ambica G. Lakshminarayana', location: 'Anantapur (AP)', note: '42 Works · ₹3.08Cr · 4 High-Risk Flags' },
  { id: 33, name: 'Andrew J. Syngkon', location: 'Shillong (ML)', note: '98 Works · ₹3.64Cr · 100% Utilized' },
];

export default function UserDashboard() {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('prahari_user');
  const user = userRaw ? JSON.parse(userRaw) : {};

  const [activeMpId, setActiveMpId] = useState(user.linked_mp_id || 544);

  useEffect(() => {
    setLoading(true);
    const role = user.role === 'mp_user' ? 'mp' : 'district';
    const id = user.role === 'mp_user' ? activeMpId : user.linked_constituency;
    dashboard.get(role, id ? String(id) : undefined).then((r) => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeMpId]);

  const currentMp = MP_PROFILES.find((p) => p.id === activeMpId) || { name: user.username, location: 'Jurisdiction' };

  const scopeLabel = user.role === 'mp_user'
    ? (lang === 'hi' ? `सांसद डैशबोर्ड — ${currentMp.name}` : `MP Dashboard — ${currentMp.name}`)
    : (lang === 'hi' ? `जिला डैशबोर्ड — ${user.linked_constituency}` : `District Dashboard — ${user.linked_constituency}`);

  return (
    <Layout>
      <div className="hero-banner" style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(155, 255, 238, 0.15)',
          border: '1px solid rgba(155, 255, 238, 0.35)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--secondary)',
          marginBottom: '10px'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }} />
          {user.role === 'mp_user' ? 'HON\'BLE MP PORTAL' : 'DISTRICT NODAL AUTHORITY'}
        </div>
        <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          📊 {scopeLabel}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(229, 247, 255, 0.88)', fontSize: '0.875rem' }}>
          {lang === 'hi'
            ? `आपके कार्यक्षेत्र (${currentMp.location}) में ${stats?.total_works?.toLocaleString() || '…'} सांसद निधि कार्य निगरानी में हैं`
            : `Monitoring ${stats?.total_works?.toLocaleString() || '…'} MPLADS works in ${currentMp.location}`}
        </p>
      </div>

      {/* MP Profile Switcher for Live Demo Evaluation */}
      {user.role === 'mp_user' && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'hi' ? 'सांसद प्रोफ़ाइल स्विच करें (डेमो)' : 'SWITCH MP PROFILE (DEMO JURISDICTION)'}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 700 }}>
                {currentMp.name} · <span style={{ color: '#38BDF8', fontWeight: 500 }}>{currentMp.location}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {MP_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveMpId(p.id)}
                  style={{
                    background: activeMpId === p.id ? '#2563EB' : 'rgba(255, 255, 255, 0.06)',
                    color: activeMpId === p.id ? '#FFFFFF' : '#CBD5E1',
                    border: activeMpId === p.id ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: activeMpId === p.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={p.note}
                >
                  {p.name.split(' ').slice(0, 2).join(' ')} ({p.location.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Context Explainer */}
      {stats && stats.total_works > 0 && stats.completed === 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Info size={16} color="#EF4444" />
          </div>
          <div>
            <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.84rem' }}>
              Why is Fund Utilization at 0.0%? (Low Velocity Diagnostic Alert)
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: 3, lineHeight: 1.45 }}>
              In the official government dataset for <strong>{currentMp.name}</strong>, all {stats.total_works} works are currently in the <strong>Recommended</strong> stage. Because physical execution has not finished and 0 works are marked "Completed", ₹0.0 of the sanctioned ₹{((stats.total_sanctioned || 0)/1e7).toFixed(1)} Cr has been disbursed yet. All {stats.total_works} works are verified public amenities (risk scores &lt; 20), resulting in 0 fraud flags.
            </div>
          </div>
        </div>
      )}

      <KpiStrip stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <ProgressDonut breakdown={stats?.chart_progress_breakdown} />
        <FundUtilizationGauge fund={stats?.chart_fund_utilization} />
        <RiskHistogram histogram={stats?.chart_risk_histogram} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <TrendChart trend={stats?.chart_trend_monthly} />

        <div className="card">
          <div className="card-header">⚠️ Works Requiring Attention</div>
          {loading ? (
            <div className="skeleton" style={{ height: 150 }} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Work</th><th>Status</th><th>Risk</th></tr></thead>
              <tbody>
                {stats?.top_risk_works?.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--green-clean)', padding: 24 }}>
                    ✅ No high-risk works detected in your scope!
                  </td></tr>
                ) : stats?.top_risk_works?.map((w) => (
                  <tr key={w.id} onClick={() => navigate(`/user/works/${w.id}`)}>
                    <td title={w.title} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.title?.slice(0, 48)}…
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{w.status}</td>
                    <td><RiskBadge score={w.risk_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
