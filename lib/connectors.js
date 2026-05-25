// Schéma des connecteurs disponibles + helper pour lire la config effective
// (KV chiffré → fallback sur les env vars Vercel).
//
// Les champs peuvent porter un attribut `societe` :
//   - 'all'  (défaut implicite) → applique à tout le groupe
//   - 'spa' | 'luca' | 'valorcia' → spécifique à une société
// Le rendu UI groupe automatiquement les champs par société.

import { readAll, readAllMasked, isStoreReady, storeStatus } from './configStore';

export const SOCIETES_GROUPE = [
  { id: 'spa',      nom: '123SPA',          flag: '🇫🇷', couleur: '#3498DB' },
  { id: 'luca',     nom: 'Luca Création',   flag: '🇧🇪', couleur: '#27AE60' },
  { id: 'valorcia', nom: 'Valorcia',        flag: '🇱🇺', couleur: '#E67E22' },
];

export const CONNECTORS = [
  {
    id: 'graph',
    label: 'Microsoft Graph',
    icon: '📁',
    desc: 'Lecture OneDrive / SharePoint (trésorerie, etc.) via Azure AD.',
    couleur: '#0078d4',
    fields: [
      { key: 'MS_TENANT_ID',         label: 'Tenant ID',                                  required: true,  secret: false, placeholder: 'UUID Azure AD' },
      { key: 'MS_CLIENT_ID',         label: 'Client ID de l\'app Azure',                  required: true,  secret: false, placeholder: 'UUID' },
      { key: 'MS_CLIENT_SECRET',     label: 'Client Secret de l\'app Azure',              required: true,  secret: true  },
      { key: 'SHAREPOINT_HOSTNAME',  label: 'Hostname SharePoint',                        required: false, secret: false, placeholder: 'valorcia.sharepoint.com ou valorcia-my.sharepoint.com' },
      { key: 'SHAREPOINT_SITE_PATH', label: 'Chemin du site SharePoint',                  required: false, secret: false, placeholder: '/sites/Groupe ou /personal/loic_valorcia_com1' },
      { key: 'ONEDRIVE_USER',        label: 'Utilisateur OneDrive (mode perso)',          required: false, secret: false, placeholder: 'loic@valorcia.com' },
      { key: 'ONEDRIVE_FILE_PATH',   label: 'Chemin du fichier Excel',                    required: true,  secret: false, placeholder: '/Finance/Previsionnel.xlsx' },
      { key: 'TRESORERIE_SHEET',     label: 'Nom de la feuille',                          required: false, secret: false, placeholder: 'Prévisionnel TRESO' },
      { key: 'TRESORERIE_RANGE',     label: 'Plage de cellules',                          required: false, secret: false, placeholder: 'H4:AS97' },
    ],
    test: 'graph',
  },
  {
    id: 'outlook',
    label: 'Outlook (Microsoft 365)',
    icon: '📧',
    desc: 'Lecture mails / envoi via Microsoft Graph. Réutilise les credentials Azure ci-dessus (MS_TENANT_ID/CLIENT_ID/SECRET). Nécessite la permission Application "Mail.Read" (+ "Mail.Send" pour envoyer).',
    couleur: '#0078d4',
    fields: [
      { key: 'OUTLOOK_MAILBOX',      label: 'Boîte mail (UPN)',                           required: true,  secret: false, placeholder: 'loic@valorcia.com' },
      { key: 'OUTLOOK_FOLDER',       label: 'Dossier à lire',                             required: false, secret: false, placeholder: 'Inbox (par défaut)' },
      { key: 'OUTLOOK_SIGNATURE',    label: 'Signature mail (HTML)',                      required: false, secret: false, placeholder: '<p>Cordialement, Loïc</p>' },
    ],
    test: 'outlook',
  },
  {
    id: 'calendar',
    label: 'Outlook Calendar (Microsoft 365)',
    icon: '📅',
    desc: 'Lecture / création de RDV via Microsoft Graph. Réutilise les credentials Azure (MS_*). Nécessite la permission Application "Calendars.Read" (+ "Calendars.ReadWrite" pour créer).',
    couleur: '#7c3aed',
    fields: [
      { key: 'CALENDAR_MAILBOX',     label: 'Boîte du calendrier (UPN)',                  required: true,  secret: false, placeholder: 'loic@valorcia.com' },
      { key: 'CALENDAR_ID',          label: 'ID du calendrier (vide = principal)',         required: false, secret: false, placeholder: 'AAMkADk… ou laisser vide' },
      { key: 'CALENDAR_TZ',          label: 'Fuseau horaire',                              required: false, secret: false, placeholder: 'Europe/Paris (défaut)' },
    ],
    test: 'calendar',
  },
  {
    id: 'sites',
    label: 'Sites & présence web (3 sociétés)',
    icon: '🌐',
    desc: 'Toutes les URLs publiques des 3 sociétés : site web, Facebook, Instagram, GMB. Utilisées par les agents (prospection, marketing, SEO).',
    couleur: '#0ea5e9',
    fields: [
      // 123SPA
      { key: 'SITE_WEB_SPA',     label: 'Site web 123SPA 🇫🇷',         required: false, secret: false, societe: 'spa',      placeholder: 'https://123spa.fr' },
      { key: 'FB_PAGE_SPA',      label: 'Page Facebook 123SPA 🇫🇷',    required: false, secret: false, societe: 'spa',      placeholder: 'https://www.facebook.com/123spa' },
      { key: 'IG_URL_SPA',       label: 'Instagram 123SPA 🇫🇷',        required: false, secret: false, societe: 'spa',      placeholder: 'https://instagram.com/123spa' },
      { key: 'GMB_URL_SPA',      label: 'Fiche Google 123SPA 🇫🇷',     required: false, secret: false, societe: 'spa',      placeholder: 'https://g.page/123spa' },
      // Luca
      { key: 'SITE_WEB_LUCA',    label: 'Site web Luca 🇧🇪',           required: false, secret: false, societe: 'luca',     placeholder: 'https://luca-creation.be' },
      { key: 'FB_PAGE_LUCA',     label: 'Page Facebook Luca 🇧🇪',      required: false, secret: false, societe: 'luca',     placeholder: 'https://www.facebook.com/lucacreation' },
      { key: 'IG_URL_LUCA',      label: 'Instagram Luca 🇧🇪',          required: false, secret: false, societe: 'luca',     placeholder: 'https://instagram.com/luca_creation' },
      { key: 'GMB_URL_LUCA',     label: 'Fiche Google Luca 🇧🇪',       required: false, secret: false, societe: 'luca',     placeholder: 'https://g.page/luca' },
      // Valorcia
      { key: 'SITE_WEB_VALORCIA',label: 'Site web Valorcia 🇱🇺',       required: false, secret: false, societe: 'valorcia', placeholder: 'https://valorcia.com' },
      { key: 'FB_PAGE_VALORCIA', label: 'Page Facebook Valorcia 🇱🇺',  required: false, secret: false, societe: 'valorcia', placeholder: 'https://www.facebook.com/valorcia' },
      { key: 'IG_URL_VALORCIA',  label: 'Instagram Valorcia 🇱🇺',      required: false, secret: false, societe: 'valorcia', placeholder: 'https://instagram.com/valorcia' },
      { key: 'GMB_URL_VALORCIA', label: 'Fiche Google Valorcia 🇱🇺',   required: false, secret: false, societe: 'valorcia', placeholder: 'https://g.page/valorcia' },
    ],
    test: null,
  },
  {
    id: 'gads',
    label: 'Google Ads (3 comptes)',
    icon: '🟦',
    desc: 'Suivi campagnes payantes Google par société. Si chaque société a un compte Google différent, renseigne le refresh token spécifique. Sinon le token global est utilisé.',
    couleur: '#4285F4',
    fields: [
      // Credentials globaux (un seul OAuth pour tout)
      { key: 'GADS_DEVELOPER_TOKEN',           label: 'Developer Token (Google Ads API)',                                       required: true,  secret: true,  societe: 'all' },
      { key: 'GADS_CLIENT_ID',                 label: 'OAuth Client ID (global)',                                               required: true,  secret: false, societe: 'all' },
      { key: 'GADS_CLIENT_SECRET',             label: 'OAuth Client Secret (global)',                                           required: true,  secret: true,  societe: 'all' },
      { key: 'GADS_REFRESH_TOKEN',             label: 'Refresh Token global (utilisé si pas d\'override par société)',          required: false, secret: true,  societe: 'all' },
      // 123SPA
      { key: 'GADS_CUSTOMER_SPA',              label: 'Customer ID 123SPA',                                                     required: false, secret: false, societe: 'spa',      placeholder: '123-456-7890' },
      { key: 'GADS_REFRESH_TOKEN_SPA',         label: 'Refresh Token spécifique 123SPA (si compte Google différent)',           required: false, secret: true,  societe: 'spa' },
      // Luca
      { key: 'GADS_CUSTOMER_LUCA',             label: 'Customer ID Luca',                                                       required: false, secret: false, societe: 'luca' },
      { key: 'GADS_REFRESH_TOKEN_LUCA',        label: 'Refresh Token spécifique Luca',                                          required: false, secret: true,  societe: 'luca' },
      // Valorcia
      { key: 'GADS_CUSTOMER_VALORCIA',         label: 'Customer ID Valorcia',                                                   required: false, secret: false, societe: 'valorcia' },
      { key: 'GADS_REFRESH_TOKEN_VALORCIA',    label: 'Refresh Token spécifique Valorcia',                                      required: false, secret: true,  societe: 'valorcia' },
    ],
    test: 'gads',
  },
  {
    id: 'gsc',
    label: 'Google Search Console (3 sites)',
    icon: '🔍',
    desc: 'SEO : clics, impressions, CTR, positions moyennes — un site par société.',
    couleur: '#34A853',
    fields: [
      { key: 'GSC_CLIENT_ID',                  label: 'OAuth Client ID (global)',                                               required: true,  secret: false, societe: 'all' },
      { key: 'GSC_CLIENT_SECRET',              label: 'OAuth Client Secret (global)',                                           required: true,  secret: true,  societe: 'all' },
      { key: 'GSC_REFRESH_TOKEN',              label: 'Refresh Token global',                                                   required: false, secret: true,  societe: 'all' },
      { key: 'GSC_SITE_SPA',                   label: 'URL site 123SPA (sc-domain:... ou https://...)',                         required: false, secret: false, societe: 'spa',      placeholder: 'sc-domain:123spa.fr' },
      { key: 'GSC_REFRESH_TOKEN_SPA',          label: 'Refresh Token spécifique 123SPA',                                        required: false, secret: true,  societe: 'spa' },
      { key: 'GSC_SITE_LUCA',                  label: 'URL site Luca',                                                          required: false, secret: false, societe: 'luca',     placeholder: 'sc-domain:luca-creation.be' },
      { key: 'GSC_REFRESH_TOKEN_LUCA',         label: 'Refresh Token spécifique Luca',                                          required: false, secret: true,  societe: 'luca' },
      { key: 'GSC_SITE_VALORCIA',              label: 'URL site Valorcia',                                                      required: false, secret: false, societe: 'valorcia', placeholder: 'sc-domain:valorcia.com' },
      { key: 'GSC_REFRESH_TOKEN_VALORCIA',     label: 'Refresh Token spécifique Valorcia',                                      required: false, secret: true,  societe: 'valorcia' },
    ],
    test: 'gsc',
  },
  {
    id: 'ga4',
    label: 'Google Analytics 4 (3 propriétés)',
    icon: '📊',
    desc: 'Sessions, utilisateurs, conversions par site. Service Account JSON partagé entre les 3 propriétés OU un par société.',
    couleur: '#F9AB00',
    fields: [
      { key: 'GA4_SERVICE_ACCOUNT_JSON',       label: 'Service Account JSON global (donne accès aux 3 propriétés)',             required: false, secret: true,  societe: 'all', placeholder: '{ "type": "service_account", ... }' },
      { key: 'GA4_PROPERTY_SPA',               label: 'Property ID 123SPA',                                                     required: false, secret: false, societe: 'spa',      placeholder: '123456789' },
      { key: 'GA4_SERVICE_ACCOUNT_JSON_SPA',   label: 'Service Account JSON spécifique 123SPA',                                 required: false, secret: true,  societe: 'spa' },
      { key: 'GA4_PROPERTY_LUCA',              label: 'Property ID Luca',                                                       required: false, secret: false, societe: 'luca' },
      { key: 'GA4_SERVICE_ACCOUNT_JSON_LUCA',  label: 'Service Account JSON spécifique Luca',                                   required: false, secret: true,  societe: 'luca' },
      { key: 'GA4_PROPERTY_VALORCIA',          label: 'Property ID Valorcia',                                                   required: false, secret: false, societe: 'valorcia' },
      { key: 'GA4_SERVICE_ACCOUNT_JSON_VALORCIA',label: 'Service Account JSON spécifique Valorcia',                             required: false, secret: true,  societe: 'valorcia' },
    ],
    test: 'ga4',
  },
  {
    id: 'meta',
    label: 'Meta Ads (3 comptes pub)',
    icon: '🟦',
    desc: 'Campagnes Meta Business Manager. Si chaque société a un BM différent, renseigne un access token par société.',
    couleur: '#1877F2',
    fields: [
      { key: 'META_APP_ID',                    label: 'App ID Meta (Business)',                                                 required: true,  secret: false, societe: 'all' },
      { key: 'META_APP_SECRET',                label: 'App Secret Meta',                                                        required: true,  secret: true,  societe: 'all' },
      { key: 'META_ACCESS_TOKEN',              label: 'Long-lived Access Token global',                                         required: false, secret: true,  societe: 'all' },
      { key: 'META_AD_ACCOUNT_SPA',            label: 'Ad Account ID 123SPA',                                                   required: false, secret: false, societe: 'spa',      placeholder: 'act_1234567890' },
      { key: 'META_ACCESS_TOKEN_SPA',          label: 'Access Token spécifique 123SPA',                                         required: false, secret: true,  societe: 'spa' },
      { key: 'META_AD_ACCOUNT_LUCA',           label: 'Ad Account ID Luca',                                                     required: false, secret: false, societe: 'luca' },
      { key: 'META_ACCESS_TOKEN_LUCA',         label: 'Access Token spécifique Luca',                                           required: false, secret: true,  societe: 'luca' },
      { key: 'META_AD_ACCOUNT_VALORCIA',       label: 'Ad Account ID Valorcia',                                                 required: false, secret: false, societe: 'valorcia' },
      { key: 'META_ACCESS_TOKEN_VALORCIA',     label: 'Access Token spécifique Valorcia',                                       required: false, secret: true,  societe: 'valorcia' },
    ],
    test: 'meta',
  },
  {
    id: 'instagram',
    label: 'Instagram Business (3 comptes)',
    icon: '🟪',
    desc: 'Stats Instagram pro : followers, reach, engagement, top posts. Un compte Business par société.',
    couleur: '#E1306C',
    fields: [
      { key: 'IG_ACCESS_TOKEN',                label: 'Access Token Meta global (multi-compte)',                                required: false, secret: true,  societe: 'all' },
      { key: 'IG_BUSINESS_SPA',                label: 'Business Account ID 123SPA',                                             required: false, secret: false, societe: 'spa' },
      { key: 'IG_ACCESS_TOKEN_SPA',            label: 'Access Token spécifique 123SPA',                                         required: false, secret: true,  societe: 'spa' },
      { key: 'IG_BUSINESS_LUCA',               label: 'Business Account ID Luca',                                               required: false, secret: false, societe: 'luca' },
      { key: 'IG_ACCESS_TOKEN_LUCA',           label: 'Access Token spécifique Luca',                                           required: false, secret: true,  societe: 'luca' },
      { key: 'IG_BUSINESS_VALORCIA',           label: 'Business Account ID Valorcia',                                           required: false, secret: false, societe: 'valorcia' },
      { key: 'IG_ACCESS_TOKEN_VALORCIA',       label: 'Access Token spécifique Valorcia',                                       required: false, secret: true,  societe: 'valorcia' },
    ],
    test: 'instagram',
  },
  {
    id: 'gmb',
    label: 'Google My Business (3 fiches)',
    icon: '🟩',
    desc: 'Fiches Google par société : vues, avis, actions (appels, itinéraires), note. Une fiche par société.',
    couleur: '#34A853',
    fields: [
      { key: 'GMB_CLIENT_ID',                  label: 'OAuth Client ID (global)',                                               required: true,  secret: false, societe: 'all' },
      { key: 'GMB_CLIENT_SECRET',              label: 'OAuth Client Secret (global)',                                           required: true,  secret: true,  societe: 'all' },
      { key: 'GMB_REFRESH_TOKEN',              label: 'Refresh Token global',                                                   required: false, secret: true,  societe: 'all' },
      { key: 'GMB_LOCATION_SPA',               label: 'Location ID 123SPA',                                                     required: false, secret: false, societe: 'spa',      placeholder: 'accounts/X/locations/Y' },
      { key: 'GMB_REFRESH_TOKEN_SPA',          label: 'Refresh Token spécifique 123SPA',                                        required: false, secret: true,  societe: 'spa' },
      { key: 'GMB_LOCATION_LUCA',              label: 'Location ID Luca',                                                       required: false, secret: false, societe: 'luca' },
      { key: 'GMB_REFRESH_TOKEN_LUCA',         label: 'Refresh Token spécifique Luca',                                          required: false, secret: true,  societe: 'luca' },
      { key: 'GMB_LOCATION_VALORCIA',          label: 'Location ID Valorcia',                                                   required: false, secret: false, societe: 'valorcia' },
      { key: 'GMB_REFRESH_TOKEN_VALORCIA',     label: 'Refresh Token spécifique Valorcia',                                      required: false, secret: true,  societe: 'valorcia' },
    ],
    test: 'gmb',
  },
  {
    id: 'planneo',
    label: 'Planneo',
    icon: '🟧',
    desc: 'Planning chantiers, équipes, heures, retards, SAV.',
    couleur: '#E67E22',
    fields: [
      { key: 'PLANNEO_URL',           label: 'URL Planneo',                       required: true,  secret: false, placeholder: 'https://app.valorcia.com/pv9' },
      { key: 'PLANNEO_API_KEY',       label: 'API Key Planneo',                   required: true,  secret: true  },
      { key: 'PLANNEO_WORKSPACE',     label: 'Workspace / instance',              required: false, secret: false, placeholder: 'valorcia' },
    ],
    test: 'planneo',
  },
  {
    id: 'cibles',
    label: 'Cibles KPI éditables',
    icon: '🎯',
    desc: 'Objectifs mensuels à atteindre par société et au global. Modifiables ici, lus par la page KPI Groupe.',
    couleur: '#8E44AD',
    fields: [
      { key: 'CIBLE_CA_TOTAL',        label: 'CA Total Groupe (€/mois)',          required: false, secret: false, placeholder: '250000' },
      { key: 'CIBLE_CA_SPA',          label: 'CA 123SPA 🇫🇷 (€/mois)',           required: false, secret: false, placeholder: '85000' },
      { key: 'CIBLE_CA_LUCA',         label: 'CA Luca 🇧🇪 (€/mois)',              required: false, secret: false, placeholder: '120000' },
      { key: 'CIBLE_CA_VALORCIA',     label: 'CA Valorcia 🇱🇺 (€/mois)',          required: false, secret: false, placeholder: '60000' },
      { key: 'CIBLE_CROISSANCE_MOM',  label: 'Croissance MoM (% ex 8)',           required: false, secret: false, placeholder: '8' },
      { key: 'CIBLE_MARGE_BRUTE',     label: 'Marge brute (% ex 55)',             required: false, secret: false, placeholder: '55' },
      { key: 'CIBLE_REX',             label: 'REX mensuel (€)',                   required: false, secret: false, placeholder: '50000' },
      { key: 'CIBLE_MASSE_SALARIALE', label: 'Masse salariale max (€/mois)',      required: false, secret: false, placeholder: '35000' },
      { key: 'CIBLE_PISCINES_MOIS',   label: 'Piscines livrées / mois',           required: false, secret: false, placeholder: '2.5' },
      { key: 'CIBLE_SPAS',            label: 'Spas installés / mois',             required: false, secret: false, placeholder: '5' },
      { key: 'CIBLE_OCCUPATION',      label: 'Taux occupation (% ex 80)',         required: false, secret: false, placeholder: '80' },
      { key: 'CIBLE_RESPECT_DELAIS',  label: 'Respect délais (% ex 90)',          required: false, secret: false, placeholder: '90' },
      { key: 'CIBLE_EFFECTIF',        label: 'Effectif cible',                    required: false, secret: false, placeholder: '6' },
      { key: 'CIBLE_SOUS_TRAITANCE',  label: 'Sous-traitance max (% ex 30)',      required: false, secret: false, placeholder: '30' },
      { key: 'CIBLE_LEADS',           label: 'Leads / mois',                      required: false, secret: false, placeholder: '18' },
      { key: 'CIBLE_DEVIS',           label: 'Devis envoyés / mois',              required: false, secret: false, placeholder: '25' },
      { key: 'CIBLE_COMMANDES',       label: 'Commandes signées / mois',          required: false, secret: false, placeholder: '10' },
      { key: 'CIBLE_CONVERSION',      label: 'Taux conversion (% ex 40)',         required: false, secret: false, placeholder: '40' },
      { key: 'CIBLE_PIPELINE',        label: 'Pipeline commercial (€)',           required: false, secret: false, placeholder: '500000' },
    ],
    test: null,
  },
  {
    id: 'odoo',
    label: 'Odoo (CRM + Vente + Compta)',
    icon: '🟣',
    desc: 'Connexion XML-RPC à Odoo via API key.',
    couleur: '#714b67',
    fields: [
      { key: 'ODOO_URL',             label: 'URL Odoo',                                   required: true,  secret: false, placeholder: 'https://valorcia.odoo.com' },
      { key: 'ODOO_DB',              label: 'Nom de la base',                             required: true,  secret: false, placeholder: 'valorcia' },
      { key: 'ODOO_USERNAME',        label: 'Utilisateur',                                required: true,  secret: false, placeholder: 'loic@valorcia.com' },
      { key: 'ODOO_API_KEY',         label: 'API Key',                                    required: true,  secret: true  },
    ],
    test: 'odoo',
  },
  {
    id: 'app',
    label: 'Application (auth + session)',
    icon: '🔐',
    desc: 'Protection par mot de passe et signature des sessions.',
    couleur: '#475569',
    fields: [
      { key: 'APP_PASSWORD',         label: 'Mot de passe d\'accès',                      required: false, secret: true  },
      { key: 'APP_SESSION_SECRET',   label: 'Secret HMAC session (≥ 32 chars)',           required: false, secret: true  },
    ],
    test: null,
  },
];

