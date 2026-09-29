/**
 * Ministry Dashboard — national heatmap hero + KPI strip (§12)
 * Uses Leaflet + OpenStreetMap for the map (no API key needed)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { KpiStrip, ProgressDonut, FundUtilizationGauge, RiskHistogram, TrendChart } from '../components/DashboardCharts';
import RiskBadge from '../components/RiskBadge';
import { dashboard } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

// Leaflet lazy-loaded to avoid SSR issues
let LeafletMap = null;

function MapPlaceholder({ works }) {
  const [MapComponent, setMapComponent] = useState(null);

  useEffect(() => {
    // Lazy load Leaflet only in browser
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([L, RL]) => {
      const { MapContainer, TileLayer, CircleMarker, Popup } = RL;
      // Fix default icon paths
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      setMapComponent(() => ({ worksData }) => {
        const riskColor = (score) =>
          score >= 70 ? '#DC2626' : score >= 40 ? '#F59E0B' : '#16A34A';

        return (
          <MapContainer center={[20.5, 78.9]} zoom={5} style={{ height: 420, width: '100%', borderRadius: 12 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {worksData
              .filter((w) => w.lat && w.lng)
              .slice(0, 500)
              .map((w) => (
                <CircleMarker
                  key={w.id}
                  center={[w.lat, w.lng]}
                  radius={w.risk_score >= 70 ? 8 : 5}
                  fillColor={riskColor(w.risk_score)}
                  color="white"
                  weight={1}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <strong>{w.title?.slice(0, 60)}…</strong><br />
                    <small>{w.constituency}, {w.state}</small><br />
                    Risk: {w.risk_score?.toFixed(0) || 'N/A'}/100
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        );
      });
    }).catch(() => {
      setMapComponent(() => () => (
        <div className="map-placeholder">
          <div>🗺️ Map loading... (ensure Leaflet is installed)</div>
        </div>
      ));
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="map-placeholder">
        <div>🗺️ Loading national heatmap…</div>
      </div>
    );
  }

  return <MapComponent worksData={works} />;
}

export default function MinistryDashboard() {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboard.get('ministry').then((r) => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const nationalKpis = stats?.national_kpis;

  return (
    <Layout>
      {/* Top Hero Banner with AI Surveillance Background */}
      <div className="hero-banner" id="tour-hero-banner" data-tour="hero-banner">
        <div style={{ maxWidth: '780px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(155, 255, 238, 0.15)',
            border: '1px solid rgba(155, 255, 238, 0.35)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--secondary)',
            marginBottom: '12px',
            letterSpacing: '0.04em'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block', boxShadow: '0 0 10px var(--secondary)' }} />
            {lang === 'hi' ? 'सक्रिय राष्ट्रीय एआई निगरानी प्रणाली' : 'ACTIVE NATIONAL AI AUDIT PIPELINE'}
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            🇮🇳 {lang === 'hi' ? 'मंत्रालय डैशबोर्ड — राष्ट्रीय अवलोकन' : 'Ministry Dashboard — National Overview'}
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(229, 247, 255, 0.88)', fontSize: '0.875rem', lineHeight: 1.55 }}>
            {lang === 'hi' 
              ? `सभी सांसदों के ${stats?.total_works?.toLocaleString() || '…'} सांसद निधि कार्यों से वास्तविक समय डेटा विश्लेषण एवं विसंगति पहचान`
              : `Real-time data analytics, anomaly detection & fraud mitigation across ${stats?.total_works?.toLocaleString() || '…'} active MPLADS works`}
            {nationalKpis?.totalAllocated != null && ` · ${nationalKpis.totalMPs || 774} MPs · ₹${((nationalKpis.totalAllocated || 0)/1e9).toFixed(1)}B ${lang === 'hi' ? 'कुल आवंटन' : 'total allocation'}`}
          </p>
        </div>
      </div>

      {/* National KPI strip from JSON snapshot (§5.7) */}
      {nationalKpis && nationalKpis.totalAllocated != null && (
        <div id="tour-national-kpis" data-tour="national-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: lang === 'hi' ? 'कुल आवंटन' : 'Total Allocation', value: `₹${((nationalKpis.totalAllocated || 0)/1e9).toFixed(1)}B`, sub: lang === 'hi' ? `${nationalKpis.totalMPs || 774} सांसदों में` : `Across ${nationalKpis.totalMPs || 774} MPs` },
            { label: lang === 'hi' ? 'कुल व्यय' : 'Total Expenditure', value: `₹${((nationalKpis.totalExpenditure || 0)/1e9).toFixed(1)}B`, sub: `${(nationalKpis.expenditurePercentage || 0).toFixed(1)}% ${lang === 'hi' ? 'आवंटित का' : 'of allocated'}` },
            { label: lang === 'hi' ? 'पूर्ण कार्य' : 'Works Completed', value: (nationalKpis.totalWorksCompleted || 0).toLocaleString(), sub: `${(nationalKpis.completionRate || 0).toFixed(1)}% ${lang === 'hi' ? 'पूर्णता दर' : 'completion rate'}` },
            { label: lang === 'hi' ? 'लंबित कार्य' : 'Pending Works', value: (nationalKpis.pendingWorks || 0).toLocaleString(), sub: lang === 'hi' ? 'प्रगति पर' : 'Not yet completed' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ borderTop: '3px solid var(--navy)' }}>
              <div className="card-header">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* PRAHARI AI analysis KPIs */}
      <div id="tour-kpi-strip" data-tour="kpi-strip">
        <KpiStrip stats={stats} />
      </div>

      {/* Hero map */}
      <div className="card" id="tour-hero-map" data-tour="hero-map" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--amber)" /> {t('where_funds_used', 'Where Funds Are Used')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {t('heat_map_subtitle', 'Constituency-level pins · Green = low risk · Amber = medium · Red = high')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              ['🟢', t('risk_low', 'Low')],
              ['🟡', t('risk_medium', 'Medium')],
              ['🔴', t('risk_high', 'High')]
            ].map(([dot, label]) => (
              <span key={label} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                {dot} {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <MapPlaceholder works={stats?.top_risk_works || []} />
        </div>
      </div>

      {/* Charts row */}
      <div id="tour-charts-row" data-tour="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <ProgressDonut breakdown={stats?.chart_progress_breakdown} />
        <FundUtilizationGauge fund={stats?.chart_fund_utilization} />
        <RiskHistogram histogram={stats?.chart_risk_histogram} />
      </div>

      {/* Trend + Top risk works */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <div id="tour-trend-chart" data-tour="trend-chart">
          <TrendChart trend={stats?.chart_trend_monthly} />
        </div>

        {/* Top 10 highest risk works */}
        <div className="card" id="tour-top-risk-works" data-tour="top-risk-works">
          <div className="card-header">🚨 {t('top_high_risk', 'Top High-Risk Works')}</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('th_work', 'Work')}</th>
                <th>{t('th_district', 'District')}</th>
                <th>{t('th_risk', 'Risk')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3}><div className="skeleton" style={{ height: 20, width: '80%' }} /></td></tr>
              ) : stats?.top_risk_works?.map((w) => (
                <tr key={w.id} onClick={() => navigate(`/admin/works/${w.id}`)}>
                  <td title={w.title} style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.title?.slice(0, 50)}…
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{w.constituency}</td>
                  <td><RiskBadge score={w.risk_score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
