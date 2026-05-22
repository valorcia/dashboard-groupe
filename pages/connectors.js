import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const SOURCE_LABELS = {
  kv: { label: 'KV chiffré', color: '#7c3aed', bg: '#ede9fe' },
  env: { label: 'Env Vercel', color: '#0891b2', bg: '#cffafe' },
  null: { label: 'Non défini', color: '#94a3b8', bg: '#f1f5f9' },
};

export default function Connectors() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/connectors');
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Erreur inconnue');
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveConnector(connector) {
    setSaving(connector.id);
    setError(null);
    const updates = connector.fields
      .filter(f => edits[f.key] !== undefined)
      .map(f => ({ key: f.key, value: edits[f.key] }));
    if (updates.length === 0) { setSaving(null); return; }
    try {
      const r = await fetch('/api/connectors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Erreur enregistrement');
      setSavedAt(new Date());
      const newEdits = { ...edits };
      for (const u of updates) delete newEdits[u.key];
      setEdits(newEdits);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function runTest(connector) {
    if (!connector.test) return;
    setTesting(connector.id);
    setTestResults({ ...testResults, [connector.id]: null });
    try {
      const r = await fetch('/api/connectors/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: connector.test }) });
      const j = await r.json();
      setTestResults({ ...testResults, [connector.id]: j });
    } catch (e) {
      setTestResults({ ...testResults, [connector.id]: { ok: false, steps: [{ step: 'Réseau', ok: false, error: e.message }] } });
    } finally {
      setTesting(null);
    }
  }

  return (
    <>
      <Head><title>Connecteurs · Dashboard Groupe</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '24px 28px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Link href="/" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}>← Dashboard</Link>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>🔌 Connecteurs</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Configure tous les services externes depuis l'app. Secrets chiffrés AES-256 dans Redis.</div>
            </div>
            {savedAt && <div style={{ fontSize: 12, color: '#059669', background: '#d1fae5', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>✓ Enregistré {savedAt.toLocaleTimeString()}</div>}
          </div>

          {/* Status global */}
          {data?.status && (
            <div style={{ background: data.status.ready ? '#f0fdf4' : '#fef3c7', border: `1px solid ${data.status.ready ? '#86efac' : '#fcd34d'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: data.status.ready ? '#166534' : '#92400e', marginBottom: 4 }}>
                {data.status.ready ? '✅ Store chiffré opérationnel' : '⚠ Store chiffré non prêt'}
              </div>
              <div style={{ display: 'flex', gap: 18, color: '#475569', fontSize: 12, flexWrap: 'wrap' }}>
                <span>Redis Upstash/KV : {data.status.redis ? '✓' : '✗ manquant (KV_REST_API_URL/TOKEN)'}</span>
                <span>Clé maîtresse : {data.status.masterKey ? '✓' : `✗ manquante (CONNECTORS_MASTER_KEY = 64 hex chars, actuellement ${data.status.masterKeyLength})`}</span>
              </div>
              {!data.status.ready && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#78350f', background: '#fffbeb', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
                  <strong>Setup :</strong> ajoute l'intégration <em>Upstash for Redis</em> via Vercel Marketplace (les variables KV_REST_API_URL et KV_REST_API_TOKEN sont injectées automatiquement), puis ajoute <code>CONNECTORS_MASTER_KEY</code> dans Vercel env (générée avec <code>openssl rand -hex 32</code>). Sans ces deux, les secrets restent en lecture seule via les env vars Vercel.
                </div>
              )}
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement…</div>}
          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}

          {/* Cartes connecteurs */}
          {data?.schema?.map(connector => {
            const fields = connector.fields;
            const definedCount = fields.filter(f => data.values[f.key]?.defined).length;
            const requiredMissing = fields.filter(f => f.required && !data.values[f.key]?.defined);
            const test = testResults[connector.id];

            return (
              <div key={connector.id} style={{ background: '#fff', border: '1px solid #e8ecf0', borderLeft: `4px solid ${connector.couleur}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${connector.couleur}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{connector.icon}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{connector.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{connector.desc}</div>
                    <div style={{ marginTop: 6, fontSize: 11, color: requiredMissing.length === 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                      {definedCount} / {fields.length} configurés
                      {requiredMissing.length > 0 && ` · ${requiredMissing.length} requis manquant${requiredMissing.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {connector.test && (
                    <button
                      onClick={() => runTest(connector)}
                      disabled={testing === connector.id}
                      style={{ background: testing === connector.id ? '#e2e8f0' : connector.couleur, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: testing === connector.id ? 'wait' : 'pointer' }}
                    >
                      {testing === connector.id ? 'Test en cours…' : 'Tester la connexion'}
                    </button>
                  )}
                </div>

                {/* Champs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {fields.map(f => {
                    const v = data.values[f.key] || { source: null, defined: false };
                    const sourceMeta = SOURCE_LABELS[v.source || 'null'];
                    const editing = edits[f.key] !== undefined;
                    return (
                      <div key={f.key} style={{ background: '#fafbfc', border: '1px solid #e8ecf0', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                            {f.label}
                            {f.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                          </label>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: sourceMeta.bg, color: sourceMeta.color, letterSpacing: 0.4 }}>{sourceMeta.label}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace' }}>{f.key}</div>
                        <input
                          type={f.secret && !editing ? 'password' : 'text'}
                          value={editing ? edits[f.key] : (v.defined && !f.secret ? (v.value || '') : '')}
                          placeholder={v.defined ? (f.secret ? '••••••••' : '') : (f.placeholder || (f.secret ? 'Secret' : 'Valeur'))}
                          onChange={(e) => setEdits({ ...edits, [f.key]: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontFamily: f.secret ? 'monospace' : 'inherit', boxSizing: 'border-box' }}
                        />
                        {editing && (
                          <div style={{ marginTop: 4, fontSize: 10, color: '#7c3aed', fontWeight: 600 }}>↳ modification en attente · Enregistrer ↓</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bouton enregistrer */}
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => saveConnector(connector)}
                    disabled={saving === connector.id || fields.every(f => edits[f.key] === undefined)}
                    style={{
                      background: fields.some(f => edits[f.key] !== undefined) ? '#1e293b' : '#cbd5e1',
                      color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: fields.some(f => edits[f.key] !== undefined) ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {saving === connector.id ? 'Enregistrement…' : 'Enregistrer ce connecteur'}
                  </button>
                </div>

                {/* Résultat de test */}
                {test && (
                  <div style={{ marginTop: 14, background: test.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${test.ok ? '#86efac' : '#fca5a5'}`, borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: test.ok ? '#166534' : '#991b1b', marginBottom: 8 }}>
                      {test.ok ? '✅ Connexion validée' : '❌ Échec du test'}
                    </div>
                    {test.steps?.map((s, i) => (
                      <div key={i} style={{ marginBottom: 6, padding: '6px 8px', background: '#fff', borderRadius: 4, borderLeft: `3px solid ${s.ok ? '#22c55e' : '#ef4444'}` }}>
                        <div style={{ fontWeight: 600, color: s.ok ? '#166534' : '#991b1b', fontSize: 11 }}>{s.ok ? '✓' : '✗'} {s.step}</div>
                        {s.detail && <pre style={{ margin: '4px 0 0', fontSize: 10, color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(s.detail, null, 2)}</pre>}
                        {s.error && <div style={{ fontSize: 10, color: '#991b1b', marginTop: 4, wordBreak: 'break-word' }}>{s.error}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </>
  );
}
