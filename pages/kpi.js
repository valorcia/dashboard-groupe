import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ViewModeCtx = React.createContext('cards');

// ─── Données démo ────────────────────────────────────────────────────────
const SOCIETES = [
  { id: 'spa',     nom: '123SPA',          flag: '🇫🇷', couleur: '#3498DB' },
  { id: 'luca',    nom: 'Luca Créations',  flag: '🇧🇪', couleur: '#27AE60' },
  { id: 'valorcia',nom: 'Valorcia',        flag: '🇱🇺', couleur: '#E67E22' },
];

const KPI_DEMO = {
  spa:      { ca: 78400, leads: 22, devis: 18, commandes: 7, pipeline: 142000, marge: 0.52, masseSalariale: 9200,  impayes: 4800,  affaires: 8,  piscines: 1, spas: 3, retards: 1, sav: 2, effectif: 2, sousTraitance: 0.25, heures: 320, respectDelais: 0.85 },
  luca:     { ca: 56200, leads: 14, devis: 12, commandes: 4, pipeline: 98000,  marge: 0.49, masseSalariale: 14500, impayes: 12300, affaires: 11, piscines: 2, spas: 1, retards: 2, sav: 3, effectif: 3, sousTraitance: 0.18, heures: 450, respectDelais: 0.72 },
  valorcia: { ca: 41800, leads: 11, devis:  9, commandes: 3, pipeline: 68000,  marge: 0.54, masseSalariale: 7200,  impayes: 0,     affaires: 6,  piscines: 0, spas: 1, retards: 0, sav: 1, effectif: 1, sousTraitance: 0.42, heures: 180, respectDelais: 0.95 },
};

const CIBLES = {
  caTotal: 250000, caSpa: 85000, caLuca: 120000, caValorcia: 60000, croissance: 0.08,
  margeBrute: 0.55, rex: 50000, masseSalariale: 35000, impayes: 0,
  piscinesMois: 2.5, spas: 5, retardsChantier: 0, sav: 5, occupation: 0.80, respectDelais: 0.90,
  effectif: 6, sousTraitance: 0.30,
  leads: 18, devis: 25, commandes: 10, conversion: 0.40, pipeline: 500000,
};

// 12 derniers mois de CA (démo)
const CA_HISTORIQUE = [
  { mois: 'Jun', spa: 62000, luca: 48000, valorcia: 28000 },
  { mois: 'Jul', spa: 71000, luca: 55000, valorcia: 35000 },
  { mois: 'Aoû', spa: 58000, luca: 41000, valorcia: 31000 },
  { mois: 'Sep', spa: 65000, luca: 52000, valorcia: 38000 },
  { mois: 'Oct', spa: 72000, luca: 58000, valorcia: 42000 },
  { mois: 'Nov', spa: 67000, luca: 49000, valorcia: 36000 },
  { mois: 'Déc', spa: 81000, luca: 64000, valorcia: 45000 },
  { mois: 'Jan', spa: 56000, luca: 44000, valorcia: 32000 },
  { mois: 'Fév', spa: 68000, luca: 51000, valorcia: 39000 },
  { mois: 'Mar', spa: 74000, luca: 58000, valorcia: 41000 },
  { mois: 'Avr', spa: 76000, luca: 53000, valorcia: 40000 },
  { mois: 'Mai', spa: 78400, luca: 56200, valorcia: 41800 },
];

const MARKETING_DEMO = {
  gads:  { label: 'Google Ads',         depense: 1840, clics: 1284, impressions: 48200, conversions: 18, roas: 4.2,  cpa: 102, icone: '🟦' },
  gsc:   { label: 'Search Console',     clics: 3420, impressions: 142000, ctr: 0.024, position: 8.3,    icone: '🟦' },
  ga4:   { label: 'Analytics 4',        sessions: 18400, users: 12200, bounce: 0.38, tempsMoyen: 142,  icone: '🟧' },
  meta:  { label: 'Meta Ads',           depense: 920,  clics: 642,  impressions: 28400, conversions: 9, roas: 3.1, cpa: 102, icone: '🟦' },
  ig:    { label: 'Instagram',          followers: 4280, posts: 18, engagement: 0.038, reach: 28400, icone: '🟪' },
  gmb:   { label: 'Google My Business', vues: 8400, actions: 224, avis: 38, note: 4.8, icone: '🟩' },
};

