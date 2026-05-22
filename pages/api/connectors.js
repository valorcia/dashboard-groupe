// Lecture (GET) / écriture (PUT) de la config des connecteurs.
// PUT attend un body { updates: [{ key, value }] } et chiffre automatiquement
// les clés marquées secret dans le schéma.

import { getConnectorsSchema, readAllMergedMasked, allConnectorKeys, getStoreStatus } from '../../lib/connectors';
import { writeMany, isStoreReady } from '../../lib/configStore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const status = getStoreStatus();
    let values = {};
    try {
      values = await readAllMergedMasked();
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message, status });
    }
    return res.status(200).json({
      ok: true,
      status,
      schema: getConnectorsSchema(),
      values,
    });
  }

  if (req.method === 'PUT') {
    if (!isStoreReady()) {
      return res.status(503).json({
        ok: false,
        error: 'Store de config non prêt — vérifier CONNECTORS_MASTER_KEY (64 hex chars) et la connexion Redis (KV_REST_API_URL/TOKEN ou UPSTASH_REDIS_REST_URL/TOKEN).',
        status: getStoreStatus(),
      });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const updates = Array.isArray(body.updates) ? body.updates : null;
    if (!updates) return res.status(400).json({ ok: false, error: 'Body invalide : { updates: [{ key, value }] } attendu' });

    const allowed = new Map(allConnectorKeys().map(k => [k.key, k.secret]));
    const cleaned = [];
    for (const u of updates) {
      if (!u || typeof u.key !== 'string' || !allowed.has(u.key)) {
        return res.status(400).json({ ok: false, error: `Clé non autorisée : ${u?.key}` });
      }
      cleaned.push({ key: u.key, value: u.value, secret: allowed.get(u.key) });
    }

    try {
      await writeMany(cleaned);
      return res.status(200).json({ ok: true, updated: cleaned.length });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
}
