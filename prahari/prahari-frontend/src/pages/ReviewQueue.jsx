/**
 * ReviewQueue — admin verify/reject flagged works (§3.1)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import { feedback as feedbackApi } from '../api/client';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ReviewQueue() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minRisk, setMinRisk] = useState(40);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  useEffect(() => {
    feedbackApi.list(minRisk).then((r) => {
      setFlagged(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [minRisk]);

  const statusColor = { pending: '#F59E0B', verified: '#DC2626', false_alarm: '#16A34A' };
  const statusLabel = {
    pending: lang === 'hi' ? '⏳ समीक्षा लंबित' : '⏳ Pending',
    verified: lang === 'hi' ? '🚨 पुष्टि की गई समस्या' : '🚨 Confirmed Issue',
    false_alarm: lang === 'hi' ? '✅ गलत चेतावनी' : '✅ False Alarm'
  };

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
            🚨 {t('review_queue_title', 'Review & Verification Queue')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {flagged.length} {lang === 'hi' ? 'फ्लैग किए गए कार्य · समीक्षा या निराकरण हेतु किसी कार्य पर क्लिक करें' : 'flagged works · Click a work to verify or mark as false alarm'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('min_risk', 'Min risk score:')}</label>
          <select className="input" value={minRisk} onChange={(e) => setMinRisk(Number(e.target.value))} style={{ width: 80, padding: '6px 10px' }}>
            <option value={30}>30+</option>
            <option value={40}>40+</option>
            <option value={60}>60+</option>
            <option value={70}>70+</option>
          </select>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {['pending', 'verified', 'false_alarm'].map((s) => {
          const count = flagged.filter((f) => f.feedback_status === s).length;
          return (
            <div key={s} style={{ background: 'white', border: `2px solid ${statusColor[s]}`, borderRadius: 8, padding: '8px 16px', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 700, color: statusColor[s] }}>{count}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{statusLabel[s]}</span>
            </div>
          );
        })}
      </div>

      <div id="tour-review-queue" data-tour="review-queue" className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('th_work', 'Work')}</th>
              <th>{t('th_district', 'District')}</th>
              <th>{t('th_risk', 'Risk Score')}</th>
              <th>{lang === 'hi' ? 'प्रमुख कारण' : 'Top Flag Reason'}</th>
              <th>{t('th_status', 'Status')}</th>
              <th>{t('th_action', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="skeleton" style={{ height: 24, margin: '12px 16px' }} /></td></tr>
            ) : flagged.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                {lang === 'hi' ? '✅ किसी भी कार्य में जोखिम सीमा का उल्लंघन नहीं पाया गया। प्रणाली स्वच्छ है!' : '✅ No works meet the risk threshold. System is clean!'}
              </td></tr>
            ) : (
              flagged.map((f) => (
                <tr key={f.work_id}>
                  <td title={f.title} style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {f.title}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.constituency}</td>
                  <td><RiskBadge score={f.risk_score} /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.shap_reasons?.[0]}>
                    {f.shap_reasons?.[0]?.slice(0, 60)}…
                  </td>
                  <td>
                    <span style={{ color: statusColor[f.feedback_status], fontWeight: 600, fontSize: '0.8rem' }}>
                      {statusLabel[f.feedback_status]}
                    </span>
                    {f.feedback_note && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.feedback_note.slice(0, 40)}</div>}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/works/${f.work_id}`)}>
                      <Eye size={14} /> {lang === 'hi' ? 'समीक्षा करें' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
