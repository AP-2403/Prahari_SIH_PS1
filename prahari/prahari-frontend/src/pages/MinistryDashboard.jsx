/**
 * Ministry Dashboard — national heatmap hero + KPI strip (§12)
 * Uses Leaflet + OpenStreetMap for the map (no API key needed)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, AlertCircle, TrendingUp, Layers, Filter, Compass, Building2, Map as MapIcon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { KpiStrip, ProgressDonut, FundUtilizationGauge, RiskHistogram, TrendChart } from '../components/DashboardCharts';
import RiskBadge from '../components/RiskBadge';
import { dashboard } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

// Leaflet lazy-loaded to avoid SSR issues
let LeafletMap = null;

function MapPlaceholder({ works, center }) {
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

      setMapComponent(() => ({ worksData, mapCenter }) => {
        const riskColor = (score) =>
          score >= 70 ? '#DC2626' : score >= 40 ? '#F59E0B' : '#16A34A';

        const validCoords = worksData.filter((w) => w.lat && w.lng);
        const autoCenter = mapCenter || (validCoords.length > 0 ? [validCoords[0].lat, validCoords[0].lng] : [20.5, 78.9]);
        const autoZoom = mapCenter ? 7 : (validCoords.length > 0 && validCoords.length < 50 ? 9 : 5);

        return (
          <MapContainer center={autoCenter} zoom={autoZoom} style={{ height: 420, width: '100%', borderRadius: 12 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {validCoords
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
        <div>🗺️ Loading GIS surveillance map…</div>
      </div>
    );
  }

  return <MapComponent worksData={works} mapCenter={center} />;
}

const TOP_STATES = ['Uttar Pradesh', 'Maharashtra', 'Gujarat', 'Tamil Nadu', 'Andhra Pradesh', 'Bihar', 'Rajasthan', 'Madhya Pradesh', 'Karnataka'];
const TOP_DISTRICTS = ['CHITTOOR', 'VARANASI', 'AGRA', 'GWALIOR', 'SATNA', 'AMROHA', 'PUNE', 'NAGPUR', 'LUCKNOW'];

export default function MinistryDashboard() {
  const { lang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Active view mode derived from path
  const viewMode = location.pathname.includes('/admin/state')
    ? 'state'
    : location.pathname.includes('/admin/district')
      ? 'district'
      : 'ministry';

  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('CHITTOOR');
  const [geoOptions, setGeoOptions] = useState({ states: [], districts: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load distinct states and districts on mount
  useEffect(() => {
    dashboard.getGeo().then((res) => {
      if (res.data) setGeoOptions(res.data);
    }).catch(() => {});
  }, []);

  // Fetch telemetry whenever viewMode, selectedState or selectedDistrict changes
  useEffect(() => {
    setLoading(true);
    const scopeId = viewMode === 'state' ? selectedState : viewMode === 'district' ? selectedDistrict : null;
    dashboard.get(viewMode, scopeId).then((r) => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [viewMode, selectedState, selectedDistrict]);

  const nationalKpis = stats?.national_kpis;

  // Title and subtitle according to view mode
  const titleInfo = {
    ministry: {
      badge: lang === 'hi' ? 'सक्रिय राष्ट्रीय एआई निगरानी प्रणाली' : 'ACTIVE NATIONAL AI AUDIT PIPELINE',
      title: lang === 'hi' ? 'मंत्रालय डैशबोर्ड — राष्ट्रीय अवलोकन' : 'Ministry Dashboard — National Overview',
      desc: lang === 'hi' 
        ? `सभी सांसदों के ${stats?.total_works?.toLocaleString() || '…'} सांसद निधि कार्यों से वास्तविक समय डेटा विश्लेषण एवं विसंगति पहचान`
        : `Real-time data analytics, anomaly detection & fraud mitigation across ${stats?.total_works?.toLocaleString() || '…'} active MPLADS works`
    },
    state: {
      badge: lang === 'hi' ? '🏛️ राज्य स्तरीय निगरानी एवं अंकेक्षण' : '🏛️ STATE SURVEILLANCE & MACRO AUDIT',
      title: lang === 'hi' ? `राज्य डैशबोर्ड — ${selectedState}` : `State Surveillance — ${selectedState}`,
      desc: lang === 'hi'
        ? `${selectedState} राज्य के सभी संसदीय निर्वाचन क्षेत्रों के निधि आवंटन, उपयोग एवं जोखिम विश्लेषण`
        : `State-level macro risk oversight, fund flow telemetry and local anomaly clustering for ${selectedState}`
    },
    district: {
      badge: lang === 'hi' ? '📍 जिला प्राधिकरण एवं समाहर्ता निगरानी' : '📍 DISTRICT COLLECTORATE OVERSIGHT',
      title: lang === 'hi' ? `जिला प्राधिकार डैशबोर्ड — ${selectedDistrict}` : `District Oversight — ${selectedDistrict}`,
      desc: lang === 'hi'
        ? `${selectedDistrict} निर्वाचन क्षेत्र में स्वीकृत कार्यों की भौतिक प्रगति, फोटो सत्यापन एवं संवेदक जोखिम`
        : `Constituency work sanction tracking, contractor cluster analysis and ground photo forensics in ${selectedDistrict}`
    }
  }[viewMode];

  return (
    <Layout>
      {/* Top Hero Banner */}
      <div className="hero-banner" id="tour-hero-banner" data-tour="hero-banner">
        <div style={{ maxWidth: '820px' }}>
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
            {titleInfo.badge}
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.25, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 20,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'linear-gradient(180deg, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%)',
              position: 'relative'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid #000080', display: 'inline-block' }} />
            </span>
            <span>{titleInfo.title}</span>
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(229, 247, 255, 0.88)', fontSize: '0.875rem', lineHeight: 1.55 }}>
            {titleInfo.desc}
            {viewMode === 'ministry' && nationalKpis?.totalAllocated != null && ` · ${nationalKpis.totalMPs || 774} MPs · ₹${((nationalKpis.totalAllocated || 0)/1e9).toFixed(1)}B ${lang === 'hi' ? 'कुल आवंटन' : 'total allocation'}`}
          </p>
        </div>
      </div>

      {/* State View Selector Ribbon */}
      {viewMode === 'state' && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid rgba(13, 148, 136, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(13, 148, 136, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapIcon size={18} color="#0D9488" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'hi' ? 'सक्रिय राज्य चयन' : 'SELECT ACTIVE STATE'}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700 }}>
                  {selectedState}
                </div>
              </div>
            </div>

            {/* Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {(geoOptions.states.length > 0 ? geoOptions.states : TOP_STATES).map((st) => (
                  <option key={st} value={st} style={{ background: '#0F172A', color: '#FFFFFF' }}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick State Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginRight: 4 }}>
              {lang === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}
            </span>
            {TOP_STATES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedState(st)}
                style={{
                  background: selectedState === st ? '#0D9488' : 'rgba(255, 255, 255, 0.06)',
                  color: selectedState === st ? '#FFFFFF' : '#CBD5E1',
                  border: selectedState === st ? '1px solid #0D9488' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '3px 9px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: selectedState === st ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* District View Selector Ribbon */}
      {viewMode === 'district' && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'hi' ? 'सक्रिय जिला / निर्वाचन क्षेत्र' : 'SELECT ACTIVE DISTRICT / CONSTITUENCY'}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700 }}>
                  {selectedDistrict}
                </div>
              </div>
            </div>

            {/* Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {(geoOptions.districts.length > 0 ? geoOptions.districts : TOP_DISTRICTS).map((dst) => (
                  <option key={dst} value={dst} style={{ background: '#0F172A', color: '#FFFFFF' }}>{dst}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick District Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginRight: 4 }}>
              {lang === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}
            </span>
            {TOP_DISTRICTS.map((dst) => (
              <button
                key={dst}
                type="button"
                onClick={() => setSelectedDistrict(dst)}
                style={{
                  background: selectedDistrict === dst ? '#F59E0B' : 'rgba(255, 255, 255, 0.06)',
                  color: selectedDistrict === dst ? '#000000' : '#CBD5E1',
                  border: selectedDistrict === dst ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '3px 9px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: selectedDistrict === dst ? 750 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {dst}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* National KPI strip (only on Ministry View) */}
      {viewMode === 'ministry' && nationalKpis && nationalKpis.totalAllocated != null && (
        <div id="tour-national-kpis" data-tour="national-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: lang === 'hi' ? 'कुल आवंटन' : 'Total Allocation', value: `₹${((nationalKpis.totalAllocated || 0)/1e9).toFixed(1)}B`, sub: lang === 'hi' ? `${nationalKpis.totalMPs || 774} सांसदों में` : `Across ${nationalKpis.totalMPs || 774} MPs`, color: '#0284C7' },
            { label: lang === 'hi' ? 'कुल व्यय' : 'Total Expenditure', value: `₹${((nationalKpis.totalExpenditure || 0)/1e9).toFixed(1)}B`, sub: `${(nationalKpis.expenditurePercentage || 0).toFixed(1)}% ${lang === 'hi' ? 'आवंटित का' : 'of allocated'}`, color: '#0D9488' },
            { label: lang === 'hi' ? 'पूर्ण कार्य' : 'Works Completed', value: (nationalKpis.totalWorksCompleted || 0).toLocaleString(), sub: `${(nationalKpis.completionRate || 0).toFixed(1)}% ${lang === 'hi' ? 'पूर्णता दर' : 'completion rate'}`, color: '#6366F1' },
            { label: lang === 'hi' ? 'लंबित कार्य' : 'Pending Works', value: (nationalKpis.pendingWorks || 0).toLocaleString(), sub: lang === 'hi' ? 'प्रगति पर' : 'Not yet completed', color: '#F59E0B' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ borderTop: `3.5px solid ${k.color}` }}>
              <div className="card-header">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* State Scoped Macro Strip (on State View) */}
      {viewMode === 'state' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: lang === 'hi' ? 'राज्य में कुल कार्य' : 'Total Works in State', value: stats.total_works?.toLocaleString() || '0', sub: `${selectedState}`, color: '#0D9488' },
            { label: lang === 'hi' ? 'कुल स्वीकृत राशि' : 'Sanctioned Amount', value: `₹${((stats.total_sanctioned || 0)/1e7).toFixed(1)} Cr`, sub: lang === 'hi' ? 'स्वीकृत निधि' : 'Sanctioned Pool', color: '#0284C7' },
            { label: lang === 'hi' ? 'व्यय एवं उपयोग' : 'Fund Expenditure', value: `₹${((stats.total_expenditure || 0)/1e7).toFixed(1)} Cr`, sub: `${stats.utilization_pct || 0}% ${lang === 'hi' ? 'उपयोग दर' : 'utilized'}`, color: '#6366F1' },
            { label: lang === 'hi' ? 'उच्च जोखिम कार्य' : 'High Risk Flagged', value: stats.high_risk_count?.toLocaleString() || '0', sub: lang === 'hi' ? 'जांच आवश्यक' : 'Audit required', color: '#EF4444' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ borderTop: `3.5px solid ${k.color}` }}>
              <div className="card-header">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* District Scoped Strip (on District View) */}
      {viewMode === 'district' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: lang === 'hi' ? 'निर्वाचन क्षेत्र में कार्य' : 'Constituency Works', value: stats.total_works?.toLocaleString() || '0', sub: `${selectedDistrict}`, color: '#F59E0B' },
            { label: lang === 'hi' ? 'स्वीकृत राशि' : 'Sanctioned Limit', value: `₹${((stats.total_sanctioned || 0)/1e5).toFixed(1)} L`, sub: lang === 'hi' ? 'आवंटित' : 'Constituency allocation', color: '#0284C7' },
            { label: lang === 'hi' ? 'व्यय राशि' : 'Disbursed Expenditure', value: `₹${((stats.total_expenditure || 0)/1e5).toFixed(1)} L`, sub: `${stats.utilization_pct || 0}% ${lang === 'hi' ? 'उपयोग' : 'utilization'}`, color: '#10B981' },
            { label: lang === 'hi' ? 'निरीक्षण कतार' : 'Inspection Queue', value: stats.high_risk_count?.toLocaleString() || '0', sub: lang === 'hi' ? 'फोटो फोरेंसिक आवश्यक' : 'Photo verification queue', color: '#EF4444' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ borderTop: `3.5px solid ${k.color}` }}>
              <div className="card-header">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
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
