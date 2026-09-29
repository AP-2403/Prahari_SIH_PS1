/**
 * Citizen public landing page (§3.2) — no login required
 * Accessed via QR code scan: /citizen/work/:id
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { citizen as citizenApi } from '../api/client';

export default function CitizenWork() {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    citizenApi.getWork(id).then((r) => {
      setWork(r.data);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [id]);

  const badgeConfig = {
    verified: { color: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0', icon: CheckCircle, label: 'VERIFIED' },
    pending:  { color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', icon: Clock, label: 'PENDING REVIEW' },
    flagged:  { color: '#DC2626', bg: '#FEE2E2', border: '#FECACA', icon: AlertTriangle, label: 'FLAGGED FOR REVIEW' },
  };

  const badge = badgeConfig[work?.verified_badge] || badgeConfig.pending;
  const BadgeIcon = badge.icon;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading work details…</div>
      </div>
    </div>
  );

  if (error || !work) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertTriangle size={48} style={{ marginBottom: 12, color: 'var(--amber)' }} />
        <h2>Work Not Found</h2>
        <p>Work ID {id} was not found in the PRAHARI database.</p>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: "var(--surface) url('/assets/bg-network.png') right bottom/480px no-repeat fixed",
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header with Hero Background */}
      <div style={{
        background: "linear-gradient(90deg, rgba(0, 30, 45, 0.95) 0%, rgba(0, 48, 71, 0.88) 100%), url('/assets/bg-hero.png') right center/cover no-repeat",
        padding: '18px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 20px rgba(0, 48, 71, 0.15)'
      }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={22} color="var(--dark-neutral)" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>PRAHARI</div>
          <div style={{ color: 'var(--secondary)', fontSize: '0.72rem', fontWeight: 600 }}>MPLADS Public Transparency & Verification Portal</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        {/* Verification badge */}
        <div id="tour-citizen-badge" data-tour="citizen-badge" style={{
          background: badge.bg, border: `1.5px solid ${badge.border}`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <BadgeIcon size={32} color={badge.color} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: badge.color }}>{badge.label}</div>
            <div style={{ fontSize: '0.8rem', color: badge.color, opacity: 0.8 }}>
              {work.verified_badge === 'verified' && 'This work has been field-verified by district officers.'}
              {work.verified_badge === 'pending' && 'PRAHARI AI audit in progress. Report any concerns below.'}
              {work.verified_badge === 'flagged' && 'This work has been flagged for administrative review.'}
            </div>
          </div>
        </div>

        {/* Work info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.4 }}>
            {work.title}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            {work.constituency}, {work.state}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Category', value: work.category },
              { label: 'Status', value: work.status, color: work.status === 'Completed' ? 'var(--green-clean)' : 'var(--amber)' },
              { label: 'Fund Allocated', value: `₹${((work.sanctioned_amount || 0) / 1e5).toFixed(1)} Lakh` },
              { label: 'Completion', value: work.completion_date ? new Date(work.completion_date).toLocaleDateString('en-IN') : 'In Progress' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: item.color || 'var(--navy)', marginTop: 2 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Work ID for tracking */}
        <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>PRAHARI Work Reference</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>
            {work.work_id_source || `PRAHARI-${id}`}
          </div>
        </div>

        {/* Photos */}
        {work.photos?.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>📸 Progress Documentation</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {work.photos.map((p) => (
                <div key={p.id} className="asset-placeholder" style={{ height: 120, borderRadius: 8 }}>
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    {p.progress_pct_claimed != null ? `${p.progress_pct_claimed}% Complete` : 'Photo'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip line */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Report a Concern</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            If this work seems incomplete or fraudulent, report to your district MPLADS office or call <strong>1800-XXX-XXXX</strong>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 24 }}>
          Powered by PRAHARI · SIH 2026 · The_Semicolons
        </p>
      </div>
    </div>
  );
}