// ─── Utilitaires ─────────────────────────────────────────────────────────
const fmt = (v, unit = '', d = 0) => {
  if (v == null || isNaN(v)) return '—';
  if (unit === '€') return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(Math.round(v)) + ' €';
  if (unit === 'k€') return Math.round(v / 100) / 10 + ' k€';
  if (unit === '%') return (v * 100).toFixed(d) + ' %';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v) + (unit ? ' ' + unit : '');
};
const ratioColor = (r) => r == null ? '#64748b' : r >= 1 ? '#16a34a' : r >= 0.8 ? '#eab308' : r >= 0.5 ? '#f97316' : '#dc2626';

// ─── KpiCard ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, target, unit = '', sub, source, inverse = false, decimals = 0, color, big = false }) {
  const ratio = typeof value === 'number' && typeof target === 'number' && target > 0
    ? (inverse ? target / Math.max(value, 0.0001) : value / target) : null;
  const statusColor = color || ratioColor(ratio);
  const pct = ratio == null ? null : Math.max(0, Math.min(100, ratio * 100));
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderTop: `3px solid ${statusColor}`, borderRadius: 10, padding: big ? '14px 16px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: big ? 110 : 88 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: big ? 28 : 22, fontWeight: 800, color: '#1e293b', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? fmt(value, unit, decimals) : value || '—'}
      </div>
      {typeof target === 'number' && (
        <>
          <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Cible : {fmt(target, unit, decimals)}</span>
            {pct != null && <span style={{ color: statusColor, fontWeight: 700 }}>{Math.round(pct)}%</span>}
          </div>
          {pct != null && (
            <div style={{ height: 3, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 99 }} />
            </div>
          )}
        </>
      )}
      {sub && <div style={{ fontSize: 10, color: '#64748b' }}>{sub}</div>}
      {source && <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 'auto', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Source : {source}</div>}
    </div>
  );
}

function Section({ title, icon, children, accent = '#E67E22' }) {
  const viewMode = React.useContext(ViewModeCtx);
  const header = (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 8, borderLeft: `3px solid ${accent}` }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', letterSpacing: -0.2 }}>{title}</div>
    </div>
  );
  if (viewMode === 'table') {
    const rows = React.Children.toArray(children).filter(c => c && c.type === KpiCard).map(c => c.props);
    return (
      <div style={{ marginBottom: 18 }}>
        {header}
        <KpiTable rows={rows} />
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 22 }}>
      {header}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>{children}</div>
    </div>
  );
}

