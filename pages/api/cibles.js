// Expose les cibles KPI (clés CIBLE_*) en lecture seule via getConfigValue,
// qui interroge KV chiffré puis fallback env vars. Renvoie un objet
// { caTotal, caSpa, ... } avec conversion automatique des pourcentages.

import { getConfigValue } from '../../lib/connectors';

const MAP = {
  CIBLE_CA_TOTAL: { f: 'caTotal' }, CIBLE_CA_SPA: { f: 'caSpa' }, CIBLE_CA_LUCA: { f: 'caLuca' }, CIBLE_CA_VALORCIA: { f: 'caValorcia' },
  CIBLE_CROISSANCE_MOM: { f: 'croissance', pct: true }, CIBLE_MARGE_BRUTE: { f: 'margeBrute', pct: true },
  CIBLE_REX: { f: 'rex' }, CIBLE_MASSE_SALARIALE: { f: 'masseSalariale' },
  CIBLE_PISCINES_MOIS: { f: 'piscinesMois' }, CIBLE_SPAS: { f: 'spas' },
  CIBLE_OCCUPATION: { f: 'occupation', pct: true }, CIBLE_RESPECT_DELAIS: { f: 'respectDelais', pct: true },
  CIBLE_EFFECTIF: { f: 'effectif' }, CIBLE_SOUS_TRAITANCE: { f: 'sousTraitance', pct: true },
  CIBLE_LEADS: { f: 'leads' }, CIBLE_DEVIS: { f: 'devis' }, CIBLE_COMMANDES: { f: 'commandes' },
  CIBLE_CONVERSION: { f: 'conversion', pct: true }, CIBLE_PIPELINE: { f: 'pipeline' },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'GET attendu' });
  }
  const cibles = {};
  for (const [key, meta] of Object.entries(MAP)) {
    const v = await getConfigValue(key);
    if (v == null || v === '') continue;
    const n = parseFloat(String(v).replace(',', '.'));
    if (!isFinite(n)) continue;
    cibles[meta.f] = meta.pct ? n / 100 : n;
  }
  res.setHeader('Cache-Control', 'public, max-age=10');
  return res.status(200).json({ ok: true, cibles });
}
