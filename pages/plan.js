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

// ─── Mindmap interactive façon MindMeister ─────────────────────────────────
// Pan : drag avec la souris ou le doigt sur un espace vide.
// Zoom : molette (ou pinch) + boutons + / - / reset.
// Boutons + sur chaque noeud → ajout rapide d'une tâche enfant.
function Mindmap({ plan, onSelect, selectedId, expandedIds, toggleExpanded, onAddChild, onEdit, onMoveNode }) {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tx: 0, ty: 0 });
  const [hoverId, setHoverId] = useState(null);
  // Drag d'un noeud individuel : { id, startX, startY, baseX, baseY }
  const [nodeDrag, setNodeDrag] = useState(null);
  // Positions custom des noeuds (id → {x, y}) — vient du plan, modifié au drop
  const customPositions = useMemo(() => {
    const map = {};
    for (const n of plan.noeuds) {
      if (n.x != null && n.y != null) map[n.id] = { x: n.x, y: n.y };
    }
    return map;
  }, [plan.noeuds]);

  // ─ Layout récursif (mêmes calculs qu'avant, mais on stocke aussi le noeud entier)
  const cx = 0, cy = 0; // espace logique infini centré sur (0,0)
  const elements = [];
  const lignes = [];

  elements.push({ id: 'racine', x: cx, y: cy, w: 220, h: 64, label: plan.racine.label, color: plan.racine.couleur || '#1e293b', depth: 0, isRoot: true });

  function layoutChildren(parentId, px, py, baseAngle, arcWidth, depth) {
    if (!expandedIds.has(parentId) && parentId !== 'racine') return;
    const children = childrenOf(plan, parentId);
    if (children.length === 0) return;
    const radius = depth === 1 ? 260 : depth === 2 ? 170 : 120;
    const nodeW = depth === 1 ? 200 : depth === 2 ? 160 : 140;
    const nodeH = depth === 1 ? 60 : depth === 2 ? 50 : 42;
    children.forEach((c, i) => {
      const t = children.length === 1 ? 0.5 : i / (children.length - 1);
      const angle = baseAngle - arcWidth / 2 + t * arcWidth;
      const auto_x = px + Math.cos(angle) * radius;
      const auto_y = py + Math.sin(angle) * radius;
      const pos = customPositions[c.id] || { x: auto_x, y: auto_y };
      const x = pos.x, y = pos.y;
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
        angle,
        custom: !!customPositions[c.id],
      });
      const parentEl = elements.find(e => e.id === parentId);
      const fromX = parentEl ? parentEl.x : px;
      const fromY = parentEl ? parentEl.y : py;
      lignes.push({ x1: fromX, y1: fromY, x2: x, y2: y, color: c.couleur || '#cbd5e1' });
      layoutChildren(c.id, auto_x, auto_y, angle, childArcWidth, depth + 1);
    });
  }

  const axes = childrenOf(plan, 'racine');
  axes.forEach((axe, i) => {
    const angle = (-Math.PI / 2) + (i / Math.max(axes.length, 1)) * Math.PI * 2;
    const auto_x = cx + Math.cos(angle) * 280;
    const auto_y = cy + Math.sin(angle) * 280;
    const pos = customPositions[axe.id] || { x: auto_x, y: auto_y };
    const x = pos.x, y = pos.y;
    const nbChildren = childrenOf(plan, axe.id).length;
    elements.push({
      id: axe.id, x, y, w: 210, h: 66,
      label: `${axe.icone || ''} ${axe.label}`,
      color: axe.couleur || '#64748b',
      depth: 1, node: axe, hasChildren: nbChildren > 0, nbChildren, isCategory: isCategory(axe), angle,
      custom: !!customPositions[axe.id],
    });
    lignes.push({ x1: cx, y1: cy, x2: x, y2: y, color: axe.couleur });
    layoutChildren(axe.id, auto_x, auto_y, angle, Math.PI / 2.5, 2);
  });

  // ─ Auto-fit au premier rendu ou quand la map change
  useEffect(() => {
    if (elements.length === 0) return;
    const xs = elements.map(e => e.x);
    const ys = elements.map(e => e.y);
    const minX = Math.min(...xs) - 150;
    const maxX = Math.max(...xs) + 150;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 80;
    const w = maxX - minX, h = maxY - minY;
    const containerW = svgRef.current?.clientWidth || 1100;
    const containerH = 640;
    const k = Math.min(containerW / w, containerH / h, 1);
    setTransform({ x: containerW / 2 - ((minX + maxX) / 2) * k, y: containerH / 2 - ((minY + maxY) / 2) * k, k });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.noeuds.length, expandedIds.size]);

  function onMouseDown(e) {
    if (e.target.closest('[data-action-btn]')) return;
    const nodeEl = e.target.closest('[data-node-id]');
    if (nodeEl && nodeEl.dataset.nodeId !== 'racine') {
      // Drag du noeud
      const id = nodeEl.dataset.nodeId;
      const el = elements.find(x => x.id === id);
      if (!el) return;
      setNodeDrag({ id, startMouseX: e.clientX, startMouseY: e.clientY, baseX: el.x, baseY: el.y, moved: false });
      e.preventDefault();
      return;
    }
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y });
  }
  function onMouseMove(e) {
    if (nodeDrag) {
      const dx = (e.clientX - nodeDrag.startMouseX) / transform.k;
      const dy = (e.clientY - nodeDrag.startMouseY) / transform.k;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        // Modification optimiste : on bouge le noeud localement
        if (!nodeDrag.moved) setNodeDrag({ ...nodeDrag, moved: true });
        onMoveNode(nodeDrag.id, nodeDrag.baseX + dx, nodeDrag.baseY + dy, false);
      }
      return;
    }
    if (!dragging) return;
    setTransform(t => ({ ...t, x: dragStart.tx + (e.clientX - dragStart.x), y: dragStart.ty + (e.clientY - dragStart.y) }));
  }
  function onMouseUp(e) {
    if (nodeDrag) {
      if (nodeDrag.moved) {
        // Drop → on persiste la position en KV
        const el = elements.find(x => x.id === nodeDrag.id);
        if (el) onMoveNode(nodeDrag.id, el.x, el.y, true);
      } else {
        // Click pur sans déplacement → sélection + expand
        const el = elements.find(x => x.id === nodeDrag.id);
        if (el && el.hasChildren) toggleExpanded(el.id);
        onSelect(nodeDrag.id);
      }
      setNodeDrag(null);
      return;
    }
    setDragging(false);
  }
  function onWheel(e) {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0012;
    setTransform(t => {
      const newK = Math.max(0.2, Math.min(3, t.k * (1 + delta)));
      const factor = newK / t.k;
      return { x: px - (px - t.x) * factor, y: py - (py - t.y) * factor, k: newK };
    });
  }

  function fit() {
    if (elements.length === 0) return;
    const xs = elements.map(e => e.x);
    const ys = elements.map(e => e.y);
    const w = (Math.max(...xs) + 150) - (Math.min(...xs) - 150);
    const h = (Math.max(...ys) + 80) - (Math.min(...ys) - 80);
    const cw = svgRef.current?.clientWidth || 1100;
    const ch = 640;
    const k = Math.min(cw / w, ch / h, 1);
    setTransform({ x: cw / 2 - ((Math.min(...xs) + Math.max(...xs)) / 2) * k, y: ch / 2 - ((Math.min(...ys) + Math.max(...ys)) / 2) * k, k });
  }
  function zoomIn() { setTransform(t => ({ ...t, k: Math.min(3, t.k * 1.2) })); }
  function zoomOut() { setTransform(t => ({ ...t, k: Math.max(0.2, t.k / 1.2) })); }
  function recenter() { setTransform({ x: (svgRef.current?.clientWidth || 1100) / 2, y: 320, k: 1 }); }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: 14, position: 'relative' }}>
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
      <div
        data-mindmap-area
        ref={svgRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        style={{
          position: 'relative',
          height: 640,
          background: 'radial-gradient(circle at center, #fafbfc 0%, #f1f5f9 100%)',
          backgroundImage: 'radial-gradient(circle, #cbd5e133 1px, transparent 1px)',
          backgroundSize: `${24 * transform.k}px ${24 * transform.k}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
          borderRadius: 10,
          overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {/* Lignes */}
            {lignes.map((l, i) => (
              <path key={`l-${i}`}
                d={`M ${l.x1} ${l.y1} C ${(l.x1 + l.x2) / 2} ${l.y1}, ${(l.x1 + l.x2) / 2} ${l.y2}, ${l.x2} ${l.y2}`}
                stroke={l.color} strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinecap="round" />
            ))}
            {/* Noeuds */}
            {elements.map((el) => {
              const isSel = selectedId === el.id;
              const isRoot = el.isRoot;
              const isHover = hoverId === el.id;
              const adv = el.node && (isCategory(el.node) ? avancementCategorie(plan, el.id) : el.node.avancement);
              return (
                <g key={el.id} data-node-id={el.id}
                   onMouseEnter={() => setHoverId(el.id)}
                   onMouseLeave={() => setHoverId(null)}
                   style={{ cursor: nodeDrag?.id === el.id ? 'grabbing' : (isRoot ? 'pointer' : 'grab') }}>
                  <rect x={el.x - el.w / 2} y={el.y - el.h / 2} width={el.w} height={el.h}
                    rx={isRoot ? 14 : el.isCategory ? 10 : 8}
                    fill={isRoot ? el.color : el.isCategory ? `${el.color}15` : '#fff'}
                    stroke={el.color}
                    strokeWidth={isSel ? 3 : isRoot ? 0 : el.isCategory ? 2 : 1.5}
                    strokeDasharray={el.custom ? '0' : undefined}
                    filter={isHover ? 'url(#nodeShadow)' : undefined}
                  />
                  {el.custom && (
                    <circle cx={el.x - el.w / 2 + 6} cy={el.y - el.h / 2 + 6} r={4} fill="#16a34a" stroke="#fff" strokeWidth="1.5">
                      <title>Position personnalisée</title>
                    </circle>
                  )}
                  <text x={el.x} y={el.y + 4} textAnchor="middle"
                    fontSize={isRoot ? 14 : el.depth === 1 ? 12 : el.depth === 2 ? 11 : 10}
                    fontWeight={isRoot ? 800 : el.isCategory ? 700 : 600}
                    fill={isRoot ? '#fff' : el.color}
                    pointerEvents="none"
                  >
                    {el.label.length > 28 ? el.label.slice(0, 26) + '…' : el.label}
                  </text>
                  {adv != null && !isRoot && (
                    <g pointerEvents="none">
                      <rect x={el.x - el.w / 2 + 8} y={el.y + el.h / 2 - 6} width={el.w - 16} height={3} rx={2} fill="#f1f5f9" />
                      <rect x={el.x - el.w / 2 + 8} y={el.y + el.h / 2 - 6} width={(el.w - 16) * (adv / 100)} height={3} rx={2} fill={el.color} />
                    </g>
                  )}
                  {el.hasChildren && !isRoot && (
                    <g pointerEvents="none">
                      <circle cx={el.x + el.w / 2 - 8} cy={el.y - el.h / 2 + 8} r={10} fill={el.color} />
                      <text x={el.x + el.w / 2 - 8} y={el.y - el.h / 2 + 11} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="800">{el.nbChildren}</text>
                    </g>
                  )}
                  {/* Boutons d'action au hover */}
                  {(isHover || isSel) && !nodeDrag && (
                    <g>
                      <g data-action-btn="true" onClick={(e) => { e.stopPropagation(); onAddChild(el.id); }} style={{ cursor: 'pointer' }}>
                        <circle cx={el.x + el.w / 2 + 14} cy={el.y} r={11} fill="#16a34a" stroke="#fff" strokeWidth="2" />
                        <text x={el.x + el.w / 2 + 14} y={el.y + 4} textAnchor="middle" fontSize="14" fill="#fff" fontWeight="800" pointerEvents="none">+</text>
                      </g>
                      {!isRoot && (
                        <g data-action-btn="true" onClick={(e) => { e.stopPropagation(); onEdit(el.id); }} style={{ cursor: 'pointer' }}>
                          <circle cx={el.x - el.w / 2 - 14} cy={el.y} r={11} fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                          <text x={el.x - el.w / 2 - 14} y={el.y + 4} textAnchor="middle" fontSize="11" fill="#fff" pointerEvents="none">✎</text>
                        </g>
                      )}
                      {/* Bouton de reset position (si custom) */}
                      {el.custom && (
                        <g data-action-btn="true" onClick={(e) => { e.stopPropagation(); onMoveNode(el.id, null, null, true); }} style={{ cursor: 'pointer' }}>
                          <circle cx={el.x + el.w / 2 + 14} cy={el.y - 26} r={9} fill="#64748b" stroke="#fff" strokeWidth="1.5">
                            <title>Reset position auto</title>
                          </circle>
                          <text x={el.x + el.w / 2 + 14} y={el.y - 23} textAnchor="middle" fontSize="9" fill="#fff" pointerEvents="none">↺</text>
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
            <defs>
              <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                <feOffset dx="0" dy="3" />
                <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
          </g>
        </svg>

        {/* Contrôles flottants : zoom + recentrage */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', borderRadius: 8, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <button onClick={zoomIn} title="Zoomer" style={mapBtn}>＋</button>
          <button onClick={zoomOut} title="Dézoomer" style={mapBtn}>−</button>
          <button onClick={fit} title="Tout voir" style={{ ...mapBtn, fontSize: 12 }}>⛶</button>
          <button onClick={recenter} title="Recentrer" style={{ ...mapBtn, fontSize: 12 }}>⌂</button>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,.95)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
          🔍 {Math.round(transform.k * 100)}% · 🖱 Glisser le fond pour déplacer · Molette pour zoomer
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
        <span>📊 {axes.length} axes</span>
        <span>· 🗂 {plan.noeuds.filter(n => isCategory(n)).length} catégories</span>
        <span>· ▢ {plan.noeuds.filter(n => !isCategory(n) && n.parent !== 'racine').length} actions</span>
        <span>· <span style={{ color: '#16a34a', fontWeight: 700 }}>+</span> au survol pour ajouter · <span style={{ color: '#3b82f6', fontWeight: 700 }}>✎</span> pour éditer</span>
      </div>
    </div>
  );
}

const mapBtn = { width: 30, height: 30, borderRadius: 6, border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const btnSmall = { padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' };

// ─── Table arborescente : affiche TOUS les niveaux (cat + sous-cat + tâches) ─
function TableGroupee({ plan, filter, onSelect, selected, onAddChild }) {
  function passes(n) {
    if (filter.statut !== 'all' && n.statut !== filter.statut) return false;
    if (filter.priorite !== 'all' && n.priorite !== filter.priorite) return false;
    return true;
  }
  function countLeafs(id) {
    let n = 0;
    for (const c of childrenOf(plan, id)) {
      if (isCategory(c)) n += countLeafs(c.id);
      else n++;
    }
    return n;
  }

  // Filtre axe : si défini, on ne descend que dans l'axe sélectionné
  const rootChildren = filter.axe === 'all' ? childrenOf(plan, 'racine') : childrenOf(plan, 'racine').filter(a => a.id === filter.axe);

  // Walk récursif : on rend TOUTES les catégories ET sous-catégories en lignes
  // distinctes, suivies de leurs actions. Une catégorie sans descendants qui
  // passe les filtres est masquée.
  const rows = [];
  function walk(parentId, depth, ancestorIds, parentChain) {
    const enfants = parentId === 'racine'
      ? rootChildren
      : childrenOf(plan, parentId);
    for (const c of enfants) {
      const nextAncestors = [...ancestorIds, c.id];
      const nextChain = [...parentChain, c];
      if (isCategory(c)) {
        // Collecte les descendants pour savoir si la cat a contenu visible
        const before = rows.length;
        walk(c.id, depth + 1, nextAncestors, nextChain);
        const after = rows.length;
        if (after > before) {
          const nbTotal = countLeafs(c.id);
          const avgAdv = avancementCategorie(plan, c.id);
          // Header inséré au-dessus des descendants
          rows.splice(before, 0, { type: 'cat', node: c, depth, nbTotal, avgAdv, chain: parentChain });
        }
      } else {
        if (!passes(c)) continue;
        rows.push({ type: 'action', node: c, depth, chain: parentChain });
      }
    }
  }
  walk('racine', 0, [], []);

  if (rows.length === 0) {
    return <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucune action ne correspond aux filtres.</div>;
  }

  const INDENT = 22;
  // Profondeur de l'axe parent pour calculer la bordure colorée à gauche
  function axeColorOf(chain) {
    return chain[0]?.couleur || '#cbd5e1';
  }
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8ecf0' }}>
              {['Hiérarchie', 'Objectif', 'Responsable', 'Échéance', 'Statut', 'Priorité', 'Société', 'Avancement', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const n = r.node;
              const indent = r.depth * INDENT;
              const axeColor = r.depth === 0 ? (n.couleur || '#cbd5e1') : axeColorOf(r.chain);
              if (r.type === 'cat') {
                const isAxe = r.depth === 0;
                const isSousCat = r.depth === 1;
                return (
                  <tr key={`cat-${n.id}-${i}`} style={{
                    background: isAxe ? `${n.couleur}18` : `${n.couleur}08`,
                    borderTop: isAxe ? '3px solid #e8ecf0' : 'none',
                  }}>
                    <td colSpan={9} style={{
                      padding: isAxe ? '10px 12px' : '6px 12px',
                      paddingLeft: 12 + indent,
                      borderLeft: `${isAxe ? 5 : 3}px solid ${axeColor}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {/* Tags niveau */}
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: n.couleur, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {isAxe ? 'AXE' : isSousCat ? 'SOUS-CATÉGORIE' : `NIVEAU ${r.depth + 1}`}
                        </span>
                        <span style={{ fontSize: isAxe ? 15 : 13, fontWeight: 800, color: n.couleur }}>
                          {isAxe ? '📂' : '📁'} {n.icone} {n.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                          · {r.nbTotal} action{r.nbTotal > 1 ? 's' : ''}
                          {r.avgAdv != null && ` · avancement moy. ${Math.round(r.avgAdv)}%`}
                        </span>
                        {/* Mini barre d'avancement */}
                        {r.avgAdv != null && (
                          <div style={{ width: 80, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${r.avgAdv}%`, height: '100%', background: n.couleur, borderRadius: 99 }} />
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onAddChild(n.id); }}
                          style={{ marginLeft: 'auto', padding: '3px 10px', fontSize: 11, fontWeight: 700, background: n.couleur, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                          + Ajouter
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(n); }}
                          style={{ padding: '3px 8px', fontSize: 11, background: 'transparent', color: n.couleur, border: `1px solid ${n.couleur}`, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          ✎
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              const soc = SOCIETES[n.societe] || SOCIETES.groupe;
              // Breadcrumb d'arborescence pour les actions (utile en mode filtre ou recherche)
              const breadcrumb = r.chain.length > 0 ? r.chain.map(c => c.label).join(' › ') : '';
              return (
                <tr key={n.id} onClick={() => onSelect(n)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected === n.id ? '#fef3c7' : 'transparent' }}
                  onMouseEnter={e => { if (selected !== n.id) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (selected !== n.id) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ padding: '8px 12px', paddingLeft: 12 + indent, borderLeft: `3px solid ${axeColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#f1f5f9', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>TÂCHE</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{n.icone} {n.label}</span>
                    </div>
                    {n.impact && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, marginLeft: 4 }}>→ {n.impact}</div>}
                    {breadcrumb && r.chain.length > 0 && (
                      <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2, fontStyle: 'italic' }}>{breadcrumb}</div>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#475569', fontSize: 12, maxWidth: 240 }}>{n.objectif || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#475569', fontSize: 12 }}>{n.responsable || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{n.echeance ? new Date(n.echeance).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ padding: '8px 12px' }}><StatutBadge statut={n.statut} /></td>
                  <td style={{ padding: '8px 12px' }}><PrioriteBadge priorite={n.priorite} /></td>
                  <td style={{ padding: '8px 12px', fontSize: 12 }}>{soc.flag} {soc.label}</td>
                  <td style={{ padding: '8px 12px', minWidth: 110 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${n.avancement || 0}%`, height: '100%', background: n.couleur || '#3b82f6', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', minWidth: 32 }}>{n.avancement || 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 14 }}>✏️</td>
                </tr>
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
  }
  function onEditFromMindmap(id) {
    const node = id === 'racine' ? plan.racine : plan.noeuds.find(n => n.id === id);
    if (node) setEditNode(node);
  }
  function onAddChildFromMindmap(parentId) {
    setEditNode({ id: '', parent: parentId, type: 'action', couleur: '#3b82f6' });
  }
  function onSelectFromTable(node) { setSelected(node.id); setEditNode(node); }

  // Drag d'un noeud : optimistic update (persist = false) puis save au drop (persist = true)
  // Si x === null → reset à la position auto
  async function onMoveNode(id, x, y, persist) {
    setPlan(p => {
      const next = { ...p, noeuds: p.noeuds.map(n => {
        if (n.id !== id) return n;
        if (x === null) {
          const { x: _, y: __, ...rest } = n;
          return rest;
        }
        return { ...n, x, y };
      }) };
      return next;
    });
    if (persist) {
      const node = plan.noeuds.find(n => n.id === id);
      const patch = x === null ? { id, x: null, y: null } : { id, x, y };
      try {
        const r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upsertNode', node: { ...node, ...patch } }) });
        const j = await r.json();
        if (j.ok) { setPlan(j.plan); setSavedAt(new Date()); }
      } catch {}
    }
  }

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
                <Mindmap plan={plan} onSelect={onSelectFromMindmap} selectedId={selected} expandedIds={expandedIds} toggleExpanded={toggleExpanded} onAddChild={onAddChildFromMindmap} onEdit={onEditFromMindmap} onMoveNode={onMoveNode} />
              )}

              {/* Vue : table seule */}
              {view === 'table' && (
                <TableGroupee plan={plan} filter={filter} onSelect={onSelectFromTable} selected={selected} onAddChild={onAddChildFromMindmap} />
              )}

              {/* Vue : côte à côte */}
              {view === 'split' && (
                <div data-plan-split style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
                  <Mindmap plan={plan} onSelect={onSelectFromMindmap} selectedId={selected} expandedIds={expandedIds} toggleExpanded={toggleExpanded} onAddChild={onAddChildFromMindmap} onEdit={onEditFromMindmap} onMoveNode={onMoveNode} />
                  <TableGroupee plan={plan} filter={filter} onSelect={onSelectFromTable} selected={selected} onAddChild={onAddChildFromMindmap} />
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