function KpiTable({ rows }) {
  const thStyle = { padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, background: '#f8fafc', borderBottom: '1px solid #e8ecf0' };
  const thR = { ...thStyle, textAlign: 'right' };
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr>
            <th style={thStyle}>Indicateur</th>
            <th style={thR}>Valeur</th>
            <th style={thR}>Cible</th>
            <th style={thR}>% atteinte</th>
            <th style={{ ...thStyle, width: 140 }}>Progression</th>
            <th style={thStyle}>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ratio = typeof r.value === 'number' && typeof r.target === 'number' && r.target > 0
              ? (r.inverse ? r.target / Math.max(r.value, 0.0001) : r.value / r.target) : null;
            const statusColor = r.color || ratioColor(ratio);
            const pct = ratio == null ? null : Math.max(0, Math.min(100, ratio * 100));
            return (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <td style={{ padding: '10px 12px', borderLeft: `3px solid ${statusColor}` }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.label}</div>
                  {r.sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{r.sub}</div>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                  {typeof r.value === 'number' ? fmt(r.value, r.unit, r.decimals) : r.value || '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                  {typeof r.target === 'number' ? fmt(r.target, r.unit, r.decimals) : '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: statusColor }}>
                  {ratio != null ? Math.round(ratio * 100) + '%' : '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {pct != null && (
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 99 }} />
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{r.source || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HideInTable({ children }) {
  const viewMode = React.useContext(ViewModeCtx);
  if (viewMode === 'table') return null;
  return children;
}

// ─── Donut ───────────────────────────────────────────────────────────────
function Donut({ data, size = 140, label, centerValue }) {
  const viewMode = React.useContext(ViewModeCtx);
  if (viewMode === 'table') return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  let offset = -Math.PI / 2;
  const segments = data.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const x1 = cx + Math.cos(offset) * radius;
    const y1 = cy + Math.sin(offset) * radius;
    const x2 = cx + Math.cos(offset + angle) * radius;
    const y2 = cy + Math.sin(offset + angle) * radius;
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    offset += angle;
    return { ...d, path, pct: (d.value / total) * 100 };
  });
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' }}>{label}</div>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          {segments.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2">
              <title>{s.label} : {s.pct.toFixed(0)}%</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={radius * 0.55} fill="#fff" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', lineHeight: 1, textAlign: 'center' }}>{centerValue}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: '#475569' }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BarChart (stacked) ──────────────────────────────────────────────────
function BarChart({ data, series, label, height = 220, unit = '€' }) {
  const viewMode = React.useContext(ViewModeCtx);
  if (viewMode === 'table') return null;
  const max = Math.max(...data.map(d => series.reduce((s, k) => s + (d[k.key] || 0), 0)));
  const w = Math.max(380, data.length * 50);
  const padding = { top: 20, right: 12, bottom: 28, left: 50 };
  const innerH = height - padding.top - padding.bottom;
  const innerW = w - padding.left - padding.right;
  const barWidth = innerW / data.length * 0.7;
  const gap = innerW / data.length * 0.3;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={w} height={height}>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padding.top + innerH * (1 - p);
            return (
              <g key={i}>
                <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#f1f5f9" />
                <text x={padding.left - 6} y={y + 3} fontSize="9" fill="#94a3b8" textAnchor="end">{fmt(max * p, unit === '€' ? 'k€' : unit)}</text>
              </g>
            );
          })}
          {data.map((d, i) => {
            let yCursor = padding.top + innerH;
            const x = padding.left + gap / 2 + i * (barWidth + gap);
            return (
              <g key={i}>
                {series.map((s, j) => {
                  const v = d[s.key] || 0;
                  const h = (v / max) * innerH;
                  yCursor -= h;
                  return <rect key={j} x={x} y={yCursor} width={barWidth} height={h} fill={s.color}><title>{s.label} {d.mois || d.label} : {fmt(v, unit)}</title></rect>;
                })}
                <text x={x + barWidth / 2} y={height - 10} fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600">{d.mois || d.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
            <span style={{ color: '#475569' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LineChart ───────────────────────────────────────────────────────────
function LineChart({ data, series, label, height = 220, unit = '€' }) {
  const viewMode = React.useContext(ViewModeCtx);
  if (viewMode === 'table') return null;
  const allVals = data.flatMap(d => series.map(s => d[s.key] || 0));
  const max = Math.max(...allVals);
  const min = Math.min(0, ...allVals);
  const w = Math.max(380, data.length * 50);
  const padding = { top: 20, right: 12, bottom: 28, left: 50 };
  const innerH = height - padding.top - padding.bottom;
  const innerW = w - padding.left - padding.right;
  const xStep = innerW / Math.max(data.length - 1, 1);
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={w} height={height}>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padding.top + innerH * (1 - p);
            return (
              <g key={i}>
                <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#f1f5f9" />
                <text x={padding.left - 6} y={y + 3} fontSize="9" fill="#94a3b8" textAnchor="end">{fmt(min + (max - min) * p, unit === '€' ? 'k€' : unit)}</text>
              </g>
            );
          })}
          {series.map((s, si) => {
            const points = data.map((d, i) => {
              const v = d[s.key] || 0;
              const x = padding.left + i * xStep;
              const y = padding.top + innerH * (1 - (v - min) / (max - min || 1));
              return `${x},${y}`;
            });
            return (
              <g key={si}>
                <polyline points={points.join(' ')} fill="none" stroke={s.color} strokeWidth="2.5" />
                {data.map((d, i) => {
                  const v = d[s.key] || 0;
                  const x = padding.left + i * xStep;
                  const y = padding.top + innerH * (1 - (v - min) / (max - min || 1));
                  return <circle key={i} cx={x} cy={y} r="3" fill={s.color}><title>{s.label} {d.mois || d.label} : {fmt(v, unit)}</title></circle>;
                })}
              </g>
            );
          })}
          {data.map((d, i) => (
            <text key={i} x={padding.left + i * xStep} y={height - 10} fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600">{d.mois || d.label}</text>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 14, height: 3, background: s.color, borderRadius: 2 }} />
            <span style={{ color: '#475569' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gauge ───────────────────────────────────────────────────────────────
function Gauge({ value, max = 1, label, sub, decimals = 0, unit = '%', size = 150 }) {
  const viewMode = React.useContext(ViewModeCtx);
  if (viewMode === 'table') return null;
  const ratio = Math.max(0, Math.min(1, value / max));
  const color = ratioColor(ratio);
  const cx = size / 2, cy = size * 0.7;
  const r = size * 0.4;
  const startA = Math.PI;
  const endA = Math.PI + Math.PI * ratio;
  const x1 = cx + Math.cos(startA) * r;
  const y1 = cy + Math.sin(startA) * r;
  const x2 = cx + Math.cos(endA) * r;
  const y2 = cy + Math.sin(endA) * r;
  const xEnd = cx + Math.cos(Math.PI * 2) * r;
  const yEnd = cy + Math.sin(Math.PI * 2) * r;
  const large = endA - startA > Math.PI ? 1 : 0;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' }}>{label}</div>
      <svg width={size} height={size * 0.78}>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${xEnd} ${yEnd}`} stroke="#f1f5f9" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        <text x={cx} y={cy - 4} fontSize="22" fontWeight="800" fill="#1e293b" textAnchor="middle">{fmt(value, unit, decimals)}</text>
      </svg>
      {sub && <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>{sub}</div>}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────
const SOUS_ONGLETS = [
  { id: 'groupe',     label: 'Vue Groupe',  icon: '🏢' },
  { id: 'graphiques', label: 'Graphiques',  icon: '📊' },
  { id: 'commercial', label: 'Commercial',  icon: '🎯' },
  { id: 'marketing',  label: 'Marketing',   icon: '📣' },
  { id: 'finance',    label: 'Finance',     icon: '💰' },
  { id: 'production', label: 'Production',  icon: '🏗️' },
  { id: 'rh',         label: 'RH',          icon: '👥' },
];

export default function KpiGroupe() {
  const [vue, setVue] = useState('groupe');
  const [periode, setPeriode] = useState('mois');
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState('cards');

  const totals = useMemo(() => {
    const sum = (k) => SOCIETES.reduce((s, soc) => s + KPI_DEMO[soc.id][k], 0);
    const wAvg = (k) => {
      const totalCa = sum('ca') || 1;
      return SOCIETES.reduce((s, soc) => s + KPI_DEMO[soc.id][k] * KPI_DEMO[soc.id].ca, 0) / totalCa;
    };
    return {
      caTotal: sum('ca'), margeBrute: wAvg('marge'), masseSalariale: sum('masseSalariale'), impayes: sum('impayes'),
      affaires: sum('affaires'), piscines: sum('piscines'), spas: sum('spas'), retards: sum('retards'), sav: sum('sav'),
      effectif: sum('effectif'), sousTraitance: wAvg('sousTraitance'), heures: sum('heures'),
      leads: sum('leads'), devis: sum('devis'), commandes: sum('commandes'), pipeline: sum('pipeline'),
      ticketMoyen: sum('ca') / Math.max(sum('commandes'), 1),
      conversion: sum('commandes') / Math.max(sum('devis'), 1),
      rex: sum('ca') * wAvg('marge') - sum('masseSalariale'),
      occupation: Math.min(1, wAvg('marge') * 1.3),
      respectDelais: wAvg('respectDelais'),
    };
  }, []);

  const donutCa       = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].ca,        label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const donutLeads    = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].leads,     label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const donutAffaires = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].affaires,  label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const donutHeures   = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].heures,    label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const donutMasse    = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].masseSalariale, label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const seriesCA      = SOCIETES.map(s => ({ key: s.id, label: `${s.flag} ${s.nom}`, color: s.couleur }));

  return (
    <>
      <Head><title>KPI Groupe · Command Center</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', borderRadius: 14, padding: '18px 22px', marginBottom: 14, boxShadow: '0 6px 20px rgba(15,23,42,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <Link href="/" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}>← Dashboard</Link>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginTop: 4 }}>📊 KPI Groupe — Command Center</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                  {SOCIETES.map((s, i) => <span key={s.id}>{i > 0 ? ' · ' : ''}{s.flag} {s.nom}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {['mois', 'trimestre', 'annee'].map(p => (
                  <button key={p} onClick={() => setPeriode(p)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: periode === p ? '#E67E22' : 'transparent', color: periode === p ? '#fff' : '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {p === 'mois' ? 'Mois' : p === 'trimestre' ? 'Trim.' : 'Année'}
                  </button>
                ))}
                <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1', fontSize: 12, fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 2, gap: 2 }}>
                  <button
                    onClick={() => setViewMode('cards')}
                    title="Affichage en cartes"
                    style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: viewMode === 'cards' ? '#E67E22' : 'transparent', color: viewMode === 'cards' ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >▦ Cartes</button>
                  <button
                    onClick={() => setViewMode('table')}
                    title="Affichage en tableau"
                    style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: viewMode === 'table' ? '#E67E22' : 'transparent', color: viewMode === 'table' ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >☰ Tableau</button>
                </div>
                <button onClick={() => window.location.reload()} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#E67E22', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔄 Actualiser</button>
              </div>
            </div>
          </div>

          <ViewModeCtx.Provider value={viewMode}>
          {/* Sous-onglets */}
          <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 4, marginBottom: 18, border: '1px solid #e8ecf0', overflowX: 'auto' }}>
            {SOUS_ONGLETS.map(s => (
              <button
                key={s.id}
                onClick={() => setVue(s.id)}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: vue === s.id ? '#E67E22' : 'transparent',
                  color: vue === s.id ? '#fff' : '#64748b',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  transition: 'background .15s',
                }}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* ───── VUE GROUPE ───── */}
          {vue === 'groupe' && (
            <>
              <Section title="CA Groupe Consolidé" icon="💰" accent="#E67E22">
                <KpiCard label="CA Total Groupe" value={totals.caTotal} target={CIBLES.caTotal} unit="€" source="Odoo" big />
                <KpiCard label="CA 123SPA 🇫🇷" value={KPI_DEMO.spa.ca} target={CIBLES.caSpa} unit="€" source="Odoo" />
                <KpiCard label="CA Luca 🇧🇪" value={KPI_DEMO.luca.ca} target={CIBLES.caLuca} unit="€" source="Odoo" />
                <KpiCard label="CA Valorcia 🇱🇺" value={KPI_DEMO.valorcia.ca} target={CIBLES.caValorcia} unit="€" source="Odoo" />
                <KpiCard label="Croissance MoM" value={0.072} target={CIBLES.croissance} unit="%" decimals={1} sub="vs mois précédent" source="Calcul" />
              </Section>

              <Section title="Synthèse opérationnelle" icon="⚡" accent="#3498DB">
                <KpiCard label="Marge brute groupe" value={totals.margeBrute} target={CIBLES.margeBrute} unit="%" decimals={1} source="Odoo" />
                <KpiCard label="REX estimé" value={totals.rex} target={CIBLES.rex} unit="€" source="Calcul" />
                <KpiCard label="Effectif actif" value={totals.effectif} target={CIBLES.effectif} source="Planneo" />
                <KpiCard label="Leads entrants" value={totals.leads} target={CIBLES.leads} source="Odoo CRM" />
                <KpiCard label="Affaires en cours" value={totals.affaires} source="Planneo" />
                <KpiCard label="Impayés groupe" value={totals.impayes} target={CIBLES.impayes} unit="€" inverse color={totals.impayes === 0 ? '#16a34a' : '#dc2626'} source="Odoo" />
              </Section>

              <HideInTable>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 8, borderLeft: '3px solid #8E44AD' }}>
                    <span style={{ fontSize: 16 }}>📊</span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Répartition par société</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    <Donut data={donutCa} label="CA par société" centerValue={fmt(totals.caTotal, '€')} />
                    <Donut data={donutLeads} label="Leads par société" centerValue={`${totals.leads} leads`} />
                    <Donut data={donutAffaires} label="Affaires en cours" centerValue={`${totals.affaires}`} />
                  </div>
                </div>
              </HideInTable>
            </>
          )}

          {/* ───── GRAPHIQUES ───── */}
          {vue === 'graphiques' && (
            <>
              {viewMode === 'table' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#78350f', textAlign: 'center' }}>
                  ☰ Mode tableau actif — cet onglet contient uniquement des graphiques. Bascule en <button onClick={() => setViewMode('cards')} style={{ background: 'none', border: 'none', color: '#E67E22', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>▦ Cartes</button> pour les voir, ou passe sur un autre sous-onglet.
                </div>
              )}
              <BarChart data={CA_HISTORIQUE} series={seriesCA} label="CA mensuel par société (12 mois)" height={260} />
              <div style={{ height: 14 }} />
              <LineChart data={CA_HISTORIQUE} series={seriesCA} label="Évolution CA — courbes" height={240} />
              <HideInTable>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
                  <Gauge value={totals.occupation} label="Taux occupation" sub="Équipes vs capacité" />
                  <Gauge value={totals.margeBrute} label="Marge brute" />
                  <Gauge value={totals.conversion} label="Conversion devis→cmd" />
                  <Gauge value={totals.respectDelais} label="Respect délais" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
                  <Donut data={donutCa} label="Répartition CA" centerValue={fmt(totals.caTotal, '€')} />
                  <Donut data={donutLeads} label="Sources leads" centerValue={`${totals.leads}`} />
                  <Donut data={donutHeures} label="Heures planifiées" centerValue={`${totals.heures} h`} />
                </div>
              </HideInTable>
            </>
          )}

          {/* ───── COMMERCIAL ───── */}
          {vue === 'commercial' && (
            <>
              <Section title="Activité commerciale groupe" icon="🎯" accent="#dc2626">
                <KpiCard label="Leads entrants" value={totals.leads} target={CIBLES.leads} sub="tous canaux" source="Odoo CRM" />
                <KpiCard label="Devis envoyés" value={totals.devis} target={CIBLES.devis} source="Odoo Vente" />
                <KpiCard label="Commandes signées" value={totals.commandes} target={CIBLES.commandes} source="Odoo Vente" />
                <KpiCard label="Taux conversion" value={totals.conversion} target={CIBLES.conversion} unit="%" decimals={1} sub="devis → commandes" source="Calcul" />
                <KpiCard label="Ticket moyen" value={totals.ticketMoyen} unit="€" sub="CA / commandes" source="Calcul" />
                <KpiCard label="Pipeline commercial" value={totals.pipeline} target={CIBLES.pipeline} unit="€" source="Odoo CRM" />
              </Section>

              <Section title="Performance par société" icon="🏢" accent="#6b3fa0">
                {SOCIETES.map(s => {
                  const k = KPI_DEMO[s.id];
                  const conv = k.commandes / Math.max(k.devis, 1);
                  return (
                    <KpiCard key={s.id} label={`${s.flag} ${s.nom}`} value={`${fmt(k.ca, 'k€')} · ${k.leads} leads`} sub={`Conv. ${(conv * 100).toFixed(0)}% · ${k.commandes} cmd`} color={s.couleur} source="Odoo" />
                  );
                })}
              </Section>

              <BarChart
                data={SOCIETES.map(s => ({ mois: s.flag + ' ' + s.nom, ca: KPI_DEMO[s.id].ca }))}
                series={[{ key: 'ca', label: 'CA', color: '#E67E22' }]}
                label="CA par société (mois en cours)"
                height={200}
              />
              <div style={{ height: 14 }} />
              <BarChart
                data={SOCIETES.map(s => ({ mois: s.flag, leads: KPI_DEMO[s.id].leads, devis: KPI_DEMO[s.id].devis, commandes: KPI_DEMO[s.id].commandes }))}
                series={[
                  { key: 'leads', label: 'Leads', color: '#3b82f6' },
                  { key: 'devis', label: 'Devis', color: '#f97316' },
                  { key: 'commandes', label: 'Commandes', color: '#16a34a' },
                ]}
                label="Funnel commercial par société"
                height={200}
                unit=""
              />
            </>
          )}

          {/* ───── MARKETING ───── */}
          {vue === 'marketing' && (
            <>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 12, color: '#78350f' }}>
                ⓘ Les connecteurs Google Ads, GSC, GA4, Meta, Instagram et GMB ne sont pas encore branchés. Données démo ci-dessous. Va dans <Link href="/connectors" style={{ color: '#E67E22', fontWeight: 700 }}>🔌 Connecteurs</Link> pour les configurer.
              </div>

              <Section title="Google Ads" icon="🟦" accent="#4285F4">
                <KpiCard label="Dépense" value={MARKETING_DEMO.gads.depense} unit="€" source="Google Ads" />
                <KpiCard label="Clics" value={MARKETING_DEMO.gads.clics} source="Google Ads" />
                <KpiCard label="Impressions" value={MARKETING_DEMO.gads.impressions} source="Google Ads" />
                <KpiCard label="Conversions" value={MARKETING_DEMO.gads.conversions} source="Google Ads" />
                <KpiCard label="ROAS" value={MARKETING_DEMO.gads.roas} decimals={1} sub="x" source="Calcul" />
                <KpiCard label="CPA" value={MARKETING_DEMO.gads.cpa} unit="€" sub="coût/acquisition" source="Calcul" inverse target={150} />
              </Section>

              <Section title="Search Console (SEO)" icon="🟦" accent="#4285F4">
                <KpiCard label="Clics SEO" value={MARKETING_DEMO.gsc.clics} source="GSC" />
                <KpiCard label="Impressions" value={MARKETING_DEMO.gsc.impressions} source="GSC" />
                <KpiCard label="CTR moyen" value={MARKETING_DEMO.gsc.ctr} unit="%" decimals={1} source="GSC" />
                <KpiCard label="Position moy." value={MARKETING_DEMO.gsc.position} decimals={1} sub="dans Google" source="GSC" inverse target={5} />
              </Section>

              <Section title="Google Analytics 4" icon="🟧" accent="#F9AB00">
                <KpiCard label="Sessions" value={MARKETING_DEMO.ga4.sessions} source="GA4" />
                <KpiCard label="Utilisateurs" value={MARKETING_DEMO.ga4.users} source="GA4" />
                <KpiCard label="Taux de rebond" value={MARKETING_DEMO.ga4.bounce} unit="%" decimals={0} source="GA4" inverse target={0.40} />
                <KpiCard label="Temps moyen" value={MARKETING_DEMO.ga4.tempsMoyen} unit="s" sub="par session" source="GA4" />
              </Section>

              <Section title="Meta Ads (Facebook/Instagram)" icon="🟦" accent="#1877F2">
                <KpiCard label="Dépense" value={MARKETING_DEMO.meta.depense} unit="€" source="Meta Ads" />
                <KpiCard label="Clics" value={MARKETING_DEMO.meta.clics} source="Meta Ads" />
                <KpiCard label="Impressions" value={MARKETING_DEMO.meta.impressions} source="Meta Ads" />
                <KpiCard label="Conversions" value={MARKETING_DEMO.meta.conversions} source="Meta Ads" />
                <KpiCard label="ROAS" value={MARKETING_DEMO.meta.roas} decimals={1} sub="x" source="Calcul" />
              </Section>

              <Section title="Instagram + GMB" icon="🟪" accent="#E1306C">
                <KpiCard label="Followers IG" value={MARKETING_DEMO.ig.followers} source="Instagram" />
                <KpiCard label="Engagement" value={MARKETING_DEMO.ig.engagement} unit="%" decimals={1} source="Instagram" />
                <KpiCard label="Reach mensuel" value={MARKETING_DEMO.ig.reach} source="Instagram" />
                <KpiCard label="Vues GMB" value={MARKETING_DEMO.gmb.vues} source="GMB" />
                <KpiCard label="Note GMB" value={MARKETING_DEMO.gmb.note} decimals={1} sub={`/ 5 · ${MARKETING_DEMO.gmb.avis} avis`} source="GMB" />
                <KpiCard label="Actions GMB" value={MARKETING_DEMO.gmb.actions} sub="appels + itinéraires" source="GMB" />
              </Section>
            </>
          )}

          {/* ───── FINANCE ───── */}
          {vue === 'finance' && (
            <>
              <Section title="Trésorerie & encaissements" icon="💰" accent="#16a34a">
                <KpiCard label="Encaissé ce mois" value={47200} unit="€" source="Odoo" big />
                <KpiCard label="Impayés groupe" value={totals.impayes} target={CIBLES.impayes} unit="€" inverse color={totals.impayes === 0 ? '#16a34a' : '#dc2626'} source="Odoo" />
                <KpiCard label="Trésorerie projetée" value={71799} unit="€" sub="fin S21 (Excel)" source="OneDrive" />
                <KpiCard label="REX estimé" value={totals.rex} target={CIBLES.rex} unit="€" source="Calcul" />
              </Section>

              <Section title="Marges & rentabilité" icon="📈" accent="#3498DB">
                <KpiCard label="Marge brute groupe" value={totals.margeBrute} target={CIBLES.margeBrute} unit="%" decimals={1} source="Odoo" />
                {SOCIETES.map(s => (
                  <KpiCard key={s.id} label={`Marge ${s.flag}`} value={KPI_DEMO[s.id].marge} target={0.50} unit="%" decimals={0} color={s.couleur} source="Odoo" />
                ))}
              </Section>

              <Section title="Production réalisée" icon="🏗️" accent="#0891b2">
                <KpiCard label="Affaires en cours" value={totals.affaires} source="Planneo" />
                <KpiCard label="Piscines livrées" value={totals.piscines} target={CIBLES.piscinesMois} sub="ce mois" source="Planneo" />
                <KpiCard label="Spas installés" value={totals.spas} target={CIBLES.spas} source="Planneo" />
              </Section>

              <LineChart
                data={CA_HISTORIQUE.map(d => ({ ...d, total: d.spa + d.luca + d.valorcia }))}
                series={[{ key: 'total', label: 'CA Total Groupe', color: '#E67E22' }]}
                label="Évolution CA groupe (12 mois)"
                height={220}
              />
            </>
          )}

          {/* ───── PRODUCTION ───── */}
          {vue === 'production' && (
            <>
              <Section title="Production & livraisons" icon="🏗️" accent="#16a34a">
                <KpiCard label="Affaires en cours" value={totals.affaires} source="Planneo" big />
                <KpiCard label="Piscines livrées" value={totals.piscines} target={CIBLES.piscinesMois} sub="ce mois" source="Planneo" />
                <KpiCard label="Spas installés" value={totals.spas} target={CIBLES.spas} source="Planneo" />
                <KpiCard label="Respect délais" value={totals.respectDelais} target={CIBLES.respectDelais} unit="%" decimals={0} source="Planneo" />
                <KpiCard label="Retards > 2 sem." value={totals.retards} target={CIBLES.retardsChantier} inverse source="Planneo" color={totals.retards <= CIBLES.retardsChantier ? '#16a34a' : '#dc2626'} />
                <KpiCard label="SAV ouverts" value={totals.sav} target={CIBLES.sav} inverse source="Planneo" />
              </Section>

              <Section title="Charge & équipes" icon="⚙️" accent="#7c3aed">
                <KpiCard label="Taux occupation" value={totals.occupation} target={CIBLES.occupation} unit="%" decimals={0} source="Planneo" />
                <KpiCard label="Taux sous-traitance" value={totals.sousTraitance} target={CIBLES.sousTraitance} unit="%" decimals={0} inverse source="Planneo" />
                <KpiCard label="Heures planifiées" value={totals.heures} unit="h" sub="ce mois" source="Planneo" />
                <KpiCard label="Effectif total" value={totals.effectif} target={CIBLES.effectif} source="Planneo" />
              </Section>

              <HideInTable>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <Gauge value={totals.occupation} label="Taux occupation" />
                  <Gauge value={totals.respectDelais} label="Respect délais" />
                  <Donut data={donutAffaires} label="Affaires par société" centerValue={`${totals.affaires}`} />
                  <Donut data={SOCIETES.map(s => ({ value: KPI_DEMO[s.id].sav, label: `${s.flag} ${s.nom}`, color: s.couleur }))} label="SAV ouverts" centerValue={`${totals.sav}`} />
                </div>
              </HideInTable>

              <BarChart
                data={SOCIETES.map(s => ({ mois: s.flag + ' ' + s.nom, piscines: KPI_DEMO[s.id].piscines, spas: KPI_DEMO[s.id].spas }))}
                series={[
                  { key: 'piscines', label: 'Piscines', color: '#0891b2' },
                  { key: 'spas', label: 'Spas', color: '#0e7490' },
                ]}
                label="Livraisons par société (ce mois)"
                height={200}
                unit=""
              />
            </>
          )}

          {/* ───── RH ───── */}
          {vue === 'rh' && (
            <>
              <Section title="Effectif & main-d'œuvre" icon="👥" accent="#0891b2">
                <KpiCard label="Effectif actif" value={totals.effectif} target={CIBLES.effectif} sub="FTE total" source="Planneo" big />
                <KpiCard label="Taux sous-traitance" value={totals.sousTraitance} target={CIBLES.sousTraitance} unit="%" decimals={0} inverse source="Planneo" />
                <KpiCard label="Heures planifiées" value={totals.heures} unit="h" sub="ce mois" source="Planneo" />
                <KpiCard label="Masse salariale" value={totals.masseSalariale} target={CIBLES.masseSalariale} unit="€" inverse source="Paie" />
              </Section>

              <Section title="Productivité commerciale par effectif" icon="📈" accent="#dc2626">
                <KpiCard label="CA / personne" value={totals.caTotal / Math.max(totals.effectif, 1)} unit="€" sub="ce mois" source="Calcul" />
                <KpiCard label="Leads / personne" value={totals.leads / Math.max(totals.effectif, 1)} decimals={1} source="Calcul" />
                <KpiCard label="Commandes / personne" value={totals.commandes / Math.max(totals.effectif, 1)} decimals={1} source="Calcul" />
                <KpiCard label="Marge / heure" value={(totals.caTotal * totals.margeBrute) / Math.max(totals.heures, 1)} unit="€" decimals={0} source="Calcul" />
              </Section>

              <Section title="Par société" icon="🏢" accent="#6b3fa0">
                {SOCIETES.map(s => {
                  const k = KPI_DEMO[s.id];
                  return (
                    <KpiCard key={s.id} label={`${s.flag} ${s.nom}`} value={`${k.effectif} pers · ${k.heures}h`} sub={`Masse sal. ${fmt(k.masseSalariale, 'k€')} · ST ${(k.sousTraitance * 100).toFixed(0)}%`} color={s.couleur} source="Planneo" />
                  );
                })}
              </Section>

              <HideInTable>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <Donut data={donutHeures} label="Heures planifiées" centerValue={`${totals.heures} h`} />
                  <Donut data={donutMasse} label="Masse salariale" centerValue={fmt(totals.masseSalariale, '€')} />
                  <Gauge value={1 - totals.sousTraitance} label="Taux internes" sub="vs sous-traitance" />
                </div>
              </HideInTable>
            </>
          )}

          <div style={{ marginTop: 22, padding: '12px 16px', background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
            Données démo · Brancher Odoo + Planneo + Google Ads/GSC/GA4/Meta via <Link href="/connectors" style={{ color: '#E67E22', fontWeight: 700 }}>🔌 Connecteurs</Link> pour passer en live.
          </div>
          </ViewModeCtx.Provider>

        </div>
      </div>
    </>
  );
}
