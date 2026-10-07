/**
 * Engine Control — admin can re-run engines and adjust settings (§3.1)
 */
import { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { engines as enginesApi } from '../api/client';
import { Play, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EngineControl() {
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const pollRef = useRef();
  const { t, lang } = useLanguage();

  const ENGINE_INFO = [
    {
      name: 'Compliance Rule Engine',
      nameHi: 'अनुपालन नियम इंजन',
      key: 'compliance',
      desc: 'SC/ST earmark, ineligible category, deadline breach, trust cap',
      descHi: 'अनुसूचित जाति/जनजाति आवंटन, अपात्र श्रेणी, समय सीमा उल्लंघन, ट्रस्ट सीमा',
      weight: 40
    },
    {
      name: 'Financial Anomaly Engine',
      nameHi: 'वित्तीय विसंगति इंजन',
      key: 'financial_anomaly',
      desc: "IsolationForest + Benford's Law + just-under-threshold clustering",
      descHi: 'आइसोलेशनफॉरेस्ट + बेनफोर्ड का नियम + सीमा के ठीक नीचे क्लस्टरिंग',
      weight: 35
    },
    {
      name: 'Duplicate & Ghost Detector',
      nameHi: 'डुप्लिकेट व फर्जी परियोजना डिटेक्टर',
      key: 'duplicate_ghost',
      desc: 'sentence-transformers cosine similarity + imagehash phash',
      descHi: 'सेंटेंस-ट्रांसफॉर्मर्स कोसाइन समानता + इमेजहैश पीएचैश',
      weight: 25
    },
    {
      name: 'Vendor Network Intelligence',
      nameHi: 'विक्रेता नेटवर्क विश्लेषण',
      key: 'vendor_network',
      desc: 'NetworkX + Louvain community detection for collusion rings',
      descHi: 'नेटवर्कएक्स + ल्यूवेन कम्युनिटी डिटेक्शन (सांठगांठ सिंडिकेट हेतु)',
      weight: 15
    },
    {
      name: 'Predictive Delay Engine',
      nameHi: 'पूर्वानुमानित विलंब इंजन',
      key: 'predictive_delay',
      desc: 'GradientBoostingClassifier — probability of missing deadline',
      descHi: 'ग्रेडिएंटबूस्टिंग क्लासिफायर — समय सीमा चूकने की संभावना',
      weight: 10
    },
  ];

  async function runEngines() {
    setRunning(true);
    try {
      const res = await enginesApi.run();
      const newJobId = res.data.job_id;
      setJobId(newJobId);
      setJobStatus({ status: 'running', stage: 'init', progress_pct: 0, log: ['Engine run initiated...'] });

      pollRef.current = setInterval(async () => {
        try {
          const s = await enginesApi.status(newJobId);
          setJobStatus(s.data);
          if (['done', 'error'].includes(s.data.status)) {
            clearInterval(pollRef.current);
            setRunning(false);
          }
        } catch {
          clearInterval(pollRef.current);
          setRunning(false);
        }
      }, 2000);
    } catch (e) {
      setRunning(false);
      alert('Engine run failed: ' + (e.response?.data?.detail || e.message));
    }
  }

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
          {lang === 'hi' ? 'प्रहरी एआई कोर मूल्यांकन' : 'PRAHARI AI CORE HEURISTICS'}
        </div>
        <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          ⚙️ {t('engine_control_panel', 'Engine Control Panel')}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(229, 247, 255, 0.88)', fontSize: '0.875rem' }}>
          {lang === 'hi'
            ? 'सभी 5 एआई धोखाधड़ी जांच इंजनों को पुनः चलाएं · मॉडल प्रदर्शन देखें · ऑडिट स्कोरिंग विवरण'
            : 'Re-run all 5 AI fraud detection engines · View model performance · Audit scoring telemetry'}
        </p>
      </div>

      {/* Run button */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{t('re_run_all_engines', 'Re-run All Engines')}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('engine_desc', 'Scores up to 3,000 works across all 5 engines. Takes 2-5 minutes on first run (model training included).')}
            </div>
          </div>
          <button className="btn btn-primary" onClick={runEngines} disabled={running}>
            {running ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('running_engines', 'Running...')}</> : <><Play size={14} /> {t('run_engines', 'Run Engines')}</>}
          </button>
        </div>

        {/* Processing log */}
        {jobStatus && (
          <div style={{ marginTop: 16 }}>
            <div className="progress-bar" style={{ marginBottom: 8, height: 8 }}>
              <div className="progress-fill" style={{
                width: `${jobStatus.progress_pct}%`,
                background: jobStatus.status === 'done' ? 'var(--green-clean)' : 'var(--amber)',
              }} />
            </div>
            <div style={{ background: '#0F172A', borderRadius: 8, padding: '12px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#94A3B8', maxHeight: 250, overflowY: 'auto', marginTop: 8 }}>
              {jobStatus.log?.slice(-20).map((line, i) => (
                <div key={i} style={{ color: line.includes('✅') ? '#4ADE80' : line.includes('❌') ? '#F87171' : line.includes('⚠️') ? '#FCD34D' : '#94A3B8' }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Engine cards */}
      <div id="tour-engine-cards" data-tour="engine-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {ENGINE_INFO.map((e) => (
          <div key={e.key} className="card" style={{ borderLeft: `4px solid var(--navy)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>
                {lang === 'hi' ? e.nameHi : e.name}
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                {lang === 'hi' ? 'अधिकतम' : 'Max'}: {e.weight}{lang === 'hi' ? ' अंक' : 'pts'}
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'hi' ? e.descHi : e.desc}
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(e.weight / 40) * 100}%`, background: 'var(--navy)' }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {lang === 'hi'
                  ? `भार: ${e.weight} / 125 कुल अंक → 0-100 में सामान्यीकृत`
                  : `Weight: ${e.weight} / 125 total points → normalized to 0-100`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