// Récupère un objet "schema-only" sans valeurs, sûr à exposer côté client.
export function getConnectorsSchema() {
  return CONNECTORS.map(c => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    desc: c.desc,
    couleur: c.couleur,
    test: c.test,
    fields: c.fields.map(({ key, label, required, secret, placeholder, societe }) => ({
      key, label, required, secret, placeholder: placeholder || '', societe: societe || 'all',
    })),
  }));
}

// Liste toutes les clés gérées par les connecteurs (= keys autorisées).
export function allConnectorKeys() {
  return CONNECTORS.flatMap(c => c.fields.map(f => ({ key: f.key, secret: f.secret })));
}

// Lit la valeur effective d'une clé : KV en priorité, puis process.env.
let cachedKv = null;
let cachedAt = 0;
const CACHE_MS = 5_000;

async function getKvSnapshot() {
  if (!isStoreReady()) return {};
  const now = Date.now();
  if (cachedKv && now - cachedAt < CACHE_MS) return cachedKv;
  try {
    cachedKv = await readAll();
    cachedAt = now;
    return cachedKv;
  } catch {
    return {};
  }
}

// Helper pratique pour les routes API : lit une clé avec fallback env.
export async function getConfigValue(key) {
  const kv = await getKvSnapshot();
  if (kv[key] !== undefined && kv[key] !== null && kv[key] !== '') return kv[key];
  return process.env[key];
}

// Variante synchrone pure-env (pour endpoints qui ne peuvent pas attendre KV).
export function getEnvValue(key) {
  return process.env[key];
}

// Status global du store pour l'UI.
export function getStoreStatus() {
  return { ready: isStoreReady(), ...storeStatus() };
}

// Vue "merged" pour l'UI : pour chaque clé, indique source (kv | env | absent) et valeur masquée.
export async function readAllMergedMasked() {
  const kvMasked = isStoreReady() ? await readAllMasked() : {};
  const out = {};
  for (const { key, secret } of allConnectorKeys()) {
    const inKv = kvMasked[key];
    const envVal = process.env[key];
    if (inKv && inKv.defined) {
      out[key] = { source: 'kv', defined: true, secret, preview: inKv.preview, value: inKv.value };
    } else if (envVal !== undefined && envVal !== '') {
      if (secret) {
        out[key] = { source: 'env', defined: true, secret: true, preview: '••••••••' };
      } else {
        out[key] = { source: 'env', defined: true, secret: false, value: envVal.length > 80 ? `${envVal.slice(0, 77)}…` : envVal };
      }
    } else {
      out[key] = { source: null, defined: false, secret };
    }
  }
  return out;
}
