// Stockage des frais fixes par société dans KV. Seed avec les données du
// fichier Excel "TABLEAU_FRAIS_FIXE_2025.xlsx" (3 sociétés × 12 mois × N charges).
// Édition inline depuis l'app, écriture KV non chiffrée (données business).

import { Redis } from '@upstash/redis';

const KV_KEY = 'finance:frais-fixes:v1';

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const SEED = {
  annee: 2026,
  mis_a_jour: '2026-05-22',
  societes: {
    '123spa': {
      id: '123spa', nom: '123SPA', flag: '🇫🇷', couleur: '#3498DB',
      charges: [
        { id: 'dougs',           label: 'DOUGS',              categorie: 'Compta',     mois: [94.8, 94.8, 94.8, 94.8, 94.8, 94.8, 94.8, 94.8, 94.8, 94.8, 94.8, 94.8] },
        { id: 'loyer-123spa',    label: 'LOYER 123SPA',       categorie: 'Loyer',      mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'cic',             label: 'CIC',                categorie: 'Banque',     mois: [82.29, 82.29, 89.91, 89.91, 89.91, 89.91, 89.91, 89.91, 89.91, 89.91, 89.91, 89.91] },
        { id: 'ass-voiture',     label: 'ASSURANCE VOITURE',  categorie: 'Assurance',  mois: [62.75, 62.75, 62.75, 62.75, 62.75, 62.75, 62.75, 62.75, 62.75, 62.75, 62.75, 62.75] },
        { id: 'pret-123spa',     label: 'PRÊT 123SPA',        categorie: 'Prêt',       mois: [1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37, 1485.37] },
        { id: 'pret-voiture',    label: 'PRÊT VOITURE',       categorie: 'Prêt',       mois: [437.83, 437.83, 437.83, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'pub-123spa',      label: 'PUB',                categorie: 'Pub',        mois: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600] },
        { id: 'orange',          label: 'ORANGE',             categorie: 'Téléphone',  mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'mma',             label: 'MMA',                categorie: 'Assurance',  mois: [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14] },
        { id: 'loyer-mondelange',label: 'LOYER MONDELANGE',   categorie: 'Loyer',      mois: [660, 660, 660, 660, 660, 660, 660, 660, 660, 660, 660, 660] },
      ],
    },
    'valorcia': {
      id: 'valorcia', nom: 'Valorcia', flag: '🇱🇺', couleur: '#E67E22',
      charges: [
        { id: 'essence-val',     label: 'ESSENCE',            categorie: 'Carburant',  mois: [300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311] },
        { id: 'pub-google',      label: 'PUB GOOGLE',         categorie: 'Pub',        mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'pub-facebook-val',label: 'PUB FACEBOOK',       categorie: 'Pub',        mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'loyer-val',       label: 'LOYER',              categorie: 'Loyer',      mois: [400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400] },
        { id: 'vehicule-val',    label: 'VEHICULE',           categorie: 'Véhicule',   mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'ass-val',         label: 'ASSURANCE',          categorie: 'Assurance',  mois: [419.02, 419.02, 419.02, 419.02, 419.02, 419.02, 419.02, 419.02, 419.02, 419.02, 419.02, 307.68] },
        { id: 'salaire-val',     label: 'SALAIRES + CHARGES', categorie: 'Salaires',   mois: [15000, 15000, 15000, 15000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000] },
        { id: 'tel-val',         label: 'TÉLÉPHONE',          categorie: 'Téléphone',  mois: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50] },
        { id: 'frais-compte-val',label: 'FRAIS COMPTE',       categorie: 'Banque',     mois: [17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17] },
        { id: 'asagest-val',     label: 'ASAGEST',            categorie: 'Comptable',  mois: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
        { id: 'comptable-val',   label: 'COMPTABLE',          categorie: 'Comptable',  mois: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200] },
        { id: 'obligation-val',  label: 'OBLIGATION',         categorie: 'Prêt',       mois: [1350, 1350, 1350, 1350, 1350, 1350, 1350, 1350, 1350, 1350, 1350, 1350] },
      ],
    },
    'luca': {
      id: 'luca', nom: 'Luca Création', flag: '🇧🇪', couleur: '#27AE60',
      charges: [
        { id: 'essence-luca',    label: 'ESSENCE',            categorie: 'Carburant',  mois: [400, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311] },
        { id: 'loyer-luca',      label: 'LOYER',              categorie: 'Loyer',      mois: [1980, 1980, 1980, 1980, 1980, 1980, 1980, 1980, 1980, 1980, 1980, 1980] },
        { id: 'loyer-spa-luca',  label: 'LOYER SPA',          categorie: 'Loyer',      mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'pub-fb-luca',     label: 'PUB FACEBOOK',       categorie: 'Pub',        mois: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'ass-luca',        label: 'ASSURANCE',          categorie: 'Assurance',  mois: [700, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'quicktalk-luca',  label: 'QUICKTALK',          categorie: 'Téléphone',  mois: [19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19] },
        { id: 'tel-luca',        label: 'TÉLÉPHONE',          categorie: 'Téléphone',  mois: [79.83, 79.83, 79.83, 79.83, 79.83, 79.83, 79.83, 79.83, 79.83, 79.83, 79.83, 79.83] },
        { id: 'frais-compte-luca',label: 'FRAIS COMPTE',      categorie: 'Banque',     mois: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50] },
        { id: 'comptable-luca',  label: 'COMPTABLE',          categorie: 'Comptable',  mois: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200] },
        { id: 'vanheede-luca',   label: 'VANHEEDE',           categorie: 'Frais',      mois: [67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67] },
        { id: 'pe4p-luca',       label: 'PE4P',               categorie: 'Frais',      mois: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300] },
        { id: 'cred-48-luca',    label: 'Crédit 48',          categorie: 'Prêt',       mois: [881.73, 881.73, 881.73, 881.73, 881.73, 881.73, 881.73, 881.73, 0, 0, 0, 0] },
        { id: 'cred-79-luca',    label: 'Crédit 79',          categorie: 'Prêt',       mois: [279.73, 279.73, 279.73, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'cred-49-luca',    label: 'Crédit 49',          categorie: 'Prêt',       mois: [440.86, 440.86, 440.86, 440.86, 440.86, 440.86, 0, 0, 0, 0, 0, 0] },
        { id: 'cred-67-luca',    label: 'Crédit 67 (fin fév 2029)', categorie: 'Prêt', mois: [2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01, 2758.01] },
        { id: 'cred-57-luca',    label: 'Crédit 57 (fin mai 2026)', categorie: 'Prêt', mois: [574.57, 574.57, 574.57, 574.57, 574.57, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'socamut-luca',    label: 'SOCAMUT (Mars 2026)',categorie: 'Prêt',       mois: [0, 0, 830, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 'tva-luca',        label: 'TVA',                categorie: 'TVA',        mois: [0, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000] },
      ],
    },
  },
};

export async function readFraisFixes() {
  const redis = getRedis();
  if (!redis) return SEED;
  try {
    const raw = await redis.get(KV_KEY);
    if (!raw) return SEED;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch { return SEED; }
}

export async function writeFraisFixes(data) {
  const redis = getRedis();
  if (!redis) throw new Error('Redis non configuré (KV_REST_API_URL/TOKEN manquants).');
  data.mis_a_jour = new Date().toISOString().slice(0, 10);
  await redis.set(KV_KEY, JSON.stringify(data));
}

export function getSeed() { return SEED; }
