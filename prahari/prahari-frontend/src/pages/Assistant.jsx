import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { assistant as assistantApi } from '../api/client';
import { Send, Database, MessageCircle, Key, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Assistant() {
  const { t, lang } = useLanguage();
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('prahari_gemini_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiKey);
  const [keySaved, setKeySaved] = useState(false);

  const SUGGESTED = lang === 'hi' ? [
    'सांसद निधि में एससी/एसटी आरक्षण के क्या नियम हैं?',
    'मेरे जिले में कौन से काम समय सीमा से अधिक हैं?',
    'वित्तीय विसंगति इंजन में बेनफोर्ड नियम का उपयोग कैसे होता है?',
    'विक्रेता एकाग्रता और सांठगांठ की गणना कैसे की जाती है?',
  ] : [
    'What MPLADS rules govern SC/ST earmarking?',
    'Which works are overdue beyond the statutory deadline?',
    'Explain the Benford\'s Law check used in the financial engine.',
    'How is the vendor collusion confidence calculated?',
  ];

  const SQL_SUGGESTED = lang === 'hi' ? [
    '70 से अधिक जोखिम स्कोर वाले सभी कार्यों की सूची दिखाएं',
    'कुल व्यय के आधार पर शीर्ष 10 सांसदों की सूची बनाएं',
    'वे सभी पूर्ण कार्य दिखाएं जिनमें कोई फोटो अपलोड नहीं है',
    'किस जिले में सबसे अधिक विलंबित कार्य हैं?',
  ] : [
    'List all works with risk score above 70',
    'Show top 10 MPs by total expenditure',
    'Find all completed works with no photos',
    'Which districts have the most overdue works?',
  ];

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: lang === 'hi'
        ? 'नमस्ते! मैं प्रहरी एआई सहायक हूँ। मैं सांसद निधि (MPLADS) दिशानिर्देशों, विसंगति स्कोर, या लाइव डेटाबेस प्रश्नों (Text-to-SQL) में आपकी सहायता कर सकता हूँ।\n\nआप कोई भी प्रश्न पूछ सकते हैं, जैसे: *"एससी/एसटी आवंटन नियम क्या हैं?"* या मुफ़्त Google Gemini API कुंजी जोड़कर असीमित प्रश्न पूछ सकते हैं।'
        : 'Hello! I\'m the PRAHARI AI Assistant. I can answer questions about MPLADS guidelines, audit anomalies, or query live works data (Text-to-SQL).\n\nTry asking: *"What is the SC/ST earmarking requirement?"* or connect your free Google Gemini API key to ask any custom question.',
    },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');  // 'chat' | 'sql'
  const [loading, setLoading] = useState(false);
  const [sqlResult, setSqlResult] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function saveKey() {
    const trimmed = keyInput.trim();
    setGeminiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('prahari_gemini_key', trimmed);
    } else {
      localStorage.removeItem('prahari_gemini_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyConfig(false);
    }, 1200);
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    setSqlResult(null);

    const activeKey = geminiKey || localStorage.getItem('prahari_gemini_key') || '';

    try {
      if (mode === 'sql') {
        const res = await assistantApi.query(userMsg, null, activeKey);
        const { sql, results, row_count } = res.data;
        setSqlResult({ sql, results, row_count });
        setMessages((m) => [...m, {
          role: 'ai',
          source: 'gemini',
          text: `✅ ${lang === 'hi' ? 'क्वेरी निष्पादित' : 'Query executed'} — ${row_count} ${lang === 'hi' ? 'पंक्तियां प्राप्त हुईं' : 'rows returned'}.\n\`\`\`sql\n${sql}\n\`\`\``,
        }]);
      } else {
        const res = await assistantApi.chat(userMsg, null, activeKey);
        setMessages((m) => [...m, { role: 'ai', text: res.data.response, source: res.data.source }]);
      }
    } catch (err) {
      setMessages((m) => [...m, {
        role: 'ai',
        source: 'error',
        text: `⚠️ ${lang === 'hi' ? 'त्रुटि' : 'Error'}: ${err.response?.data?.detail || err.message}\n\n💡 ${lang === 'hi' ? 'सुझाव: ऊपर "Gemini कुंजी" बटन पर क्लिक करके अपनी मुफ़्त Google Gemini API Key दर्ज करें।' : 'Tip: Click the "Gemini API Key" button above to add your free Gemini key.'}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div id="tour-assistant-panel" data-tour="assistant-panel" style={{ maxWidth: 780 }}>
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
              🤖 {lang === 'hi' ? 'प्रहरी एआई सहायक' : 'PRAHARI AI Assistant'}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {lang === 'hi'
                ? 'Google Gemini / Claude द्वारा संचालित · MPLADS दिशानिर्देश संदर्भ · लाइव डेटा हेतु Text-to-SQL'
                : 'Powered by Google Gemini / Claude · MPLADS Guidelines in Context · Text-to-SQL for Live Data'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Free Gemini Key Toggle */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowKeyConfig((v) => !v)}
              style={{
                fontSize: '0.75rem',
                border: geminiKey ? '1px solid #10B981' : '1px dashed var(--border)',
                color: geminiKey ? '#059669' : 'var(--navy)',
                background: geminiKey ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              }}
              title="Add or update free Google Gemini API Key"
            >
              <Key size={13} />
              <span>{geminiKey ? (lang === 'hi' ? 'Gemini सक्रिय ✓' : 'Gemini Active ✓') : (lang === 'hi' ? 'Gemini कुंजी (मुफ़्त)' : 'Add Gemini Key (Free)')}</span>
            </button>

            {/* Mode toggle */}
            <button className={`btn ${mode === 'chat' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode('chat')}>
              <MessageCircle size={14} /> {lang === 'hi' ? 'बातचीत' : 'Chat'}
            </button>
            <button className={`btn ${mode === 'sql' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode('sql')}>
              <Database size={14} /> {lang === 'hi' ? 'एसक्यूएल' : 'SQL Query'}
            </button>
          </div>
        </div>

        {/* Gemini Key Config Drawer */}
        {showKeyConfig && (
          <div className="card" style={{ marginBottom: 16, background: '#F8FAFC', border: '1.5px solid #0284C7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#0284C7" />
                <span>{lang === 'hi' ? 'Google Gemini API कुंजी कॉन्फ़िगर करें' : 'Configure Google Gemini API Key'}</span>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.74rem', color: '#0284C7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
              >
                <span>{lang === 'hi' ? 'मुफ़्त कुंजी प्राप्त करें (AI Studio)' : 'Get Free Key (Google AI Studio)'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
              {lang === 'hi'
                ? 'Google Gemini मुफ़्त 15 अनुरोध प्रति मिनट (1,500 अनुरोध प्रतिदिन) बिना क्रेडिट कार्ड के प्रदान करता है। आप अपनी कुंजी यहाँ पेस्ट कर सकते हैं (ब्राउज़र में सुरक्षित रहती है) या Vercel में GEMINI_API_KEY सेट कर सकते हैं।'
                : 'Google Gemini provides 15 free requests/min (1,500 requests/day) at zero cost. Paste your key below (stored safely in your browser) or set GEMINI_API_KEY in Vercel environment variables.'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                className="input"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.82rem', fontFamily: 'monospace' }}
              />
              <button className="btn btn-primary btn-sm" onClick={saveKey} style={{ minWidth: 90 }}>
                {keySaved ? <><Check size={14} /> {lang === 'hi' ? 'सहेजा गया' : 'Saved'}</> : (lang === 'hi' ? 'सहेजें' : 'Save Key')}
              </button>
              {geminiKey && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setKeyInput(''); setGeminiKey(''); localStorage.removeItem('prahari_gemini_key'); }}
                  style={{ color: '#EF4444' }}
                >
                  {lang === 'hi' ? 'हटाएं' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Suggested questions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
            {mode === 'sql' ? (lang === 'hi' ? '💡 सुझाई गई एसक्यूएल क्वेरीज़' : '💡 SQL Suggestions') : (lang === 'hi' ? '💡 सुझाए गए प्रश्न' : '💡 Suggested questions')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(mode === 'sql' ? SQL_SUGGESTED : SUGGESTED).map((s) => (
              <button key={s} className="chip" onClick={() => setInput(s)} style={{ background: 'var(--surface-2)', color: 'var(--navy)', cursor: 'pointer', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem' }}>
                {s.slice(0, 50)}{s.length > 50 ? '…' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="card" style={{ marginBottom: 12, height: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'ai' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>PRAHARI</span>
                  {m.source === 'gemini' && <span style={{ color: '#0284C7', fontWeight: 700 }}>· Google Gemini AI</span>}
                  {m.source === 'claude' && <span style={{ color: '#D97706', fontWeight: 700 }}>· Claude AI</span>}
                  {m.source === 'fallback' && <span style={{ color: '#64748B' }}>· Rule Engine</span>}
                </div>
              )}
              <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {m.text.split('```').map((part, pi) =>
                    pi % 2 === 1 ? (
                      <pre key={pi} style={{ background: '#1E293B', color: '#E2E8F0', padding: '10px', borderRadius: 8, fontSize: '0.78rem', overflow: 'auto', margin: '6px 0' }}>
                        {part.trim()}
                      </pre>
                    ) : (
                      <span key={pi} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div className="chat-bubble-ai" style={{ color: 'var(--text-muted)' }}>
                ⏳ {lang === 'hi' ? 'प्रहरी एआई विश्लेषण कर रहा है…' : 'Thinking…'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* SQL result table */}
        {sqlResult && sqlResult.results.length > 0 && (
          <div className="card" style={{ marginBottom: 12, maxHeight: 300, overflow: 'auto' }}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              {lang === 'hi' ? `क्वेरी परिणाम (${sqlResult.row_count} पंक्तियां)` : `Query Results (${sqlResult.row_count} rows)`}
            </div>
            <table className="data-table">
              <thead>
                <tr>{Object.keys(sqlResult.results[0]).map((k) => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {sqlResult.results.map((row, i) => (
                  <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? '—')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={mode === 'sql'
              ? (lang === 'hi' ? 'डेटा का विवरण लिखें जिसे आप देखना चाहते हैं…' : 'Describe what data you want to see…')
              : (lang === 'hi' ? 'सांसद निधि दिशानिर्देशों, विसंगतियों, या कार्यों के बारे में पूछें…' : 'Ask about MPLADS guidelines, anomalies, or specific works…')}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </Layout>
  );
}
