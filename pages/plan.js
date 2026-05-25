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
const TYPES = {
  categorie: { label: 'Catégorie (regroupement)' },
  action:    { label: 'Action (détaillée)' },
};

function StatutBadge({ statut }) {
  const s = STATUTS[statut] || STATUTS.idee;
  return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
}
function PrioriteBadge({ priorite }) {
  const p = PRIORITES[priorite] || PRIORITES.moyenne;
  return <span style={{ color: p.color, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>● {p.label}</span>;
}

// ─── Helpers hiérarchie ────────────────────────────────────────────────────
function buildIndex(plan) {
  const byId = new Map();
  byId.set('racine', { ...plan.racine, _children: [] });
  for (const n of plan.noeuds) byId.set(n.id, { ...n, _children: [] });
  for (const n of plan.noeuds) {
    const p = byId.get(n.parent);
    if (p) p._children.push(byId.get(n.id));
  }
  return byId;
}
function childrenOf(plan, id) {
  return plan.noeuds.filter(n => n.parent === id);
}
function isCategory(n) {
  return n.type === 'categorie';
}
// Calcule l'avancement moyen d'une catégorie en remontant ses descendants leaf.
function avancementCategorie(plan, id) {
  const enfants = childrenOf(plan, id);
  if (enfants.length === 0) return null;
  let s = 0, c = 0;
  for (const e of enfants) {
    if (isCategory(e)) {
      const v = avancementCategorie(plan, e.id);
      if (v != null) { s += v; c++; }
    } else if (typeof e.avancement === 'number') {
      s += e.avancement; c++;
    }
  }
  return c ? s / c : null;
}
// Lineage : chemin du parent (sans la racine), du plus proche au plus haut.
function lineage(plan, id) {
  const chain = [];
  let cur = plan.noeuds.find(n => n.id === id);
  while (cur && cur.parent && cur.parent !== 'racine') {
    const p = plan.noeuds.find(n => n.id === cur.parent);
    if (!p) break;
    chain.push(p);
    cur = p;
  }
  return chain.reverse();
}

// ─── Mindmap radial — profondeur libre ─────────────────────────────────────
function Mindmap({ plan, onSelect, selectedId, expandedIds, toggleExpanded }) {
  const W = 1100, H = 720;
  const cx = W / 2, cy = H / 2;
  const elements = [];
  const lignes = [];

  elements.push({ id: 'racine', x: cx, y: cy, w: 220, h: 64, label: plan.racine.label, color: plan.racine.couleur || '#1e293b', depth: 0, isRoot: true });

  // Layout récursif : pour chaque niveau, on positionne les enfants dans un arc autour du parent.
  function layoutChildren(parentId, px, py, baseAngle, arcWidth, depth) {
    if (!expandedIds.has(parentId) && parentId !== 'racine') return;
    const children = childrenOf(plan, parentId);
    if (children.length === 0) return;

    const radius = depth === 1 ? 220 : depth === 2 ? 140 : 95;
    const nodeW = depth === 1 ? 180 : depth === 2 ? 150 : 130;
    const nodeH = depth === 1 ? 54 : depth === 2 ? 46 : 38;

    children.forEach((c, i) => {
      const t = children.length === 1 ? 0.5 : i / (children.length - 1);
      const angle = baseAngle - arcWidth / 2 + t * arcWidth;
      const x = px + Math.cos(angle) * radius;
      const y = py + Math.sin(angle) * radius;

      const childArcWidth = depth === 1 ? Math.PI / 2.5 : Math.PI / 3.2;
      const nbGrandChildren = childrenOf(plan, c.id).length;

      elements.push({
        id: c.id, x, y, w: nodeW, h: nodeH,
        label: `${c.icone || ''} ${c.label}`,
        color: c.couleur || '#64748b',
        depth, node: c,
        hasChildren: nbGrandChildren > 0,
        nbChildren: nbGrandChildren,
        isCategory: isCategory(c),
      });
      lignes.push({ x1: px, y1: py, x2: x, y2: y, color: c.couleur || '#cbd5e1' });

      // Récursion sur les enfants
      layoutChildren(c.id, x, y, angle, childArcWidth, depth + 1);
    });
  }

  // Niveau 1 : axes autour de la racine, sur 360°
  const axes = childrenOf(plan, 'racine');
  axes.forEach((axe, i) => {
    const angle = (-Math.PI / 2) + (i / axes.length) * Math.PI * 2;
    const x = cx + Math.cos(angle) * 230;
    const y = cy + Math.sin(angle) * 230;
    const nbChildren = childrenOf(plan, axe.id).length;
    elements.push({
      id: axe.id, x, y, w: 200, h: 60,
      label: `${axe.icone || ''} ${axe.label}`,
      color: axe.couleur || '#64748b',
      depth: 1, node: axe, hasChildren: nbChildren > 0, nbChildren, isCategory: isCategory(axe),
    });
    lignes.push({ x1: cx, y1: cy, x2: x, y2: y, color: axe.couleur });
    // Niveau 2+ : sous-catégories puis actions
    layoutChildren(axe.id, x, y, angle, Math.PI / 2.5, 2);
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>🧠 Carte mentale — {plan.noeuds.length} noeuds</div>
        <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
          <button onClick={() => {
            const allIds = new Set(plan.noeuds.filter(n => childrenOf(plan, n.id).length > 0).map(n => n.id));
            allIds.forEach(id => toggleExpanded(id, true));
          }} style={btnSmall}>Tout déplier</button>
          <button onClick={() => toggleExpanded(null, 'reset')} style={btnSmall}>Tout replier</button>
        </div>
      </div>
      <div style={{ overflow: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 700, maxWidth: '100%', display: 'block' }}>
          {lignes.map((l, i) => (
            <path key={`l-${i}`}
              d={`M ${l.x1} ${l.y1} C ${(l.x1 + l.x2) / 2} ${l.y1}, ${(l.x1 + l.x2) / 2} ${l.y2}, ${l.x2} ${l.y2}`}
              stroke={l.color} strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinecap="round" />
          ))}
          {elements.map((el) => {
            const isSel = selectedId === el.id;
            const isRoot = el.isRoot;
            const adv = el.node && (isCategory(el.node) ? avancementCategorie(plan, el.id) : el.node.avancement);
            return (
              <g key={el.id} style={{ cursor: 'pointer' }} onClick={() => {
                if (el.hasChildren) toggleExpanded(el.id);
                onSelect(el.id);
              }}>
                <rect x={el.x - el.w / 2} y={el.y - el.h / 2} width={el.w} height={el.h}
                  rx={isRoot ? 14 : el.isCategory ? 10 : 8}
                  fill={isRoot ? el.color : el.isCategory ? `${el.color}15` : '#fff'}
                  stroke={el.color}
                  strokeWidth={isSel ? 3 : isRoot ? 0 : el.isCategory ? 2 : 1.5}
                  strokeDasharray={el.isCategory && !isRoot ? '0' : undefined}
                />
                <text x={el.x} y={el.y + 4} textAnchor="middle"
                  fontSize={isRoot ? 14 : el.depth === 1 ? 12 : el.depth === 2 ? 11 : 10}
                  fontWeight={isRoot ? 800 : el.isCategory ? 700 : 600}
                  fill={isRoot ? '#fff' : el.color}>
                  {el.label.length > 28 ? el.label.slice(0, 26) + '…' : el.label}
                </text>
                {adv != null && !isRoot && (
                  <g>
                    <rect x={el.x - el.w / 2 + 8} y={el.y + el.h / 2 - 6} width={el.w - 16} height={3} rx={2} fill="#f1f5f9" />
                    <rect x={el.x - el.w / 2 + 8} y={el.y + el.h / 2 - 6} width={(el.w - 16) * (adv / 100)} height={3} rx={2} fill={el.color} />
                  </g>
                )}
                {el.hasChildren && !isRoot && (
                  <>
                    <circle cx={el.x + el.w / 2 - 8} cy={el.y - el.h / 2 + 8} r={10} fill={el.color} />
                    <text x={el.x + el.w / 2 - 8} y={el.y - el.h / 2 + 11} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="800">{el.nbChildren}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
        <span>📊 {axes.length} axes</span>
        <span>· 🗂 {plan.noeuds.filter(n => isCategory(n)).length} catégories</span>
        <span>· ▢ {plan.noeuds.filter(n => !isCategory(n) && n.parent !== 'racine').length} actions</span>
        <span>· Click sur un noeud avec compteur pour déplier/replier</span>
      </div>
    </div>
  );
}

const btnSmall = { padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' };

// ─── Table groupée par catégorie ───────────────────────────────────────────
function TableGroupee({ plan, filter, onSelect, selected }) {
  // On parcourt récursivement la hiérarchie et on produit des "groupes" avec leur chemin.
  function passesFilter(n) {
    if (filter.statut !== 'all' && n.statut !== filter.statut) return false;
    if (filter.priorite !== 'all' && n.priorite !== filter.priorite) return false;
    return true;
  }

  // Collecte les actions visibles puis on les agrège par chemin de catégories.
  const rows = [];
  function walk(parentId, chain) {
    const enfants = childrenOf(plan, parentId);
    for (const c of enfants) {
      const nextChain = [...chain, c];
      if (isCategory(c)) {
        walk(c.id, nextChain);
      } else {
        if (filter.axe !== 'all' && !nextChain.some(n => n.id === filter.axe)) continue;
        if (!passesFilter(c)) continue;
        rows.push({ node: c, chain: nextChain.slice(0, -1) });
      }
    }
  }
  walk('racine', []);

  // Groupage par chemin (clé = ids du chemin)
  const groupes = new Map();
  for (const r of rows) {
    const key = r.chain.map(n => n.id).join('>');
    if (!groupes.has(key)) groupes.set(key, { chain: r.chain, items: [] });
    groupes.get(key).items.push(r.node);
  }

  if (rows.length === 0) {
    return <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucune action ne correspond aux filtres.</div>;
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8ecf0' }}>
              {['Action', 'Objectif', 'Responsable', 'Échéance', 'Statut', 'Priorité', 'Société', 'Avancement', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i === 7 ? 'left' : 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...groupes.values()].map((g, gi) => {
              const groupLabel = g.chain.map(n => `${n.icone || ''} ${n.label}`).join(' › ') || '— Racine';
              const groupColor = g.chain[0]?.couleur || '#cbd5e1';
              const avgAdv = g.items.reduce((s, n) => s + (n.avancement || 0), 0) / g.items.length;
              return (
                <React.Fragment key={gi}>
                  <tr style={{ background: `${groupColor}15` }}>
                    <td colSpan={9} style={{ padding: '8px 12px', borderLeft: `4px solid ${groupColor}`, fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                      <span style={{ color: groupColor }}>📂 {groupLabel}</span>
                      <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: 10 }}>· {g.items.length} action{g.items.length > 1 ? 's' : ''} · avancement moyen {Math.round(avgAdv)}%</span>
                    </td>
                  </tr>
                  {g.items.map((n, i) => {
                    const soc = SOCIETES[n.societe] || SOCIETES.groupe;
                    return (
                      <tr key={n.id} onClick={() => onSelect(n)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected === n.id ? '#fef3c7' : 'transparent' }}
                        onMouseEnter={e => { if (selected !== n.id) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { if (selected !== n.id) e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '10px 12px', borderLeft: `3px solid ${n.couleur || '#cbd5e1'}`, paddingLeft: 22 }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{n.icone} {n.label}</div>
                          {n.impact && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>→ {n.impact}</div>}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12, maxWidth: 240 }}>{n.objectif || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>{n.responsable || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{n.echeance ? new Date(n.echeance).toLocaleDateString('fr-FR') : '—'}</td>
                        <td style={{ padding: '10px 12px' }}><StatutBadge statut={n.statut} /></td>
                        <td style={{ padding: '10px 12px' }}><PrioriteBadge priorite={n.priorite} /></td>
                        <td style={{ padding: '10px 12px', fontSize: 12 }}>{soc.flag} {soc.label}</td>
                        <td style={{ padding: '10px 12px', minWidth: 110 }}>
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
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Modal édition ─────────────────────────────────────────────────────────
function EditModal({ node, plan, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    label: '', icone: '', couleur: '#3b82f6', parent: 'racine', type: 'action',
    objectif: '', responsable: '', echeance: '', statut: 'idee', priorite: 'moyenne',
    avancement: 0, societe: 'groupe', impact: '', notes: '',
    ...node,
  }));
  const isNew = !node.id;
  const isCat = form.type === 'categorie';

  // Toutes les catégories possibles comme parent (sauf soi-même et ses descendants)
  const descendants = useMemo(() => {
    if (!form.id) return new Set();
    const d = new Set([form.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of plan.noeuds) {
        if (d.has(n.parent) && !d.has(n.id)) { d.add(n.id); changed = true; }
      }
    }
    return d;
  }, [form.id, plan.noeuds]);

  const parentsPossibles = [
    { id: 'racine', label: '— Racine —', icone: '🌳' },
    ...plan.noeuds.filter(n => !descendants.has(n.id)).map(n => ({ ...n, label: lineagePath(plan, n) })),
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, maxWidth: 660, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{isNew ? '➕ Nouveau noeud' : '✏️ Modifier'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>

        {/* Type sélection */}
        {form.id !== 'racine' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: '#f8fafc', padding: 4, borderRadius: 8 }}>
            {Object.entries(TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setForm({ ...form, type: k })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none', background: form.type === k ? '#1e293b' : 'transparent', color: form.type === k ? '#fff' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {k === 'categorie' ? '🗂' : '✓'} {v.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Titre" full>
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={inp} placeholder={isCat ? 'Ex: Acquisition leads' : 'Ex: Brancher le CRM Odoo'} />
          </Field>
          <Field label="Icône (emoji)"><input value={form.icone} onChange={e => setForm({ ...form, icone: e.target.value })} style={inp} placeholder="🎯" maxLength={2} /></Field>
          <Field label="Couleur"><input type="color" value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} style={{ ...inp, height: 38, padding: 4 }} /></Field>

          <Field label="Parent (axe ou catégorie)" full>
            <select value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} style={inp}>
              {parentsPossibles.map(p => <option key={p.id} value={p.id}>{p.icone || ''} {p.label}</option>)}
            </select>
          </Field>

          {!isCat && (
            <>
              <Field label="Objectif" full>
                <input value={form.objectif} onChange={e => setForm({ ...form, objectif: e.target.value })} style={inp} placeholder="Ex: +40% leads en 6 mois" />
              </Field>
              <Field label="Responsable"><input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={inp} /></Field>
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
            </>
          )}
          <Field label="Notes / contexte" full><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
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

function lineagePath(plan, node) {
  const chain = [];
  let cur = node;
  while (cur && cur.parent && cur.parent !== 'racine') {
    chain.push(cur.label);
    cur = plan.noeuds.find(n => n.id === cur.parent);
  }
  chain.push(node.label);
  // dédoublonne (cas du noeud lui-même)
  return chain.reverse().filter((v, i, a) => i === 0 || v !== a[i-1]).join(' › ');
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

// ─── Page principale ────────────────────────────────────────────────────────
export default function PlanProgression() {
  const [plan, setPlan] = useState({ racine: { id: 'racine', label: 'Chargement…' }, noeuds: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editNode, setEditNode] = useState(null);
  const [filter, setFilter] = useState({ statut: 'all', priorite: 'all', axe: 'all' });
  const [savedAt, setSavedAt] = useState(null);
  const [view, setView] = useState('mindmap'); // 'mindmap' | 'table' | 'split'

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/plan');
      const j = await r.json();
      if (j.ok) {
        // Compat : assigne type 'action' par défaut si absent
        j.plan.noeuds = j.plan.noeuds.map(n => ({ ...n, type: n.type || 'action' }));
        setPlan(j.plan);
        // Auto-déplie axes + catégories au premier load
        const idsAvecEnfants = j.plan.noeuds.filter(n => j.plan.noeuds.some(c => c.parent === n.id)).map(n => n.id);
        setExpandedIds(new Set(idsAvecEnfants));
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const axes = useMemo(() => plan.noeuds.filter(n => n.parent === 'racine'), [plan.noeuds]);

  function toggleExpanded(id, mode) {
    setExpandedIds(prev => {
      if (mode === 'reset') return new Set();
      const next = new Set(prev);
      if (mode === true) next.add(id);
      else if (mode === false) next.delete(id);
      else next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveNode(node) {
    try {
      const r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: node.id === 'racine' ? 'updateRacine' : 'upsertNode', node }) });
      const j = await r.json();
      if (j.ok) { setPlan(j.plan); setSavedAt(new Date()); setEditNode(null); }
      else alert('Erreur : ' + j.error);
    } catch (e) { alert('Erreur réseau : ' + e.message); }
  }

  async function deleteNode(id) {
    const r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteNode', id }) });
    const j = await r.json();
    if (j.ok) { setPlan(j.plan); setEditNode(null); setSavedAt(new Date()); }
    else alert('Erreur : ' + j.error);
  }

  function onSelectFromMindmap(id) {
    setSelected(id);
    const node = id === 'racine' ? plan.racine : plan.noeuds.find(n => n.id === id);
    if (node) setEditNode(node);
  }
  function onSelectFromTable(node) { setSelected(node.id); setEditNode(node); }

  return (
    <>
      <Head><title>Plan de progression · Dashboard Groupe</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)', color: '#fff', borderRadius: 14, padding: '18px 22px', marginBottom: 14, boxShadow: '0 6px 20px rgba(91,33,182,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <Link href="/" style={{ fontSize: 11, color: '#c4b5fd', textDecoration: 'none' }}>← Dashboard</Link>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginTop: 4 }}>🧠 Plan de progression</div>
                <div style={{ fontSize: 13, color: '#ddd6fe', marginTop: 4 }}>Carte mentale stratégique + plan d'action détaillé — synchronisés</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {savedAt && <div style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>✓ Sauvé {savedAt.toLocaleTimeString()}</div>}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,.2)', borderRadius: 8, padding: 3, gap: 2 }}>
                  {[
                    { id: 'mindmap', label: '🧠 Carte' },
                    { id: 'split',   label: '⬓ Côte à côte' },
                    { id: 'table',   label: '☰ Tableau' },
                  ].map(v => (
                    <button key={v.id} onClick={() => setView(v.id)}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: view === v.id ? '#E67E22' : 'transparent', color: view === v.id ? '#fff' : '#ddd6fe', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setEditNode({ id: '', parent: 'racine', type: 'action' })}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#E67E22', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>➕ Action</button>
                <button onClick={() => setEditNode({ id: '', parent: 'racine', type: 'categorie' })}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗂 Catégorie</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Chargement du plan…</div>
          ) : (
            <>
              {/* Filtres communs */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Filtres :</span>
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

              {/* Vue : mindmap seule */}
              {view === 'mindmap' && (
                <Mindmap plan={plan} onSelect={onSelectFromMindmap} selectedId={selected} expandedIds={expandedIds} toggleExpanded={toggleExpanded} />
              )}

              {/* Vue : table seule */}
              {view === 'table' && (
                <TableGroupee plan={plan} filter={filter} onSelect={onSelectFromTable} selected={selected} />
              )}

              {/* Vue : côte à côte */}
              {view === 'split' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
                  <Mindmap plan={plan} onSelect={onSelectFromMindmap} selectedId={selected} expandedIds={expandedIds} toggleExpanded={toggleExpanded} />
                  <TableGroupee plan={plan} filter={filter} onSelect={onSelectFromTable} selected={selected} />
                </div>
              )}

              {/* Stats globales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 }}>
                {Object.entries(STATUTS).map(([k, v]) => {
                  const count = plan.noeuds.filter(n => n.statut === k && !isCategory(n)).length;
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
            <EditModal node={editNode} plan={plan} onClose={() => setEditNode(null)} onSave={saveNode} onDelete={deleteNode} />
          )}

        </div>
      </div>
    </>
  );
}
