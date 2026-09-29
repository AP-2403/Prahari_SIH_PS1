/**
 * VendorGraph — interactive force-directed network (§7.4)
 * Uses vis-network for the graph renderer
 */
import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { vendors } from '../api/client';

const CLUSTER_COLORS = [
  '#003047', '#9bacff', '#0D9488', '#F59E0B', '#9bdeff',
  '#DC2626', '#9bffee', '#6366F1', '#0891B2', '#059669',
];

export default function VendorGraph() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    vendors.graph().then((r) => {
      setGraphData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    import('vis-network/standalone').then(({ Network, DataSet }) => {
      const nodes = new DataSet(
        graphData.nodes.slice(0, 300).map((n) => ({
          id: n.id,
          label: n.label?.slice(0, 25),
          color: CLUSTER_COLORS[n.community % CLUSTER_COLORS.length],
          font: { color: 'white', size: 10 },
          shape: n.type === 'vendor' ? 'diamond' : n.type === 'mp' ? 'star' : 'dot',
          size: Math.min(10 + Math.log10((n.total_value || 1) + 1) * 3, 30),
          title: `${n.label}\nType: ${n.type}\nTotal: ₹${((n.total_value || 0) / 1e5).toFixed(1)}L\nCluster: ${n.community}`,
        }))
      );

      const edges = new DataSet(
        graphData.edges.slice(0, 600).map((e, i) => ({
          id: i,
          from: e.from,
          to: e.to,
          width: Math.min(1 + Math.log10((e.weight || 1) + 1) * 0.5, 6),
          color: { color: 'rgba(100,116,139,0.3)' },
          title: `₹${((e.weight || 0) / 1e5).toFixed(1)}L`,
        }))
      );

      const options = {
        physics: {
          enabled: true,
          barnesHut: { gravitationalConstant: -8000, centralGravity: 0.3, springLength: 120 },
          stabilization: { iterations: 150 },
        },
        interaction: { hover: true, tooltipDelay: 100 },
        layout: { improvedLayout: false },
      };

      if (networkRef.current) networkRef.current.destroy();
      networkRef.current = new Network(containerRef.current, { nodes, edges }, options);
    }).catch(console.error);

    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, [graphData]);

  return (
    <Layout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
          🕸️ Vendor Network Intelligence
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Louvain community detection · Same color = same collusion cluster · ⭐ = MP · ◆ = Vendor · ● = Agency
        </p>
      </div>

      {/* Legend + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">Network Size</div>
          <div className="kpi-value">{graphData?.node_count || '…'}</div>
          <div className="kpi-sub">{graphData?.edge_count} connections</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid #DC2626' }}>
          <div className="card-header">Collusion Rings</div>
          <div className="kpi-value" style={{ color: '#DC2626' }}>{graphData?.collusion_ring_count || 0}</div>
          <div className="kpi-sub">Louvain-detected high-risk clusters</div>
        </div>
        <div className="card">
          <div className="card-header">Concentration Flags</div>
          <div className="kpi-value">{graphData?.concentration_flags?.length || 0}</div>
          <div className="kpi-sub">Vendors with &gt;30% agency share</div>
        </div>
      </div>

      {/* Network graph */}
      <div id="tour-vendor-graph" data-tour="vendor-graph" className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="map-placeholder" style={{ height: 500 }}>
            <div>⏳ Building vendor network graph...</div>
          </div>
        ) : (
          <div ref={containerRef} style={{ height: 500, background: '#F8FAFC' }} />
        )}
      </div>

      {/* Concentration flags table */}
      {graphData?.concentration_flags?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">⚠️ Vendor Concentration Flags (&gt;30% agency spend)</div>
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Agency</th>
                <th>Share %</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {graphData.concentration_flags.slice(0, 20).map((f, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{f.vendor}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.agency?.slice(0, 40)}</td>
                  <td>
                    <span style={{ color: f.spend_pct > 50 ? '#DC2626' : '#D97706', fontWeight: 700 }}>
                      {f.spend_pct?.toFixed(1)}%
                    </span>
                  </td>
                  <td>₹{((f.vendor_amount || 0) / 1e5).toFixed(1)}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
