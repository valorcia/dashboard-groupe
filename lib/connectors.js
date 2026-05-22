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
