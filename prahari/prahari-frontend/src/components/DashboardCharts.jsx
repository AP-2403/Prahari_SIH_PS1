/**
 * KPI strip + risk histogram + progress donut (Recharts)
 * Used on every dashboard
 */
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const RISK_COLORS = ['#0D9488', '#14B8A6', '#F59E0B', '#F97316', '#DC2626'];

export function KpiStrip({ stats }) {
  const { t } = useLanguage();
  if (!stats) return <div className="skeleton" style={{ height: 100, marginBottom: 24 }} />;

  const kpis = [
    { label: t('total_works', 'Total Works'), value: stats.total_works?.toLocaleString(), sub: `${stats.completed} ${t('completed_sub', 'completed')}` },
    { label: t('fund_utilization', 'Fund Utilization'), value: `${stats.utilization_pct?.toFixed(1)}%`, sub: `₹${(stats.total_expenditure/1e7).toFixed(1)}Cr ${t('spent_sub', 'spent')}` },
    { label: t('high_risk_works', 'High-Risk Works'), value: stats.high_risk_count, sub: 'score ≥ 70/100', danger: true },
    { label: t('duplicate_flags', 'Duplicate Flags'), value: stats.duplicate_flag_count, sub: t('pending_review', 'pending review') },
    { label: t('vendor_collusion', 'Vendor Collusion'), value: stats.vendor_collusion_count, sub: t('suspicious_rings', 'suspicious rings') },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
      {kpis.map((k, i) => (
        <div key={i} className="card" style={{ borderTop: `3px solid ${k.danger ? 'var(--red-risk)' : 'var(--navy)'}` }}>
          <div className="card-header">{k.label}</div>
          <div className="kpi-value" style={{ color: k.danger ? 'var(--red-risk)' : 'var(--navy)' }}>
            {k.value}
          </div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function ProgressDonut({ breakdown }) {
  const { t } = useLanguage();
  if (!breakdown) return <div className="skeleton" style={{ height: 220 }} />;
  const data = [
    { name: t('status_completed', 'Completed'), value: breakdown.completed || 0, color: '#0D9488' },
    { name: t('status_recommended', 'Recommended'), value: breakdown.recommended || 0, color: '#9bacff' },
  ];
  return (
    <div className="card" style={{ height: 260 }}>
      <div className="card-header">📊 {t('progress_overview', 'Progress Overview')}</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FundUtilizationGauge({ fund }) {
  const { t } = useLanguage();
  if (!fund) return <div className="skeleton" style={{ height: 220 }} />;
  const pct = fund.utilization_pct || 0;
  const color = pct > 85 ? '#0D9488' : pct > 50 ? '#F59E0B' : '#DC2626';
  return (
    <div className="card" style={{ height: 260 }}>
      <div className="card-header">💰 {t('fund_utilization', 'Fund Utilization')}</div>
      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color }}>{pct.toFixed(1)}%</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>utilized</div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'var(--text-muted)' }}>Sanctioned</div>
            <div style={{ fontWeight: 700 }}>₹{(fund.sanctioned / 1e7).toFixed(1)}Cr</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-muted)' }}>Spent</div>
            <div style={{ fontWeight: 700 }}>₹{(fund.used / 1e7).toFixed(1)}Cr</div>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

export function RiskHistogram({ histogram }) {
  const { t } = useLanguage();
  if (!histogram) return <div className="skeleton" style={{ height: 220 }} />;
  return (
    <div className="card" style={{ height: 260 }}>
      <div className="card-header">📈 {t('risk_distribution', 'Risk Distribution')}</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={histogram} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {histogram.map((_, i) => (
              <Cell key={i} fill={RISK_COLORS[i] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ trend }) {
  const { t } = useLanguage();
  if (!trend || !trend.length) return <div className="skeleton" style={{ height: 220 }} />;
  return (
    <div className="card" style={{ height: 260 }}>
      <div className="card-header">📉 {t('monthly_trend', 'Monthly Expenditure Trend')}</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D7EFFC" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => `₹${(v / 1e5).toFixed(1)}L`} />
          <Line type="monotone" dataKey="expenditure" stroke="#003047" strokeWidth={2.5} dot={{ fill: '#9bffee', stroke: '#003047', strokeWidth: 2, r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
