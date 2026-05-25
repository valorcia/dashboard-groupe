// CRUD du plan de progression. GET retourne l'état complet, PUT remplace le tout.
// Action POST { action: "upsertNode", node: {...} } met à jour un noeud unique.

import { readPlan, writePlan } from '../../lib/planStore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const plan = await readPlan();
    return res.status(200).json({ ok: true, plan });
  }

  if (req.method === 'PUT') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!body.racine || !Array.isArray(body.noeuds)) {
      return res.status(400).json({ ok: false, error: 'Plan invalide : { racine, noeuds } attendu' });
    }
    try {
      await writePlan(body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(503).json({ ok: false, error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { action, node, id } = req.body || {};
    const plan = await readPlan();

    if (action === 'upsertNode' && node && node.id) {
      const idx = plan.noeuds.findIndex(n => n.id === node.id);
      if (idx >= 0) plan.noeuds[idx] = { ...plan.noeuds[idx], ...node };
      else plan.noeuds.push(node);
    } else if (action === 'deleteNode' && id) {
      // supprime le noeud et tous ses descendants
      const toDelete = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of plan.noeuds) {
          if (toDelete.has(n.parent) && !toDelete.has(n.id)) {
            toDelete.add(n.id);
            changed = true;
          }
        }
      }
      plan.noeuds = plan.noeuds.filter(n => !toDelete.has(n.id));
    } else if (action === 'updateRacine' && node) {
      plan.racine = { ...plan.racine, ...node };
    } else {
      return res.status(400).json({ ok: false, error: 'Action inconnue : "upsertNode" | "deleteNode" | "updateRacine"' });
    }

    try {
      await writePlan(plan);
      return res.status(200).json({ ok: true, plan });
    } catch (e) {
      return res.status(503).json({ ok: false, error: e.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
}
