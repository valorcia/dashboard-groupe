// Stockage du plan de progression (mindmap + actions) dans KV.
// Pas de chiffrement nécessaire ici : ce sont des données business non sensibles.
// Fallback en mémoire / valeur seed si Redis n'est pas configuré.

import { Redis } from '@upstash/redis';

const KV_KEY = 'plan:state:v1';

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const SEED = {
  racine: {
    id: 'racine',
    label: 'Stratégie Groupe Valorcia',
    type: 'racine',
    couleur: '#1e293b',
    notes: 'Pilotage des 3 sociétés Piscine & Spa',
  },
  noeuds: [
    { id: 'commercial',  parent: 'racine', label: 'Croissance commerciale', icone: '🎯', couleur: '#dc2626',
      objectif: '+40% leads sur 6 mois', responsable: 'Loïc',     echeance: '2026-09-01', statut: 'en_cours', priorite: 'haute',    avancement: 25, societe: 'groupe', impact: 'CA + leads' },
    { id: 'production',  parent: 'racine', label: 'Excellence production',  icone: '🏗️', couleur: '#0891b2',
      objectif: 'Respect délais > 90%',   responsable: 'Christina', echeance: '2026-12-31', statut: 'planifie', priorite: 'haute',    avancement: 10, societe: 'groupe', impact: 'Marge + satisfaction' },
    { id: 'finance',     parent: 'racine', label: 'Pilotage financier',     icone: '💰', couleur: '#16a34a',
      objectif: 'Marge brute > 55%',      responsable: 'Loïc',     echeance: '2026-06-30', statut: 'en_cours', priorite: 'critique', avancement: 60, societe: 'groupe', impact: 'REX' },
    { id: 'digital',     parent: 'racine', label: 'Acquisition digitale',   icone: '📣', couleur: '#7c3aed',
      objectif: 'ROAS Google Ads > 4x',   responsable: 'À nommer', echeance: '2026-07-15', statut: 'idee',     priorite: 'moyenne',  avancement: 5,  societe: 'groupe', impact: 'Leads + notoriété' },
    { id: 'sav',         parent: 'racine', label: 'Service après-vente',    icone: '🛠️', couleur: '#eab308',
      objectif: 'Délai prise en charge < 48h', responsable: 'Équipe SAV', echeance: '2026-08-01', statut: 'idee', priorite: 'moyenne', avancement: 0, societe: 'groupe', impact: 'Fidélisation' },
    { id: 'rh',          parent: 'racine', label: 'Recrutement & équipes',  icone: '👥', couleur: '#0284c7',
      objectif: '+3 FTE qualifiés',       responsable: 'Loïc',     echeance: '2026-10-31', statut: 'planifie', priorite: 'haute',    avancement: 15, societe: 'groupe', impact: 'Capacité production' },

    // Sous-actions Commercial
    { id: 'crm-odoo',    parent: 'commercial', label: 'Brancher CRM Odoo en live', icone: '🔌', couleur: '#dc2626',
      objectif: 'Live data sur dashboard agent commercial', responsable: 'Loïc', echeance: '2026-06-15', statut: 'en_cours', priorite: 'haute', avancement: 70, societe: 'groupe', impact: 'Suivi temps réel' },
    { id: 'jotform-wh',  parent: 'commercial', label: 'Webhook Jotform → Odoo', icone: '📝', couleur: '#dc2626',
      objectif: 'Création auto des leads', responsable: 'Loïc', echeance: '2026-06-30', statut: 'planifie', priorite: 'moyenne', avancement: 0, societe: 'groupe', impact: 'Zéro perte de lead' },
    { id: 'closing',     parent: 'commercial', label: 'Coach IA closing > 30k€', icone: '🎙️', couleur: '#dc2626',
      objectif: 'Taux conversion +10pts',  responsable: 'À nommer', echeance: '2026-09-30', statut: 'idee', priorite: 'moyenne', avancement: 0, societe: 'groupe', impact: 'Marge sur gros deals' },

    // Sous-actions Production
    { id: 'planneo-api', parent: 'production', label: 'API Planneo branchée KPI', icone: '🟧', couleur: '#0891b2',
      objectif: 'Vue temps réel chantiers', responsable: 'Loïc', echeance: '2026-07-01', statut: 'planifie', priorite: 'haute', avancement: 0, societe: 'groupe', impact: 'Pilotage opérationnel' },
    { id: 'photos-mob',  parent: 'production', label: 'App mobile photos chantier', icone: '📸', couleur: '#0891b2',
      objectif: 'Reporting visuel quotidien', responsable: 'Christina', echeance: '2026-10-01', statut: 'idee', priorite: 'basse', avancement: 0, societe: 'groupe', impact: 'Transparence client' },

    // Sous-actions Finance
    { id: 'treso-onedrive', parent: 'finance', label: 'Trésorerie OneDrive → dashboard', icone: '📁', couleur: '#16a34a',
      objectif: 'Vue hebdo temps réel',     responsable: 'Loïc', echeance: '2026-06-01', statut: 'en_cours', priorite: 'critique', avancement: 85, societe: 'groupe', impact: 'Décisions cash' },
    { id: 'relance-fact', parent: 'finance', label: 'Agent relance impayés auto', icone: '💰', couleur: '#16a34a',
      objectif: 'Impayés < 5k€',            responsable: 'Loïc', echeance: '2026-08-31', statut: 'planifie', priorite: 'haute', avancement: 0, societe: 'groupe', impact: 'Cash flow' },

    // Sous-actions Digital
    { id: 'gads-spa',    parent: 'digital', label: 'Optim Google Ads 123SPA', icone: '🟦', couleur: '#7c3aed',
      objectif: 'CPA < 80€',                responsable: 'À nommer', echeance: '2026-07-31', statut: 'idee', priorite: 'haute', avancement: 0, societe: 'spa', impact: 'Leads qualifiés' },
    { id: 'seo-luca',    parent: 'digital', label: 'SEO Luca Créations BE',   icone: '🔍', couleur: '#7c3aed',
      objectif: 'Top 3 sur "piscine Liège"', responsable: 'À nommer', echeance: '2026-12-31', statut: 'idee', priorite: 'moyenne', avancement: 0, societe: 'luca', impact: 'Trafic organique' },
  ],
};

export async function readPlan() {
  const redis = getRedis();
  if (!redis) return SEED;
  try {
    const raw = await redis.get(KV_KEY);
    if (!raw) return SEED;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return SEED;
  }
}

export async function writePlan(plan) {
  const redis = getRedis();
  if (!redis) throw new Error('Redis non configuré (KV_REST_API_URL/TOKEN manquants).');
  await redis.set(KV_KEY, JSON.stringify(plan));
}

export function getSeed() { return SEED; }
