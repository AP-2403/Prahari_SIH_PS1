/**
 * RiskBadge — colored badge + score number
 * score: 0-100 | undefined shows "N/A"
 */
import { useLanguage } from '../context/LanguageContext';

export default function RiskBadge({ score, size = 'sm' }) {
  const { lang, t } = useLanguage();
  if (score == null) return <span className="risk-badge risk-none">{lang === 'hi' ? 'अनुपलब्ध' : 'N/A'}</span>;

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  let label = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM' : 'LOW RISK';
  if (lang === 'hi') {
    label = score >= 70 ? 'उच्च जोखिम' : score >= 40 ? 'मध्यम जोखिम' : 'कम जोखिम';
  }
  const dot = score >= 70 ? '🔴' : score >= 40 ? '🟡' : '🟢';

  return (
    <span className={`risk-badge risk-${level}`} title={`Risk score: ${score}/100`}>
      {dot} {Math.round(score)} — {label}
    </span>
  );
}
