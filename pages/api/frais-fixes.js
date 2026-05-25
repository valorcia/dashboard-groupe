import { readFraisFixes, writeFraisFixes } from '../../lib/fraisFixesStore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readFraisFixes();
    return res.status(200).json({ ok: true, data });
  }
  if (req.method === 'PUT') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!body.societes) return res.status(400).json({ ok: false, error: 'data invalide' });
    try {
      await writeFraisFixes(body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(503).json({ ok: false, error: e.message });
    }
  }
  if (req.method === 'POST') {
    // Action ciblée : { action, societeId, charge|chargeId, mois?, value? }
    const { action, societeId, charge, chargeId, mois, value } = req.body || {};
    const data = await readFraisFixes();
    const soc = data.societes[societeId];
    if (!soc) return res.status(404).json({ ok: false, error: 'Société introuvable' });
    if (action === 'updateCell') {
      const c = soc.charges.find(x => x.id === chargeId);
      if (!c) return res.status(404).json({ ok: false, error: 'Charge introuvable' });
      c.mois[mois] = parseFloat(value) || 0;
    } else if (action === 'updateCharge') {
      const idx = soc.charges.findIndex(x => x.id === chargeId);
      if (idx >= 0) soc.charges[idx] = { ...soc.charges[idx], ...charge };
    } else if (action === 'addCharge') {
      soc.charges.push({ ...charge, id: charge.id || `c-${Date.now()}`, mois: charge.mois || Array(12).fill(0) });
    } else if (action === 'deleteCharge') {
      soc.charges = soc.charges.filter(x => x.id !== chargeId);
    } else {
      return res.status(400).json({ ok: false, error: 'Action inconnue' });
    }
    try {
      await writeFraisFixes(data);
      return res.status(200).json({ ok: true, data });
    } catch (e) {
      return res.status(503).json({ ok: false, error: e.message });
    }
  }
  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
}
