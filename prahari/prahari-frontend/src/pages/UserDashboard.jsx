/**
 * User Dashboard — scoped to the logged-in MP or district user (§3.2)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { KpiStrip, ProgressDonut, FundUtilizationGauge, RiskHistogram, TrendChart } from '../components/DashboardCharts';
import RiskBadge from '../components/RiskBadge';
import { dashboard } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function UserDashboard() {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('prahari_user');
  const user = userRaw ? JSON.parse(userRaw) : {};

  useEffect(() => {
    const role = user.role === 'mp_user' ? 'mp' : 'district';
    const id = user.linked_mp_id || user.linked_constituency;
    dashboard.get(role, id ? String(id) : undefined).then((r) => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const scopeLabel = user.role === 'mp_user'
    ? (lang === 'hi' ? 'सांसद कार्यक्षेत्र डैशबोर्ड' : 'MP Dashboard')
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
          {user.role === 'mp_user' ? 'HONBLE MP PORTAL' : 'DISTRICT NODAL AUTHORITY'}
        </div>
        <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          📊 {scopeLabel}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(229, 247, 255, 0.88)', fontSize: '0.875rem' }}>
          {lang === 'hi'
            ? `आपके कार्यक्षेत्र में ${stats?.total_works?.toLocaleString() || '…'} सांसद निधि कार्य निगरानी में हैं`
            : `Monitoring ${stats?.total_works?.toLocaleString() || '…'} MPLADS works in your jurisdiction`}
        </p>
      </div>

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
