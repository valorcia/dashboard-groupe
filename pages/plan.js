import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const STATUTS = {
  idee:      { label: 'Idée',       color: '#94a3b8', bg: '#f1f5f9' },
  planifie:  { label: 'Planifié',   color: '#0284c7', bg: '#e0f2fe' },
  en_cours:  { label: 'En cours',   color: '#eab308', bg: '#fef3c7' },
  termine:   { label: 'Terminé',    color: '#16a34a', bg: '#d1fae5' },
  abandonne: { label: 'Abandonné',  color: '#dc2626', bg: '#fee2e2' },
};
const PRIORITES = {
  basse:    { label: 'Basse',    color: '#94a3b8' },
  moyenne:  { label: 'Moyenne',  color: '#3b82f6' },
  haute:    { label: 'Haute',    color: '#f97316' },
  critique: { label: 'Critique', color: '#dc2626' },
};
const SOCIETES = {
  groupe:   { label: 'Groupe',   flag: '🌐' },
  spa:      { label: '123SPA',   flag: '🇫🇷' },
  luca:     { label: 'Luca',     flag: '🇧🇪' },
  valorcia: { label: 'Valorcia', flag: '🇱🇺' },
};

function StatutBadge({ statut }) {
  const s = STATUTS[statut] || STATUTS.idee;
  return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
}
function PrioriteBadge({ priorite }) {
  const p = PRIORITES[priorite] || PRIORITES.moyenne;
  return <span style={{ color: p.color, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>● {p.label}</span>;
}

// ─── Mindmap radial SVG ────────────────────────────────────────────────
function Mindmap({ plan, onSelect, selectedId, expandedIds, toggleExpanded }) {
  const ref = useRef(null);
  const { racine, noeuds } = plan;
  const axes = noeuds.filter(n => n.parent === 'racine');

  // Layout: racine au centre, axes en cercle autour, sous-noeuds en arc derrière chaque axe.
  const W = 900, H = 640;
  const cx = W / 2, cy = H / 2;
  const Raxe = 200;

  const elements = [];

  // Noeud racine
  elements.push({
    id: racine.id,
    x: cx, y: cy,
    w: 200, h: 60,
    label: racine.label,
    color: racine.couleur || '#1e293b',
    type: 'racine',
  });

  axes.forEach((axe, i) => {
    const angle = (-Math.PI / 2) + (i / axes.length) * Math.PI * 2;
    const ax = cx + Math.cos(angle) * Raxe;
    const ay = cy + Math.sin(angle) * Raxe;
    elements.push({
      id: axe.id, x: ax, y: ay, w: 170, h: 52,
      label: `${axe.icone || ''} ${axe.label}`,
      color: axe.couleur, type: 'axe',
      parent: 'racine', node: axe,
    });

    // Sous-noeuds en arc derrière l'axe
    if (expandedIds.has(axe.id)) {
      const enfants = noeuds.filter(n => n.parent === axe.id);
      const arcWidth = Math.PI / 3;
      const Rsub = 130;
      enfants.forEach((e, j) => {
        const subAngle = enfants.length === 1
          ? angle
          : angle - arcWidth / 2 + (j / (enfants.length - 1)) * arcWidth;
        const sx = ax + Math.cos(subAngle) * Rsub;
        const sy = ay + Math.sin(subAngle) * Rsub;
        elements.push({
          id: e.id, x: sx, y: sy, w: 140, h: 44,
          label: `${e.icone || ''} ${e.label}`,
          color: e.couleur, type: 'action',
          parent: axe.id, node: e,
        });
      });
    }
  });

  // Lignes parent→enfant
  const lignes = [];
  elements.forEach(el => {
    if (!el.parent) return;
    const p = elements.find(x => x.id === el.parent);
    if (!p) return;
    lignes.push({ x1: p.x, y1: p.y, x2: el.x, y2: el.y, color: el.color });
  });

  const totalAxes = axes.length;
  const expandedCount = expandedIds.size;
  const viewW = W, viewH = H;

  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: 14, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>🧠 Carte mentale — {noeuds.length} noeuds</div>
        <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
          <button onClick={() => axes.forEach(a => toggleExpanded(a.id, true))} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Tout déplier</button>
          <button onClick={() => axes.forEach(a => toggleExpanded(a.id, false))} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Tout replier</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <svg ref={ref} viewBox={`0 0 ${viewW} ${viewH}`} width="100%" style={{ minWidth: 700, maxWidth: '100%', display: 'block' }}>
          {/* Lignes en arrière-plan */}
          {lignes.map((l, i) => (
            <path
              key={`l-${i}`}
              d={`M ${l.x1} ${l.y1} C ${(l.x1 + l.x2) / 2} ${l.y1}, ${(l.x1 + l.x2) / 2} ${l.y2}, ${l.x2} ${l.y2}`}
              stroke={l.color} strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round"
            />
          ))}
          {/* Noeuds */}
          {elements.map((el) => {
            const isSel = selectedId === el.id;
            const isRacine = el.type === 'racine';
            const isAxe = el.type === 'axe';
            const enfants = el.node && noeuds.filter(n => n.parent === el.id).length;
            return (
              <g key={el.id} style={{ cursor: 'pointer' }} onClick={() => {
                if (isAxe) toggleExpanded(el.id);
                onSelect(el.id);
              }}>
                <rect
                  x={el.x - el.w / 2} y={el.y - el.h / 2}
                  width={el.w} height={el.h} rx={isRacine ? 14 : 10}
                  fill={isRacine ? el.color : '#fff'}
                  stroke={el.color}
                  strokeWidth={isSel ? 3 : isRacine ? 0 : 2}
                  filter={isSel ? 'url(#shadow)' : undefined}
                />
                <text
                  x={el.x} y={el.y + 4}
                  textAnchor="middle"
                  fontSize={isRacine ? 14 : isAxe ? 12 : 11}
                  fontWeight={isRacine ? 800 : 700}
                  fill={isRacine ? '#fff' : el.color}
                >
                  {el.label.length > 26 ? el.label.slice(0, 24) + '…' : el.label}
                </text>
                {el.node && el.node.avancement != null && !isRacine && (
                  <g>
                    <rect x={el.x - el.w / 2 + 8} y={el.y + el.h / 2 - 6} width={el.w - 16} height={3} rx={2} fill="#f1f5f9" />
                    <rect x={el.x - el.w / 2 + 8} y={el.y + el.h / 2 - 6} width={(el.w - 16) * (el.node.avancement / 100)} height={3} rx={2} fill={el.color} />
                  </g>
                )}
                {isAxe && enfants > 0 && (
                  <circle cx={el.x + el.w / 2 - 8} cy={el.y - el.h / 2 + 8} r={9} fill={el.color}>
                    <title>{enfants} sous-action{enfants > 1 ? 's' : ''}</title>
                  </circle>
                )}
                {isAxe && enfants > 0 && (
                  <text x={el.x + el.w / 2 - 8} y={el.y - el.h / 2 + 11} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="800">{enfants}</text>
                )}
              </g>
            );
          })}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
              <feOffset dx="0" dy="2" />
              <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
        <span>📊 {axes.length} axes stratégiques</span>
        <span>· {noeuds.filter(n => n.parent !== 'racine').length} actions détaillées</span>
        <span>· {expandedCount}/{totalAxes} dépliés</span>
        <span>· Cliquez un axe pour déplier/replier · Cliquez un noeud pour éditer ↓</span>
      </div>
    </div>
  );
}

// ─── Modal édition noeud ──────────────────────────────────────────────────
function EditModal({ node, parents, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    label: '', icone: '', couleur: '#3b82f6', parent: 'racine',
    objectif: '', responsable: '', echeance: '', statut: 'idee', priorite: 'moyenne',
    avancement: 0, societe: 'groupe', impact: '', notes: '',
    ...node,
  }));
  const isNew = !node.id;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{isNew ? '➕ Nouvelle action' : '✏️ Modifier'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Titre" full>
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={inp} placeholder="Ex: Brancher le CRM Odoo" />
          </Field>
          <Field label="Icône (emoji)"><input value={form.icone} onChange={e => setForm({ ...form, icone: e.target.value })} style={inp} placeholder="🎯" maxLength={2} /></Field>
          <Field label="Couleur"><input type="color" value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} style={{ ...inp, height: 38, padding: 4 }} /></Field>

          <Field label="Axe parent" full>
            <select value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} style={inp}>
              <option value="racine">— Racine (axe stratégique)</option>
              {parents.filter(p => p.id !== form.id).map(p => <option key={p.id} value={p.id}>{p.icone} {p.label}</option>)}
            </select>
          </Field>

          <Field label="Objectif" full>
            <input value={form.objectif} onChange={e => setForm({ ...form, objectif: e.target.value })} style={inp} placeholder="Ex: +40% leads en 6 mois" />
          </Field>

          <Field label="Responsable"><input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={inp} placeholder="Loïc" /></Field>
          <Field label="Échéance"><input type="date" value={form.echeance} onChange={e => setForm({ ...form, echeance: e.target.value })} style={inp} /></Field>

          <Field label="Statut">
            <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} style={inp}>
              {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Priorité">
            <select value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })} style={inp}>
              {Object.entries(PRIORITES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>

          <Field label="Société">
            <select value={form.societe} onChange={e => setForm({ ...form, societe: e.target.value })} style={inp}>
              {Object.entries(SOCIETES).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.label}</option>)}
            </select>
          </Field>
          <Field label="Avancement (%)"><input type="number" min={0} max={100} value={form.avancement} onChange={e => setForm({ ...form, avancement: parseInt(e.target.value) || 0 })} style={inp} /></Field>

          <Field label="Impact attendu" full><input value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} style={inp} placeholder="Ex: +15% marge brute" /></Field>
          <Field label="Notes / contexte" full><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, gap: 8 }}>
          {!isNew && form.id !== 'racine' && (
            <button onClick={() => { if (confirm('Supprimer ce noeud et toutes ses sous-actions ?')) onDelete(form.id); }}
              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🗑 Supprimer</button>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button onClick={onClose} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button onClick={() => onSave(form)} style={{ background: '#E67E22', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>💾 Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#fff' };
function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function PlanProgression() {
  const [plan, setPlan] = useState({ racine: { id: 'racine', label: 'Chargement…' }, noeuds: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editNode, setEditNode] = useState(null);
  const [filter, setFilter] = useState({ statut: 'all', priorite: 'all', axe: 'all' });
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/plan');
      const j = await r.json();
      if (j.ok) {
        setPlan(j.plan);
        // Au premier chargement, déplier tous les axes
        const axes = j.plan.noeuds.filter(n => n.parent === 'racine').map(n => n.id);
        setExpandedIds(new Set(axes));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const axes = useMemo(() => plan.noeuds.filter(n => n.parent === 'racine'), [plan.noeuds]);

  function toggleExpanded(id, force) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (force === true) next.add(id);
      else if (force === false) next.delete(id);
      else next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveNode(node) {
    setSaving(true);
    try {
      const r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: node.id === 'racine' ? 'updateRacine' : 'upsertNode', node }) });
      const j = await r.json();
      if (j.ok) {
        setPlan(j.plan);
        setSavedAt(new Date());
        setEditNode(null);
      } else {
        alert('Erreur : ' + j.error);
      }
    } catch (e) {
      alert('Erreur réseau : ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNode(id) {
    setSaving(true);
    try {
      const r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteNode', id }) });
      const j = await r.json();
      if (j.ok) { setPlan(j.plan); setEditNode(null); setSavedAt(new Date()); }
      else alert('Erreur : ' + j.error);
    } finally { setSaving(false); }
  }

  // Filtrage du tableau
  const filtered = plan.noeuds.filter(n => {
    if (filter.statut !== 'all' && n.statut !== filter.statut) return false;
    if (filter.priorite !== 'all' && n.priorite !== filter.priorite) return false;
    if (filter.axe !== 'all' && n.parent !== filter.axe && n.id !== filter.axe) return false;
    return true;
  });

  return (
    <>
      <Head><title>Plan de progression · Dashboard Groupe</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)', color: '#fff', borderRadius: 14, padding: '18px 22px', marginBottom: 16, boxShadow: '0 6px 20px rgba(91,33,182,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <Link href="/" style={{ fontSize: 11, color: '#c4b5fd', textDecoration: 'none' }}>← Dashboard</Link>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginTop: 4 }}>🧠 Plan de progression</div>
                <div style={{ fontSize: 13, color: '#ddd6fe', marginTop: 4 }}>Carte mentale stratégique + plan d'action détaillé — synchronisés</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {savedAt && <div style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>✓ Sauvé {savedAt.toLocaleTimeString()}</div>}
                <button
                  onClick={() => setEditNode({ id: '', parent: 'racine' })}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#E67E22', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >➕ Nouvelle action</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Chargement du plan…</div>
          ) : (
            <>
              {/* Mindmap */}
              <Mindmap
                plan={plan}
                onSelect={(id) => {
                  setSelected(id);
                  const node = id === 'racine' ? plan.racine : plan.noeuds.find(n => n.id === id);
                  if (node) setEditNode(node);
                }}
                selectedId={selected}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />

              {/* Filtres */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 18, marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>📋 Plan d'action détaillé</div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>· {filtered.length} action{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <select value={filter.axe} onChange={e => setFilter({ ...filter, axe: e.target.value })} style={{ ...inp, width: 'auto' }}>
                    <option value="all">Tous les axes</option>
                    {axes.map(a => <option key={a.id} value={a.id}>{a.icone} {a.label}</option>)}
                  </select>
                  <select value={filter.statut} onChange={e => setFilter({ ...filter, statut: e.target.value })} style={{ ...inp, width: 'auto' }}>
                    <option value="all">Tous statuts</option>
                    {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select value={filter.priorite} onChange={e => setFilter({ ...filter, priorite: e.target.value })} style={{ ...inp, width: 'auto' }}>
                    <option value="all">Toutes priorités</option>
                    {Object.entries(PRIORITES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Tableau */}
              <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8ecf0' }}>
                        {['Action', 'Axe', 'Objectif', 'Responsable', 'Échéance', 'Statut', 'Priorité', 'Société', 'Avancement', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 12px', textAlign: i === 8 ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((n, i) => {
                        const axe = axes.find(a => a.id === n.parent);
                        const soc = SOCIETES[n.societe] || SOCIETES.groupe;
                        return (
                          <tr key={n.id} onClick={() => { setSelected(n.id); setEditNode(n); }}
                              style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', background: selected === n.id ? '#fef3c7' : 'transparent' }}
                              onMouseEnter={e => { if (selected !== n.id) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (selected !== n.id) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '10px 12px', borderLeft: `3px solid ${n.couleur || '#cbd5e1'}` }}>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{n.icone} {n.label}</div>
                              {n.impact && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>→ {n.impact}</div>}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>{axe ? `${axe.icone} ${axe.label}` : <em style={{ color: '#94a3b8' }}>Racine</em>}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12, maxWidth: 200 }}>{n.objectif || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>{n.responsable || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{n.echeance ? new Date(n.echeance).toLocaleDateString('fr-FR') : '—'}</td>
                            <td style={{ padding: '10px 12px' }}><StatutBadge statut={n.statut} /></td>
                            <td style={{ padding: '10px 12px' }}><PrioriteBadge priorite={n.priorite} /></td>
                            <td style={{ padding: '10px 12px', fontSize: 12 }}>{soc.flag} {soc.label}</td>
                            <td style={{ padding: '10px 12px', minWidth: 100 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ width: `${n.avancement || 0}%`, height: '100%', background: n.couleur || '#3b82f6', borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', minWidth: 32 }}>{n.avancement || 0}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 16 }}>✏️</td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucune action ne correspond aux filtres.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stats globales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 }}>
                {Object.entries(STATUTS).map(([k, v]) => {
                  const count = plan.noeuds.filter(n => n.statut === k && n.parent !== 'racine').length;
                  return (
                    <div key={k} style={{ background: '#fff', border: '1px solid #e8ecf0', borderLeft: `3px solid ${v.color}`, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{v.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {editNode && (
            <EditModal
              node={editNode}
              parents={axes}
              onClose={() => setEditNode(null)}
              onSave={saveNode}
              onDelete={deleteNode}
            />
          )}

        </div>
      </div>
    </>
  );
}
