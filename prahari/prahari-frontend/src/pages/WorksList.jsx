/**
 * WorksList — searchable, filterable table of works (shared admin & user)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import { works as worksApi } from '../api/client';
import { Search, Filter } from 'lucide-react';

export default function WorksList() {
  const [worksList, setWorksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minRisk, setMinRisk] = useState('');
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('prahari_user');
  const user = userRaw ? JSON.parse(userRaw) : {};

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (minRisk) params.min_risk = minRisk;
    setLoading(true);
    worksApi.list(params).then((r) => {
      setWorksList(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter, minRisk]);

  const filtered = worksList.filter((w) =>
    !search || w.title?.toLowerCase().includes(search.toLowerCase()) || w.constituency?.toLowerCase().includes(search.toLowerCase())
  );

  const basePath = user.role === 'admin' ? '/admin' : '/user';

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
          📋 Works Database
        </h1>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filtered.length} works shown
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search works or constituency..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160, padding: '10px 12px' }}>
          <option value="">All Statuses</option>
          <option value="Recommended">Recommended</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="input" value={minRisk} onChange={(e) => setMinRisk(e.target.value)} style={{ width: 160, padding: '10px 12px' }}>
          <option value="">All Risk Levels</option>
          <option value="70">High Risk (70+)</option>
          <option value="40">Medium+ (40+)</option>
          <option value="1">Any Scored</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Work</th>
                <th>Category</th>
                <th>District</th>
                <th>MP</th>
                <th>Sanctioned</th>
                <th>Status</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No works found</td></tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} onClick={() => navigate(`${basePath}/works/${w.id}`)}>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={w.title}>
                      <div style={{ fontWeight: 500 }}>{w.title?.slice(0, 55)}{w.title?.length > 55 ? '…' : ''}</div>
                      {w.work_id_source && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{w.work_id_source}</div>}
                    </td>
                    <td><span className="chip" style={{ background: 'var(--surface-2)', color: 'var(--navy)' }}>{w.category}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{w.constituency}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.mp_name?.slice(0, 25)}</td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>₹{((w.sanctioned_amount || 0) / 1e5).toFixed(1)}L</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: w.status === 'Completed' ? 'var(--green-clean)' : 'var(--amber)', fontWeight: 600 }}>
                        {w.status}
                      </span>
                    </td>
                    <td><RiskBadge score={w.risk_score} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
