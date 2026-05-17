import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState('res.partner');

  async function load(targetModel) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/odoo?model=${encodeURIComponent(targetModel)}&limit=20`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Unknown error');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(model);
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard Groupe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.h1}>Dashboard Groupe</h1>
          <p style={styles.sub}>Connecté à Odoo via API key</p>
        </header>

        <section style={styles.panel}>
          <div style={styles.row}>
            <input
              style={styles.input}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Modèle Odoo (ex: res.partner)"
            />
            <button style={styles.button} onClick={() => load(model)} disabled={loading}>
              {loading ? 'Chargement…' : 'Charger'}
            </button>
          </div>

          {error && <div style={styles.error}>Erreur : {error}</div>}

          {data && (
            <>
              <div style={styles.meta}>
                <span>Modèle : <strong>{data.model}</strong></span>
                <span>Enregistrements : <strong>{data.count}</strong></span>
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {data.records[0] &&
                        Object.keys(data.records[0]).map((k) => (
                          <th key={k} style={styles.th}>{k}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((r, i) => (
                      <tr key={i} style={i % 2 ? styles.trAlt : undefined}>
                        {Object.keys(data.records[0]).map((k) => (
                          <td key={k} style={styles.td}>{formatCell(r[k])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function formatCell(v) {
  if (v === null || v === undefined || v === false) return '—';
  if (Array.isArray(v)) return v.join(' · ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const styles = {
  main: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '32px 24px',
    color: '#111',
  },
  header: { marginBottom: 24 },
  h1: { margin: 0, fontSize: 28 },
  sub: { margin: '4px 0 0', color: '#666' },
  panel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  row: { display: 'flex', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
  },
  button: {
    padding: '10px 16px',
    background: '#111',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  meta: { display: 'flex', gap: 16, color: '#444', fontSize: 13, marginBottom: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
  },
  td: { padding: '8px 10px', borderBottom: '1px solid #f1f5f9' },
  trAlt: { background: '#fafafa' },
  error: {
    background: '#fef2f2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
};
