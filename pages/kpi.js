import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// ───── Données démo (à remplacer par sources réelles) ─────────────────────
const SOCIETES = [
  { id: 'spa',     nom: '123SPA',          flag: '🇫🇷', couleur: '#3498DB' },
  { id: 'luca',    nom: 'Luca Créations',  flag: '🇧🇪', couleur: '#27AE60' },
  { id: 'valorcia',nom: 'Valorcia',        flag: '🇱🇺', couleur: '#E67E22' },
];

const KPI_DEMO = {
  spa:      { ca: 78400, leads: 22, devis: 18, commandes: 7,  pipeline: 142000, marge: 0.52, masseSalariale: 9200,  impayes: 4800,  affaires: 8,  piscines: 1, spas: 3, retards: 1, sav: 2, effectif: 2, sousTraitance: 0.25, heures: 320 },
  luca:     { ca: 56200, leads: 14, devis: 12, commandes: 4,  pipeline: 98000,  marge: 0.49, masseSalariale: 14500, impayes: 12300, affaires: 11, piscines: 2, spas: 1, retards: 2, sav: 3, effectif: 3, sousTraitance: 0.18, heures: 450 },
  valorcia: { ca: 41800, leads: 11, devis:  9, commandes: 3,  pipeline: 68000,  marge: 0.54, masseSalariale: 7200,  impayes: 0,     affaires: 6,  piscines: 0, spas: 1, retards: 0, sav: 1, effectif: 1, sousTraitance: 0.42, heures: 180 },
};

const CIBLES = {
  caTotal: 250000, caSpa: 85000, caLuca: 120000, caValorcia: 60000, croissance: 0.08,
  margeBrute: 0.55, rex: 50000, masseSalariale: 35000, impayes: 0,
  piscinesMois: 2.5, spas: 5, retardsChantier: 0, sav: 5, occupation: 0.80,
  effectif: 6, sousTraitance: 0.30,
  leads: 18, devis: 25, commandes: 10, conversion: 0.40, pipeline: 500000,
};

const CONNECTORS_STATUS = [
  { id: 'odoo',     nom: 'Odoo V17',          statut: 'demo',  icone: '🟣' },
  { id: 'gads',     nom: 'Google Ads',        statut: 'absent', icone: '🔴' },
  { id: 'gsc',      nom: 'Search Console',    statut: 'absent', icone: '🔴' },
  { id: 'ga4',      nom: 'Google Analytics',  statut: 'absent', icone: '🔴' },
  { id: 'meta',     nom: 'Meta Ads',          statut: 'absent', icone: '🔴' },
  { id: 'ig',       nom: 'Instagram',         statut: 'absent', icone: '🔴' },
  { id: 'gmb',      nom: 'Google My Business',statut: 'absent', icone: '🔴' },
];

// ───── Utilitaires ────────────────────────────────────────────────────────
function fmtNum(v, unit = '', decimals = 0) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  if (unit === '€') return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(Math.round(v)) + ' €';
  if (unit === '%') return (v * 100).toFixed(decimals) + ' %';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(v) + (unit ? ' ' + unit : '');
}

function colorForRatio(ratio, inverse = false) {
  if (ratio === null || ratio === undefined) return '#64748b';
  const r = inverse ? 1 / Math.max(ratio, 0.01) : ratio;
  if (r >= 1) return '#16a34a';     // vert : objectif atteint
  if (r >= 0.8) return '#eab308';   // jaune : proche
  if (r >= 0.5) return '#f97316';   // orange : à mi-chemin
  return '#dc2626';                  // rouge : loin
}

