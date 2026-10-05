/**
 * Modern Dashboard Charts & Metric Strips (Recharts)
 * PRAHARI — AI Sentinel for MPLADS Surveillance | SIH 2026
 */
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const RISK_COLORS = ['#0D9488', '#14B8A6', '#F59E0B', '#F97316', '#DC2626'];

export function KpiStrip({ stats }) {
  const { t } = useLanguage();
  if (!stats) return <div className="skeleton" style={{ height: 110, marginBottom: 24, borderRadius: 16 }} />;

  const kpis = [
    {
      label: t('total_works', 'Total Works'),
      value: stats.total_works?.toLocaleString(),
      sub: `${stats.completed?.toLocaleString() || 0} ${t('completed_sub', 'completed')}`,
      color: '#0284C7'
    },
    {
      label: t('fund_utilization', 'Fund Utilization'),
      value: `${stats.utilization_pct?.toFixed(1)}%`,
      sub: `₹${(stats.total_expenditure / 1e7).toFixed(1)}Cr ${t('spent_sub', 'spent')}`,
      color: '#0D9488'
    },
    {
      label: t('high_risk_works', 'High-Risk Works'),
      value: stats.high_risk_count,
      sub: 'score ≥ 70/100 · urgent',
      danger: true,
      color: '#DC2626'
    },
    {
      label: t('duplicate_flags', 'Duplicate Flags'),
      value: stats.duplicate_flag_count,
      sub: t('pending_review', 'pending review'),
      color: '#D97706'
    },
    {
      label: t('vendor_collusion', 'Vendor Collusion'),
      value: stats.vendor_collusion_count,
      sub: t('suspicious_rings', 'suspicious rings'),
      color: '#6366F1'
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
      {kpis.map((k, i) => (
        <div
          key={i}
          className="card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderTop: `3px solid ${k.color}`,
            background: k.danger ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF5F5 100%)' : '#FFFFFF'
          }}
        >
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8
          }}>
            {k.label}
          </div>
          <div
            className="kpi-value"
            style={{
              color: k.danger ? '#DC2626' : 'var(--navy)',
              fontSize: '1.9rem',
              fontWeight: 850
            }}
          >
            {k.value}
          </div>
          <div style={{
            fontSize: '0.74rem',
            color: k.danger ? '#B91C1C' : '#64748B',
            marginTop: 4,
            fontWeight: 600
          }}>
            {k.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressDonut({ breakdown }) {
  const { t } = useLanguage();
  if (!breakdown) return <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />;
  const data = [
    { name: t('status_completed', 'Completed'), value: breakdown.completed || 0, color: '#0D9488' },
    { name: t('status_recommended', 'Recommended'), value: breakdown.recommended || 0, color: '#38BDF8' },
  ];
  return (
    <div className="card" style={{ height: 270, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">📊 {t('progress_overview', 'Progress Overview')}</div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              formatter={(v) => v.toLocaleString()}
              contentStyle={{ background: '#002B49', color: '#FFFFFF', borderRadius: 8, border: 'none', fontSize: '0.78rem' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#0D9488' }} /> Completed ({data[0].value.toLocaleString()})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#38BDF8' }} /> Recommended ({data[1].value.toLocaleString()})
        </span>
      </div>
    </div>
  );
}

export function FundUtilizationGauge({ fund }) {
  const { t } = useLanguage();
  if (!fund) return <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />;
  const pct = fund.utilization_pct || 0;
  const color = pct > 85 ? '#0D9488' : pct > 50 ? '#F59E0B' : '#DC2626';
  return (
    <div className="card" style={{ height: 270, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">💰 {t('fund_utilization', 'Fund Utilization')}</div>
      <div style={{ textAlign: 'center', padding: '10px 0 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '2.8rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
          {pct.toFixed(1)}%
        </div>
        <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, marginTop: 4 }}>
          {pct > 50 ? 'Healthy Velocity' : 'Low Velocity Warning'}
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
          <div style={{ textAlign: 'left', background: 'var(--surface)', padding: '6px 10px', borderRadius: 8 }}>
            <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Sanctioned</div>
            <div style={{ fontWeight: 800, color: 'var(--navy)' }}>₹{(fund.sanctioned / 1e7).toFixed(1)}Cr</div>
          </div>
          <div style={{ textAlign: 'right', background: 'var(--surface)', padding: '6px 10px', borderRadius: 8 }}>
            <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Disbursed</div>
            <div style={{ fontWeight: 800, color: 'var(--navy)' }}>₹{(fund.used / 1e7).toFixed(1)}Cr</div>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12, height: 7 }}>
          <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

export function RiskHistogram({ histogram }) {
  const { t } = useLanguage();
  if (!histogram) return <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />;
  return (
    <div className="card" style={{ height: 270, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">📈 {t('risk_distribution', 'Risk Distribution')}</div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 10, right: 10, bottom: 4, left: -16 }}>
            <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#64748B' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
            <Tooltip
              contentStyle={{ background: '#002B49', color: '#FFFFFF', borderRadius: 8, border: 'none', fontSize: '0.78rem' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {histogram.map((_, i) => (
                <Cell key={i} fill={RISK_COLORS[i] || '#94A3B8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrendChart({ trend }) {
  const { t } = useLanguage();
  if (!trend || !trend.length) return <div className="skeleton" style={{ height: 270, borderRadius: 16 }} />;
  return (
    <div className="card" style={{ height: 280, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">📉 {t('monthly_trend', 'Monthly Expenditure Trend')}</div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 10, right: 12, bottom: 4, left: -14 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
            <YAxis tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} tick={{ fontSize: 10, fill: '#64748B' }} />
            <Tooltip
              formatter={(v) => `₹${(v / 1e5).toFixed(1)}L`}
              contentStyle={{ background: '#002B49', color: '#FFFFFF', borderRadius: 8, border: 'none', fontSize: '0.78rem' }}
            />
            <Line
              type="monotone"
              dataKey="expenditure"
              stroke="#0D9488"
              strokeWidth={3}
              dot={{ fill: '#38BDF8', stroke: '#002B49', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#0D9488' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
