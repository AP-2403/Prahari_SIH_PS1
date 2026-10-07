import { useLanguage } from '../context/LanguageContext';

export default function ShapReasonCard({ reasons = [], confidenceBreakdown = {}, guidelineClause }) {
  const { t } = useLanguage();

  if (!reasons.length && !Object.keys(confidenceBreakdown).length) {
    return (
      <div className="card" style={{ borderLeft: '4px solid #E2E8F0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {t('no_risk_factors', 'No risk factors detected — engines have not run yet or this work is clean.')}
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
      <div className="card-header" style={{ color: 'var(--amber)', marginBottom: '12px' }}>
        🔍 {t('why_flagged_title', 'Why This Work Was Flagged')}
      </div>

      {guidelineClause && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
          fontSize: '0.8rem', color: '#92400E'
        }}>
          📋 {guidelineClause}
        </div>
      )}

      {/* Plain-English SHAP reasons */}
      {reasons.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            {t('ai_explanation', 'AI Explanation')}
          </div>
          {reasons.map((r, i) => (
            <div key={i} style={{
              padding: '10px 12px',
              background: 'var(--surface-2)',
              borderRadius: '8px',
              marginBottom: '6px',
              fontSize: '0.825rem',
              lineHeight: '1.5',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--navy)' }}>#{i + 1}</span>{' '}
              <span dangerouslySetInnerHTML={{ __html: r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
            </div>
          ))}
        </div>
      )}

      {/* Confidence by irregularity */}
      {Object.keys(confidenceBreakdown).length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            {t('detection_breakdown', 'Detection Confidence Breakdown')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.values(confidenceBreakdown)
              .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
              .slice(0, 6)
              .map((item, i) => {
                const conf = item.confidence || 0;
                const color = conf >= 80 ? '#DC2626' : conf >= 60 ? '#D97706' : '#16A34A';
                return (
                  <div key={i} title={`${item.detail}\n\nMethod: ${item.method}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 500 }}>{item.label}</span>
                      <span style={{ color, fontWeight: 700 }}>{Math.round(conf)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${conf}%`, background: color }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Method: {item.method}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