// ───── Composants UI ──────────────────────────────────────────────────────
function KpiCard({ label, value, target, unit = '', sub, source, inverse = false, decimals = 0, color }) {
  const numericVal = typeof value === 'number' ? value : null;
  const numericTarget = typeof target === 'number' ? target : null;
  const ratio = numericVal != null && numericTarget != null && numericTarget > 0
    ? (inverse ? numericTarget / Math.max(numericVal, 0.0001) : numericVal / numericTarget)
    : null;
  const statusColor = color || colorForRatio(ratio, false);
  const progressPct = ratio == null ? null : Math.max(0, Math.min(100, ratio * 100));

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8ecf0',
      borderTop: `3px solid ${statusColor}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minHeight: 88,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? fmtNum(value, unit, decimals) : value || '—'}
      </div>
      {numericTarget != null && (
        <>
          <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Cible : {fmtNum(numericTarget, unit, decimals)}</span>
            {progressPct != null && <span style={{ color: statusColor, fontWeight: 700 }}>{Math.round(progressPct)}%</span>}
          </div>
          {progressPct != null && (
            <div style={{ height: 3, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: statusColor, borderRadius: 99, transition: 'width .4s' }} />
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
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 8, borderLeft: `3px solid ${accent}` }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', letterSpacing: -0.2 }}>{title}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>{children}</div>
    </div>
  );
}

// Donut SVG simple. data = [{ value, label, color }]
function Donut({ data, size = 140, label, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  let offset = -Math.PI / 2;
  const segments = data.map((d, i) => {
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
              <title>{s.label} : {fmtNum(s.value, '€')} ({s.pct.toFixed(0)}%)</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={radius * 0.55} fill="#fff" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{centerValue}</div>
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

function StatusBadge({ icone, nom, statut }) {
  const colors = {
    live:   { bg: '#d1fae5', fg: '#065f46', label: 'Live' },
    demo:   { bg: '#fef3c7', fg: '#92400e', label: 'Démo' },
    absent: { bg: '#fee2e2', fg: '#991b1b', label: 'Absent' },
  };
  const c = colors[statut] || colors.absent;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: c.bg, color: c.fg, borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
      <span style={{ fontSize: 10 }}>{icone}</span>
      <span>{nom}</span>
      <span style={{ fontSize: 9, opacity: 0.7 }}>· {c.label}</span>
    </div>
  );
}

// ───── Page principale ────────────────────────────────────────────────────
export default function KpiGroupe() {
  const [periode, setPeriode] = useState('mois');
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));

  // Calculs consolidés
  const totals = useMemo(() => {
    const sum = (k) => SOCIETES.reduce((s, soc) => s + KPI_DEMO[soc.id][k], 0);
    const wAvg = (k) => {
      const totalCa = sum('ca') || 1;
      return SOCIETES.reduce((s, soc) => s + KPI_DEMO[soc.id][k] * KPI_DEMO[soc.id].ca, 0) / totalCa;
    };
    return {
      caTotal: sum('ca'),
      margeBrute: wAvg('marge'),
      masseSalariale: sum('masseSalariale'),
      impayes: sum('impayes'),
      affaires: sum('affaires'),
      piscines: sum('piscines'),
      spas: sum('spas'),
      retards: sum('retards'),
      sav: sum('sav'),
      effectif: sum('effectif'),
      sousTraitance: wAvg('sousTraitance'),
      heures: sum('heures'),
      leads: sum('leads'),
      devis: sum('devis'),
      commandes: sum('commandes'),
      pipeline: sum('pipeline'),
      ticketMoyen: sum('ca') / Math.max(sum('commandes'), 1),
      conversion: sum('commandes') / Math.max(sum('devis'), 1),
      rex: sum('ca') * wAvg('marge') - sum('masseSalariale'),
      occupation: wAvg('marge') * 1.3 > 1 ? 1 : wAvg('marge') * 1.3, // proxy
    };
  }, []);

  const donutCa     = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].ca,        label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const donutLeads  = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].leads,     label: `${s.flag} ${s.nom}`, color: s.couleur }));
  const donutAffaires = SOCIETES.map(s => ({ value: KPI_DEMO[s.id].affaires,label: `${s.flag} ${s.nom}`, color: s.couleur }));

  return (
    <>
      <Head><title>KPI Groupe · Command Center</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Header command center */}
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', borderRadius: 14, padding: '18px 22px', marginBottom: 18, boxShadow: '0 6px 20px rgba(15,23,42,.15)' }}>
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
                  <button
                    key={p}
                    onClick={() => setPeriode(p)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: '1px solid #334155',
                      background: periode === p ? '#E67E22' : 'transparent',
                      color: periode === p ? '#fff' : '#cbd5e1',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p === 'mois' ? 'Mois' : p === 'trimestre' ? 'Trim.' : 'Année'}
                  </button>
                ))}
                <input
                  type="month"
                  value={mois}
                  onChange={(e) => setMois(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1', fontSize: 12, fontFamily: 'inherit' }}
                />
                <button
                  onClick={() => window.location.reload()}
                  style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#E67E22', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  🔄 Actualiser
                </button>
              </div>
            </div>

            {/* Status badges connecteurs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid #334155' }}>
              {CONNECTORS_STATUS.map(c => <StatusBadge key={c.id} {...c} />)}
            </div>
          </div>

          {/* ─── 1. CA Groupe Consolidé ─── */}
          <Section title="CA Groupe Consolidé" icon="💰" accent="#E67E22">
            <KpiCard label="CA Total Groupe"    value={totals.caTotal}     target={CIBLES.caTotal}     unit="€" source="Odoo" />
            <KpiCard label="CA 123SPA 🇫🇷"       value={KPI_DEMO.spa.ca}    target={CIBLES.caSpa}       unit="€" source="Odoo" />
            <KpiCard label="CA Luca 🇧🇪"          value={KPI_DEMO.luca.ca}   target={CIBLES.caLuca}      unit="€" source="Odoo" />
            <KpiCard label="CA Valorcia 🇱🇺"      value={KPI_DEMO.valorcia.ca} target={CIBLES.caValorcia} unit="€" source="Odoo" />
            <KpiCard label="Croissance MoM"      value={0.072}              target={CIBLES.croissance}  unit="%" decimals={1} sub="vs mois précédent" source="Calcul" />
          </Section>

          {/* ─── 2. Indicateurs Financiers ─── */}
          <Section title="Indicateurs Financiers" icon="📈" accent="#3498DB">
            <KpiCard label="Marge brute groupe"   value={totals.margeBrute}    target={CIBLES.margeBrute}    unit="%" decimals={1} sub="(CA - Achats) / CA" source="Odoo" />
            <KpiCard label="REX estimé"           value={totals.rex}           target={CIBLES.rex}           unit="€" source="Calcul" />
            <KpiCard label="Masse salariale"      value={totals.masseSalariale} target={CIBLES.masseSalariale} unit="€" source="Planneo" inverse />
            <KpiCard label="Impayés groupe"       value={totals.impayes}        target={CIBLES.impayes}        unit="€" source="Odoo" inverse color={totals.impayes === 0 ? '#16a34a' : '#dc2626'} />
            <KpiCard label="Trésorerie projetée"  value={71799}                                            unit="€" sub="fin S21" source="OneDrive" />
            <KpiCard label="Encaissé ce mois"     value={47200}                                            unit="€" source="Odoo" />
          </Section>

          {/* ─── 3. Performance Commerciale ─── */}
          <Section title="Performance Commerciale Groupe" icon="🎯" accent="#dc2626">
            <KpiCard label="Leads entrants"       value={totals.leads}        target={CIBLES.leads}       sub="tous canaux" source="Odoo CRM" />
            <KpiCard label="Devis envoyés"        value={totals.devis}        target={CIBLES.devis}       source="Odoo Vente" />
            <KpiCard label="Commandes signées"    value={totals.commandes}    target={CIBLES.commandes}   source="Odoo Vente" />
            <KpiCard label="Taux conversion"      value={totals.conversion}   target={CIBLES.conversion}  unit="%" decimals={1} sub="devis → commandes" source="Calcul" />
            <KpiCard label="Ticket moyen"         value={totals.ticketMoyen}                              unit="€" sub="CA / commandes" source="Calcul" />
            <KpiCard label="Pipeline commercial"  value={totals.pipeline}     target={CIBLES.pipeline}    unit="€" source="Odoo CRM" />
          </Section>

          {/* ─── 4. Donuts répartition par société ─── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 8, borderLeft: '3px solid #8E44AD' }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Répartition par société</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <Donut data={donutCa}       label="CA par société"     centerValue={fmtNum(totals.caTotal, '€')} />
              <Donut data={donutLeads}    label="Leads par société"  centerValue={`${totals.leads} leads`} />
              <Donut data={donutAffaires} label="Affaires en cours"  centerValue={`${totals.affaires} affaires`} />
            </div>
          </div>

          {/* ─── 5. Opérations ─── */}
          <Section title="Opérations" icon="🏗️" accent="#16a34a">
            <KpiCard label="Affaires en cours"    value={totals.affaires}                              source="Planneo" />
            <KpiCard label="Piscines livrées"     value={totals.piscines}     target={CIBLES.piscinesMois} sub="ce mois" source="Planneo" />
            <KpiCard label="Spas installés"       value={totals.spas}         target={CIBLES.spas}     source="Planneo" />
            <KpiCard label="Retards > 2 sem."     value={totals.retards}      target={CIBLES.retardsChantier} source="Planneo" inverse color={totals.retards <= CIBLES.retardsChantier ? '#16a34a' : '#dc2626'} />
            <KpiCard label="SAV ouverts"          value={totals.sav}          target={CIBLES.sav}      source="Planneo" inverse />
            <KpiCard label="Taux occupation"      value={totals.occupation}   target={CIBLES.occupation} unit="%" decimals={0} source="Planneo" />
          </Section>

          {/* ─── 6. RH ─── */}
          <Section title="RH & Équipes" icon="👥" accent="#0891b2">
            <KpiCard label="Effectif actif"       value={totals.effectif}     target={CIBLES.effectif}  source="Planneo" />
            <KpiCard label="Taux sous-traitance"  value={totals.sousTraitance} target={CIBLES.sousTraitance} unit="%" decimals={0} source="Planneo" inverse />
            <KpiCard label="Heures planifiées"    value={totals.heures}                                   unit="h" source="Planneo" />
            <KpiCard label="Masse salariale"      value={totals.masseSalariale} target={CIBLES.masseSalariale} unit="€" source="Paie" inverse />
          </Section>

          {/* ─── 7. Fiches par société ─── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 8, borderLeft: '3px solid #6b3fa0' }}>
              <span style={{ fontSize: 16 }}>🏢</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Fiches par société</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {SOCIETES.map(s => {
                const k = KPI_DEMO[s.id];
                const conv = k.commandes / Math.max(k.devis, 1);
                return (
                  <div key={s.id} style={{ background: '#fff', border: '1px solid #e8ecf0', borderLeft: `4px solid ${s.couleur}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{s.flag}</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{s.nom}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>CA</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.couleur }}>{fmtNum(k.ca, '€')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Leads</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{k.leads}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Conversion</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{(conv * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Affaires</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{k.affaires}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Marge</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{(k.marge * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Impayés</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: k.impayes > 0 ? '#dc2626' : '#16a34a' }}>{fmtNum(k.impayes, '€')}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 20, padding: '12px 16px', background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
            Données démo · Brancher Odoo + Planneo + Google Ads via la page <Link href="/connectors" style={{ color: '#E67E22', fontWeight: 700 }}>🔌 Connecteurs</Link> pour passer en live.
          </div>

        </div>
      </div>
    </>
  );
}
