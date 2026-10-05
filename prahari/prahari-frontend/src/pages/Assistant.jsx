/**
 * AI Assistant chat + text-to-SQL (§11, §14)
 */
import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { assistant as assistantApi } from '../api/client';
import { Send, Database, MessageCircle } from 'lucide-react';

const SUGGESTED = [
  'What MPLADS rules govern SC/ST earmarking?',
  'मेरे जिले में कौन से काम समय सीमा से अधिक हैं?',
  'Explain the Benford\'s Law check used in the financial engine.',
  'How is the vendor concentration confidence calculated?',
];

const SQL_SUGGESTED = [
  'List all works with risk score above 70',
  'Show top 10 MPs by total expenditure',
  'Find all completed works with no photos',
  'Which districts have the most overdue works?',
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'नमस्ते! I\'m the PRAHARI Assistant. I can answer questions about MPLADS guidelines, explain flagged works, or run SQL queries against the live database.\n\nTry asking: *"What is the SC/ST earmarking requirement?"* or use the SQL mode to query works data directly.',
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

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    setSqlResult(null);

    try {
      if (mode === 'sql') {
        const res = await assistantApi.query(userMsg);
        const { sql, results, row_count } = res.data;
        setSqlResult({ sql, results, row_count });
        setMessages((m) => [...m, {
          role: 'ai',
          text: `✅ Query executed — ${row_count} rows returned.\n\`\`\`sql\n${sql}\n\`\`\``,
        }]);
      } else {
        const res = await assistantApi.chat(userMsg);
        setMessages((m) => [...m, { role: 'ai', text: res.data.response, source: res.data.source }]);
      }
    } catch (err) {
      setMessages((m) => [...m, {
        role: 'ai',
        text: `⚠️ Error: ${err.response?.data?.detail || err.message}. \n\n(If using SQL mode, ensure ANTHROPIC_API_KEY is set in backend env.)`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div id="tour-assistant-panel" data-tour="assistant-panel" style={{ maxWidth: 740 }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
              🤖 PRAHARI AI Assistant
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Powered by Claude · MPLADS guidelines in context · Text-to-SQL for live data
            </p>
          </div>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${mode === 'chat' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode('chat')}>
              <MessageCircle size={14} /> Chat
            </button>
            <button className={`btn ${mode === 'sql' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode('sql')}>
              <Database size={14} /> SQL Query
            </button>
          </div>
        </div>

        {/* Suggested questions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
            {mode === 'sql' ? '💡 SQL Suggestions' : '💡 Suggested questions'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(mode === 'sql' ? SQL_SUGGESTED : SUGGESTED).map((s) => (
              <button key={s} className="chip" onClick={() => setInput(s)} style={{ background: 'var(--surface-2)', color: 'var(--navy)', cursor: 'pointer', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem' }}>
                {s.slice(0, 45)}{s.length > 45 ? '…' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="card" style={{ marginBottom: 12, height: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'ai' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  PRAHARI {m.source === 'fallback' ? '(Fallback mode)' : ''}
                </div>
              )}
              <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {m.text.split('```').map((part, pi) =>
                    pi % 2 === 1 ? (
                      <pre key={pi} style={{ background: '#1E293B', color: '#E2E8F0', padding: '10px', borderRadius: 8, fontSize: '0.78rem', overflow: 'auto' }}>
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
                ⏳ Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* SQL result table */}
        {sqlResult && sqlResult.results.length > 0 && (
          <div className="card" style={{ marginBottom: 12, maxHeight: 300, overflow: 'auto' }}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              Query Results ({sqlResult.row_count} rows)
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
            placeholder={mode === 'sql' ? 'Describe what data you want to see…' : 'Ask about MPLADS guidelines, anomalies, or specific works…'}
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
