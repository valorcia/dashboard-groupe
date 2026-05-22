// Test live d'un connecteur. POST { id: "graph" | "odoo" }.
// Renvoie un résultat structuré { ok, steps: [{ step, ok, detail|error }] }.

import { getConfigValue } from '../../../lib/connectors';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function graphGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} sur ${url.replace(GRAPH_BASE, '')} — ${txt.slice(0, 240)}`);
  }
  return res.json();
}

async function testGraph() {
  const steps = [];
  const tenant = await getConfigValue('MS_TENANT_ID');
  const clientId = await getConfigValue('MS_CLIENT_ID');
  const secret = await getConfigValue('MS_CLIENT_SECRET');

  steps.push({
    step: 'Variables présentes',
    ok: !!(tenant && clientId && secret),
    detail: { tenantId: tenant ? tenant.slice(0, 8) + '…' : 'manquant', clientId: clientId ? clientId.slice(0, 8) + '…' : 'manquant', secret: secret ? `(${secret.length} chars)` : 'manquant' },
  });
  if (!tenant || !clientId || !secret) return steps;

  let token;
  try {
    const body = new URLSearchParams({ client_id: clientId, client_secret: secret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' });
    const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    if (!r.ok) {
      const txt = await r.text();
      steps.push({ step: 'Token Azure AD', ok: false, error: `HTTP ${r.status} — ${txt.slice(0, 240)}` });
      return steps;
    }
    const j = await r.json();
    token = j.access_token;
    const claims = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    steps.push({ step: 'Token Azure AD', ok: true, detail: { aud: claims.aud, tid: claims.tid, appid: claims.appid, roles: claims.roles, exp: new Date(claims.exp * 1000).toISOString() } });
    if (!claims.roles || claims.roles.length === 0) {
      steps.push({ step: 'Rôles applicatifs', ok: false, error: 'Aucun rôle dans le token : l\'app n\'a pas de permissions Application granted. Vérifier Azure → API permissions → admin consent.' });
      return steps;
    }
    steps.push({ step: 'Rôles applicatifs', ok: true, detail: { roles: claims.roles } });
  } catch (e) {
    steps.push({ step: 'Token Azure AD', ok: false, error: e.message });
    return steps;
  }

  try {
    const org = await graphGet(`${GRAPH_BASE}/organization`, token);
    steps.push({ step: '/organization', ok: true, detail: { tenant: org.value?.[0]?.displayName, domains: org.value?.[0]?.verifiedDomains?.map(d => d.name) } });
  } catch (e) {
    steps.push({ step: '/organization', ok: false, error: e.message });
  }

  const spHost = await getConfigValue('SHAREPOINT_HOSTNAME');
  const spSite = await getConfigValue('SHAREPOINT_SITE_PATH');
  const odUser = await getConfigValue('ONEDRIVE_USER');
  const filePath = await getConfigValue('ONEDRIVE_FILE_PATH');

  let driveBase = null;
  if (spHost && spSite) {
    try {
      const sp = spSite.startsWith('/') ? spSite : `/${spSite}`;
      const site = await graphGet(`${GRAPH_BASE}/sites/${encodeURIComponent(spHost)}:${sp}`, token);
      steps.push({ step: 'Résolution site SharePoint', ok: true, detail: { id: site.id, displayName: site.displayName, webUrl: site.webUrl } });
      driveBase = `${GRAPH_BASE}/sites/${site.id}/drive`;
    } catch (e) {
      steps.push({ step: 'Résolution site SharePoint', ok: false, error: e.message });
    }
  } else if (odUser) {
    try {
      const u = await graphGet(`${GRAPH_BASE}/users/${encodeURIComponent(odUser)}`, token);
      steps.push({ step: 'Résolution utilisateur OneDrive', ok: true, detail: { id: u.id, upn: u.userPrincipalName } });
      driveBase = `${GRAPH_BASE}/users/${encodeURIComponent(odUser)}/drive`;
    } catch (e) {
      steps.push({ step: 'Résolution utilisateur OneDrive', ok: false, error: e.message });
    }
  } else {
    steps.push({ step: 'Mode de connexion', ok: false, error: 'Définir SHAREPOINT_HOSTNAME+SHAREPOINT_SITE_PATH OU ONEDRIVE_USER' });
  }

  if (driveBase && filePath) {
    try {
      const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const encoded = path.split('/').map(encodeURIComponent).join('/');
      const item = await graphGet(`${driveBase}/root:${encoded}`, token);
      steps.push({ step: 'Accès fichier', ok: true, detail: { name: item.name, size: item.size, lastModified: item.lastModifiedDateTime } });
    } catch (e) {
      steps.push({ step: 'Accès fichier', ok: false, error: e.message });
    }
  }

  return steps;
}

async function testOutlook() {
  const steps = [];
  const tenant = await getConfigValue('MS_TENANT_ID');
  const clientId = await getConfigValue('MS_CLIENT_ID');
  const secret = await getConfigValue('MS_CLIENT_SECRET');
  const mailbox = await getConfigValue('OUTLOOK_MAILBOX');
  const folder = (await getConfigValue('OUTLOOK_FOLDER')) || 'Inbox';

  steps.push({
    step: 'Variables présentes',
    ok: !!(tenant && clientId && secret && mailbox),
    detail: { tenantId: tenant ? tenant.slice(0, 8) + '…' : 'manquant', clientId: clientId ? clientId.slice(0, 8) + '…' : 'manquant', secret: secret ? `(${secret.length} chars)` : 'manquant', mailbox: mailbox || 'manquant', folder },
  });
  if (!tenant || !clientId || !secret || !mailbox) return steps;

  let token;
  try {
    const body = new URLSearchParams({ client_id: clientId, client_secret: secret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' });
    const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    if (!r.ok) {
      const txt = await r.text();
      steps.push({ step: 'Token Azure AD', ok: false, error: `HTTP ${r.status} — ${txt.slice(0, 240)}` });
      return steps;
    }
    const j = await r.json();
    token = j.access_token;
    const claims = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    steps.push({ step: 'Token Azure AD', ok: true, detail: { aud: claims.aud, tid: claims.tid, appid: claims.appid, roles: claims.roles } });
    const hasMail = claims.roles?.some(r => r.startsWith('Mail.'));
    steps.push({ step: 'Permission Mail.* dans le token', ok: !!hasMail, error: hasMail ? null : 'Aucun rôle Mail.* trouvé. Ajouter "Mail.Read" en Application permission + admin consent.' });
    if (!hasMail) return steps;
  } catch (e) {
    steps.push({ step: 'Token Azure AD', ok: false, error: e.message });
    return steps;
  }

  try {
    const folderEnc = encodeURIComponent(folder);
    const u = `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}/mailFolders/${folderEnc}/messages?$top=3&$select=subject,from,receivedDateTime`;
    const j = await graphGet(u, token);
    steps.push({ step: `Accès dossier "${folder}"`, ok: true, detail: { count: j.value?.length || 0, derniers: j.value?.map(m => ({ from: m.from?.emailAddress?.address, subject: m.subject?.slice(0, 60), date: m.receivedDateTime })) } });
  } catch (e) {
    steps.push({ step: `Accès dossier "${folder}"`, ok: false, error: e.message });
  }
  return steps;
}

async function testOdoo() {
  const steps = [];
  const url = await getConfigValue('ODOO_URL');
  const db = await getConfigValue('ODOO_DB');
  const user = await getConfigValue('ODOO_USERNAME');
  const key = await getConfigValue('ODOO_API_KEY');

  steps.push({ step: 'Variables présentes', ok: !!(url && db && user && key), detail: { url, db, user, apiKey: key ? `(${key.length} chars)` : 'manquant' } });
  if (!url || !db || !user || !key) return steps;

  try {
    const xml = `<?xml version="1.0"?><methodCall><methodName>authenticate</methodName><params><param><value><string>${db}</string></value></param><param><value><string>${user}</string></value></param><param><value><string>${key}</string></value></param><param><value><struct></struct></value></param></params></methodCall>`;
    const r = await fetch(`${url.replace(/\/$/, '')}/xmlrpc/2/common`, { method: 'POST', headers: { 'Content-Type': 'text/xml' }, body: xml });
    const txt = await r.text();
    if (!r.ok) {
      steps.push({ step: 'Auth Odoo XML-RPC', ok: false, error: `HTTP ${r.status} — ${txt.slice(0, 200)}` });
      return steps;
    }
    const m = txt.match(/<int>(\d+)<\/int>/);
    if (m && parseInt(m[1], 10) > 0) {
      steps.push({ step: 'Auth Odoo XML-RPC', ok: true, detail: { uid: parseInt(m[1], 10) } });
    } else {
      steps.push({ step: 'Auth Odoo XML-RPC', ok: false, error: `Authentification refusée — réponse : ${txt.slice(0, 200)}` });
    }
  } catch (e) {
    steps.push({ step: 'Auth Odoo XML-RPC', ok: false, error: e.message });
  }
  return steps;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'POST attendu' });
  }
  const id = req.body?.id;
  let steps;
  if (id === 'graph') steps = await testGraph();
  else if (id === 'outlook') steps = await testOutlook();
  else if (id === 'odoo') steps = await testOdoo();
  else return res.status(400).json({ ok: false, error: 'id attendu : "graph", "outlook" ou "odoo"' });

  return res.status(200).json({ ok: steps.every(s => s.ok), id, steps });
}
