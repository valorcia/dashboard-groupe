// Schéma des connecteurs disponibles + helper pour lire la config effective
// (KV chiffré → fallback sur les env vars Vercel).

import { readAll, readAllMasked, isStoreReady, storeStatus } from './configStore';

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
    id: 'gads',
    label: 'Google Ads',
    icon: '🟦',
    desc: 'Suivi des campagnes payantes Google (CPC, conversions, ROAS) par société.',
    couleur: '#4285F4',
    fields: [
      { key: 'GADS_DEVELOPER_TOKEN',  label: 'Developer Token',                  required: true,  secret: true  },
      { key: 'GADS_CLIENT_ID',        label: 'OAuth Client ID',                  required: true,  secret: false },
      { key: 'GADS_CLIENT_SECRET',    label: 'OAuth Client Secret',              required: true,  secret: true  },
      { key: 'GADS_REFRESH_TOKEN',    label: 'Refresh Token (utilisateur)',      required: true,  secret: true  },
      { key: 'GADS_CUSTOMER_SPA',     label: 'Customer ID 123SPA 🇫🇷',          required: false, secret: false, placeholder: '123-456-7890' },
      { key: 'GADS_CUSTOMER_LUCA',    label: 'Customer ID Luca 🇧🇪',             required: false, secret: false },
      { key: 'GADS_CUSTOMER_VALORCIA',label: 'Customer ID Valorcia 🇱🇺',         required: false, secret: false },
    ],
    test: 'gads',
  },
  {
    id: 'gsc',
    label: 'Google Search Console',
    icon: '🔍',
    desc: 'SEO : clics, impressions, CTR, positions moyennes par site.',
    couleur: '#34A853',
    fields: [
      { key: 'GSC_CLIENT_ID',         label: 'OAuth Client ID',                  required: true,  secret: false },
      { key: 'GSC_CLIENT_SECRET',     label: 'OAuth Client Secret',              required: true,  secret: true  },
      { key: 'GSC_REFRESH_TOKEN',     label: 'Refresh Token',                    required: true,  secret: true  },
      { key: 'GSC_SITE_SPA',          label: 'URL site 123SPA 🇫🇷',             required: false, secret: false, placeholder: 'sc-domain:123spa.fr' },
      { key: 'GSC_SITE_LUCA',         label: 'URL site Luca 🇧🇪',                required: false, secret: false },
      { key: 'GSC_SITE_VALORCIA',     label: 'URL site Valorcia 🇱🇺',            required: false, secret: false },
    ],
    test: 'gsc',
  },
  {
    id: 'ga4',
    label: 'Google Analytics 4',
    icon: '📊',
    desc: 'Sessions, utilisateurs, conversions, tunnels d\'acquisition.',
    couleur: '#F9AB00',
    fields: [
      { key: 'GA4_SERVICE_ACCOUNT_JSON', label: 'Service Account JSON',          required: true,  secret: true, placeholder: '{ "type": "service_account", ... }' },
      { key: 'GA4_PROPERTY_SPA',         label: 'Property ID 123SPA',            required: false, secret: false, placeholder: '123456789' },
      { key: 'GA4_PROPERTY_LUCA',        label: 'Property ID Luca',              required: false, secret: false },
      { key: 'GA4_PROPERTY_VALORCIA',    label: 'Property ID Valorcia',          required: false, secret: false },
    ],
    test: 'ga4',
  },
  {
    id: 'meta',
    label: 'Meta Ads (Facebook + Instagram)',
    icon: '🟦',
    desc: 'Campagnes Meta Business (dépense, ROAS, CPA, impressions).',
    couleur: '#1877F2',
    fields: [
      { key: 'META_APP_ID',           label: 'App ID',                           required: true,  secret: false },
      { key: 'META_APP_SECRET',       label: 'App Secret',                       required: true,  secret: true  },
      { key: 'META_ACCESS_TOKEN',     label: 'Long-lived Access Token',          required: true,  secret: true  },
      { key: 'META_AD_ACCOUNT_SPA',   label: 'Ad Account ID 123SPA',             required: false, secret: false, placeholder: 'act_1234567890' },
      { key: 'META_AD_ACCOUNT_LUCA',  label: 'Ad Account ID Luca',               required: false, secret: false },
      { key: 'META_AD_ACCOUNT_VALORCIA',label: 'Ad Account ID Valorcia',         required: false, secret: false },
    ],
    test: 'meta',
  },
  {
    id: 'instagram',
    label: 'Instagram Business',
    icon: '🟪',
    desc: 'Stats Instagram pro : followers, reach, engagement, top posts.',
    couleur: '#E1306C',
    fields: [
      { key: 'IG_ACCESS_TOKEN',       label: 'Access Token (Meta App)',          required: true,  secret: true  },
      { key: 'IG_BUSINESS_SPA',       label: 'Business Account ID 123SPA',       required: false, secret: false },
      { key: 'IG_BUSINESS_LUCA',      label: 'Business Account ID Luca',         required: false, secret: false },
      { key: 'IG_BUSINESS_VALORCIA',  label: 'Business Account ID Valorcia',     required: false, secret: false },
    ],
    test: 'instagram',
  },
  {
    id: 'gmb',
    label: 'Google My Business',
    icon: '🟩',
    desc: 'Fiches Google : vues, avis, actions (appels, itinéraires), note.',
    couleur: '#34A853',
    fields: [
      { key: 'GMB_CLIENT_ID',         label: 'OAuth Client ID',                  required: true,  secret: false },
      { key: 'GMB_CLIENT_SECRET',     label: 'OAuth Client Secret',              required: true,  secret: true  },
      { key: 'GMB_REFRESH_TOKEN',     label: 'Refresh Token',                    required: true,  secret: true  },
      { key: 'GMB_LOCATION_SPA',      label: 'Location ID 123SPA',               required: false, secret: false, placeholder: 'accounts/X/locations/Y' },
      { key: 'GMB_LOCATION_LUCA',     label: 'Location ID Luca',                 required: false, secret: false },
      { key: 'GMB_LOCATION_VALORCIA', label: 'Location ID Valorcia',             required: false, secret: false },
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
    fields: c.fields.map(({ key, label, required, secret, placeholder }) => ({
      key, label, required, secret, placeholder: placeholder || '',
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
