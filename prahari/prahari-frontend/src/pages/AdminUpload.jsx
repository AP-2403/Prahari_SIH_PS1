/**
 * Admin Upload page — drag-drop + column mapping preview + Processing Console (§3.1)
 */
import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { upload as uploadApi } from '../api/client';
import { Upload, CheckCircle, AlertTriangle, Loader, RotateCw } from 'lucide-react';
import { useDemoTour } from '../context/DemoTourContext';

const STAGES = ['parsing', 'ingesting', 'scoring', 'done'];

export default function AdminUpload() {
  const { isActive: isTourActive, currentStep } = useDemoTour();
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const pollRef = useRef();
  const demoTimersRef = useRef([]);

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearDemoTimers();
  }, []);

  // Synchronize with Interactive Demo Tour
  useEffect(() => {
    if (!isTourActive) return;

    // Step 3 is "Real-Time Multi-Engine Processing Console"
    // Auto-launch the live simulated processing console if not already active
    if (currentStep?.step === 3 && !jobId) {
      simulateLiveDemoPipeline();
    }

    // Step 2 is "Data Ingestion & MoSPI DPR Upload Center"
    // Reset to upload card view if stepping back so #tour-upload-card is present
    if (currentStep?.step === 2 && jobId) {
      clearDemoTimers();
      setJobId(null);
      setJobStatus(null);
    }
  }, [isTourActive, currentStep?.step, jobId]);

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setPreview(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function confirmUpload() {
    if (!preview) return;
    setError('');
    try {
      const res = await uploadApi.confirm(preview.upload_id, {});
      const newJobId = res.data.job_id;
      setJobId(newJobId);
      setJobStatus({ status: 'running', stage: 'parsing', progress_pct: 0, log: ['Starting...'] });

      // Poll every 1.5 seconds
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await uploadApi.status(newJobId);
          setJobStatus(statusRes.data);
          if (['done', 'error'].includes(statusRes.data.status)) {
            clearInterval(pollRef.current);
          }
        } catch (e) {
          clearInterval(pollRef.current);
        }
      }, 1500);
    } catch (e) {
      setError(e.response?.data?.detail || 'Confirm failed');
    }
  }

  function reset() {
    clearDemoTimers();
    setPreview(null);
    setJobId(null);
    setJobStatus(null);
    clearInterval(pollRef.current);
  }

  function loadDemoDocument() {
    setPreview({
      upload_id: 'demo_mospi_dpr_batch_2026',
      detected_type: 'Recommended Works & DPR Manifest',
      row_count: 24,
      issues: [],
      column_mapping: {
        'Work ID': 'work_id',
        'Project Title': 'title',
        'Constituency': 'constituency',
        'State': 'state',
        'Sanction Amount (INR)': 'sanction_amount',
        'Vendor GSTIN': 'vendor_gstin',
        'GPS Lat': 'lat',
        'GPS Lng': 'lng',
        'Target Milestone': 'milestone'
      },
      preview_rows: [
        { 'Work ID': 'W-2026-CH-01', 'Project Title': 'CC Road from SC Colony to Main Junction', 'Constituency': 'Chittoor', 'State': 'Andhra Pradesh', 'Sanction Amount (INR)': '₹48,50,000', 'Vendor GSTIN': '37AABCU9603R1ZM', 'Target Milestone': '100% Completed' },
        { 'Work ID': 'W-2026-CH-02', 'Project Title': 'Solar RO Drinking Water Plant at Panchayat', 'Constituency': 'Chittoor', 'State': 'Andhra Pradesh', 'Sanction Amount (INR)': '₹18,20,000', 'Vendor GSTIN': '37AABCU9603R1ZM', 'Target Milestone': '75% Installed' },
        { 'Work ID': 'W-2026-CH-03', 'Project Title': 'High School Additional Classrooms Block', 'Constituency': 'Chittoor', 'State': 'Andhra Pradesh', 'Sanction Amount (INR)': '₹35,00,000', 'Vendor GSTIN': '37BKLPY4512Q1ZX', 'Target Milestone': '50% Masonry' },
        { 'Work ID': 'W-2026-CH-04', 'Project Title': 'Primary Health Centre Anganwadi Shed', 'Constituency': 'Chittoor', 'State': 'Andhra Pradesh', 'Sanction Amount (INR)': '₹14,90,000', 'Vendor GSTIN': '37BKLPY4512Q1ZX', 'Target Milestone': '25% Foundation' },
      ]
    });
  }

  function simulateLiveDemoPipeline() {
    clearDemoTimers();
    setJobId('demo_job_' + Date.now());
    setJobStatus({
      status: 'running',
      stage: 'parsing',
      progress_pct: 18,
      log: [
        '⚙️ [00:01] Initializing PRAHARI Multi-Engine Ingestion Pipeline...',
        '📥 [00:02] Reading MoSPI DPR CSV structure: 24 projects detected.',
        '🔍 [00:03] Auto-mapping 9 schema columns to standard MPLADS entities...',
      ]
    });

    const t1 = setTimeout(() => {
      setJobStatus({
        status: 'running',
        stage: 'ingesting',
        progress_pct: 48,
        log: [
          '⚙️ [00:01] Initializing PRAHARI Multi-Engine Ingestion Pipeline...',
          '📥 [00:02] Reading MoSPI DPR CSV structure: 24 projects detected.',
          '🔍 [00:03] Auto-mapping 9 schema columns to standard MPLADS entities...',
          '💾 [00:04] Verifying statutory SC/ST 15%/7.5% earmarks (MoSPI Para 3.3)... Passed.',
          '🌐 [00:05] Cross-referencing geocodes with Survey of India district boundaries...',
          '⚡ [00:06] Ingesting 24 project line items into SQLite & PostgreSQL...',
        ]
      });
    }, 1200);

    const t2 = setTimeout(() => {
      setJobStatus({
        status: 'running',
        stage: 'scoring',
        progress_pct: 82,
        log: [
          '⚙️ [00:01] Initializing PRAHARI Multi-Engine Ingestion Pipeline...',
          '📥 [00:02] Reading MoSPI DPR CSV structure: 24 projects detected.',
          '🔍 [00:03] Auto-mapping 9 schema columns to standard MPLADS entities...',
          '💾 [00:04] Verifying statutory SC/ST 15%/7.5% earmarks (MoSPI Para 3.3)... Passed.',
          '🌐 [00:05] Cross-referencing geocodes with Survey of India district boundaries...',
          '⚡ [00:06] Ingesting 24 project line items into SQLite & PostgreSQL...',
          '🌲 [00:07] Running Isolation Forest financial anomaly detector on sanction amounts...',
          '📊 [00:08] Computing Benford\'s Law Chi-Square distribution on invoice digits (p=0.038)...',
          '🕸️ [00:09] Evaluating contractor network centrality in Louvain collusion graph...',
        ]
      });
    }, 2400);

    const t3 = setTimeout(() => {
      setJobStatus({
        status: 'done',
        stage: 'done',
        progress_pct: 100,
        log: [
          '⚙️ [00:01] Initializing PRAHARI Multi-Engine Ingestion Pipeline...',
          '📥 [00:02] Reading MoSPI DPR CSV structure: 24 projects detected.',
          '🔍 [00:03] Auto-mapping 9 schema columns to standard MPLADS entities...',
          '💾 [00:04] Verifying statutory SC/ST 15%/7.5% earmarks (MoSPI Para 3.3)... Passed.',
          '🌐 [00:05] Cross-referencing geocodes with Survey of India district boundaries...',
          '⚡ [00:06] Ingesting 24 project line items into SQLite & PostgreSQL...',
          '🌲 [00:07] Running Isolation Forest financial anomaly detector on sanction amounts...',
          '📊 [00:08] Computing Benford\'s Law Chi-Square distribution on invoice digits (p=0.038)...',
          '🕸️ [00:09] Evaluating contractor network centrality in Louvain collusion graph...',
          '✅ [00:10] Ingestion & scoring completed! 24 works verified.',
          '⚠️ [00:11] 2 works flagged for Review Queue (1 vendor collusion ring, 1 statutory deadline risk).',
          '🚀 [00:12] Updated National Ministry surveillance metrics, KPIs, and geospatial map!'
        ]
      });
    }, 3800);

    demoTimersRef.current = [t1, t2, t3];
  }

  return (
    <Layout>
      <h1 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
        📂 Data Upload Center
      </h1>

      {!jobId ? (
        <div id="tour-upload-card" data-tour="upload-card">
          {/* Quick Demo Document Loader Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(155, 222, 255, 0.2) 0%, rgba(155, 255, 238, 0.25) 100%)',
            border: '1.5px dashed var(--primary)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 20,
            boxShadow: '0 4px 15px rgba(0, 48, 71, 0.04)'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📄 MoSPI DPR Project Schedule (Chittoor District Batch #2026-B)</span>
                <span className="badge badge-info" style={{ fontSize: '0.7rem', fontWeight: 700 }}>Interactive Demo File</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                24 Recommended infrastructure projects with GPS coordinates, vendor allocations & milestone telemetry
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                id="tour-demo-doc-btn"
                data-tour="demo-doc-btn"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={loadDemoDocument}
                style={{ fontWeight: 750, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(155, 255, 238, 0.4)' }}
              >
                👁️ Click to View Demo Document
              </button>
              <button
                id="tour-demo-process-btn"
                data-tour="demo-process-btn"
                type="button"
                className="btn btn-primary btn-sm"
                onClick={simulateLiveDemoPipeline}
                style={{ fontWeight: 750, whiteSpace: 'nowrap', background: 'var(--navy)' }}
              >
                ⚡ Run Live Ingestion Pipeline
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            style={{ marginBottom: 20 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            <Upload size={48} color="var(--navy)" style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
              {uploading ? '⏳ Uploading...' : 'Drop a MPLADS CSV/XLSX here, or click to browse'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supported: Recommended Works, Completed Works, Expenditures, MP Summary, MP Allocation files
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991B1B', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div className="card-header">Upload Preview</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>
                    Detected type: <span style={{ color: 'var(--amber)' }}>{preview.detected_type}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {preview.row_count} rows · {preview.preview_rows?.length} shown below
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={reset}>Cancel</button>
                  <button className="btn btn-primary" onClick={confirmUpload} disabled={preview.issues?.length > 0}>
                    <CheckCircle size={14} /> Confirm & Process
                  </button>
                </div>
              </div>

              {/* Issues */}
              {preview.issues?.length > 0 && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.8rem' }}>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
                  {preview.issues.join(' · ')}
                </div>
              )}

              {/* Column mapping */}
              <div style={{ marginBottom: 12, fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600 }}>Auto-detected column mapping: </span>
                {Object.entries(preview.column_mapping).map(([from, to]) => (
                  <span key={from} style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 6, marginRight: 6, display: 'inline-block' }}>
                    {from} → {to}
                  </span>
                ))}
              </div>

              {/* Preview table */}
              <div style={{ overflowX: 'auto', maxHeight: 240 }}>
                <table className="data-table">
                  <thead>
                    <tr>{Object.keys(preview.preview_rows?.[0] || {}).map((k) => <th key={k}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows?.map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? '').slice(0, 40)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Processing Console */
        <div id="tour-processing-console" data-tour="processing-console" className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div>
              <div className="card-header">Processing Console</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-dot status-${jobStatus?.status}`} />
                {jobStatus?.status === 'done' ? '✅ Complete' : jobStatus?.status === 'error' ? '❌ Error' : `⚙️ ${jobStatus?.stage}…`}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                id="tour-rerun-btn"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={simulateLiveDemoPipeline}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <RotateCw size={13} />
                Re-run Simulation
              </button>
              {jobStatus?.status === 'done' && (
                <button className="btn btn-primary btn-sm" onClick={reset}>
                  Upload Another File
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar" style={{ marginBottom: 16, height: 8 }}>
            <div className="progress-fill" style={{
              width: `${jobStatus?.progress_pct || 0}%`,
              background: jobStatus?.status === 'done' ? 'var(--green-clean)' : 'var(--amber)',
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Stage: <strong>{jobStatus?.stage}</strong> · {jobStatus?.progress_pct?.toFixed(1)}%
          </div>

          {/* Log */}
          <div style={{
            background: '#0F172A', borderRadius: 8, padding: '12px 16px',
            fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8',
            maxHeight: 300, overflowY: 'auto',
          }}>
            {jobStatus?.log?.map((line, i) => (
              <div key={i} style={{ marginBottom: 3, color: line.includes('✅') ? '#4ADE80' : line.includes('❌') ? '#F87171' : line.includes('⚠️') ? '#FCD34D' : '#94A3B8' }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
