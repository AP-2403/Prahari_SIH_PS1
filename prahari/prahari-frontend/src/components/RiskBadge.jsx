/**
 * RiskBadge — colored badge + score number
 * score: 0-100 | undefined shows "N/A"
 */
export default function RiskBadge({ score, size = 'sm' }) {
  if (score == null) return <span className="risk-badge risk-none">N/A</span>;

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const label = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM' : 'LOW RISK';
  const dot = score >= 70 ? '🔴' : score >= 40 ? '🟡' : '🟢';

  return (
    <span className={`risk-badge risk-${level}`} title={`Risk score: ${score}/100`}>
      {dot} {Math.round(score)} — {label}
    </span>
  );
}
