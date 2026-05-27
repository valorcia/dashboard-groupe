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

async function testCalendar() {
  const steps = [];
  const tenant = await getConfigValue('MS_TENANT_ID');
  const clientId = await getConfigValue('MS_CLIENT_ID');
  const secret = await getConfigValue('MS_CLIENT_SECRET');
  const mailbox = await getConfigValue('CALENDAR_MAILBOX');
  const calId = await getConfigValue('CALENDAR_ID');
  const tz = (await getConfigValue('CALENDAR_TZ')) || 'Europe/Paris';

  steps.push({
    step: 'Variables présentes',
    ok: !!(tenant && clientId && secret && mailbox),
    detail: { mailbox: mailbox || 'manquant', calId: calId || '(calendrier principal)', tz },
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
    steps.push({ step: 'Token Azure AD', ok: true, detail: { roles: claims.roles } });
    const hasCal = claims.roles?.some(r => r.startsWith('Calendars.'));
    steps.push({ step: 'Permission Calendars.* dans le token', ok: !!hasCal, error: hasCal ? null : 'Aucun rôle Calendars.* trouvé. Ajouter "Calendars.Read" en Application permission + admin consent.' });
    if (!hasCal) return steps;
  } catch (e) {
    steps.push({ step: 'Token Azure AD', ok: false, error: e.message });
    return steps;
  }

  try {
    const nowIso = new Date().toISOString();
    const endIso = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const calPath = calId ? `/calendars/${encodeURIComponent(calId)}` : '';
    const u = `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}${calPath}/calendarView?startDateTime=${nowIso}&endDateTime=${endIso}&$top=5&$select=subject,start,end,organizer,location`;
    const r = await fetch(u, { headers: { Authorization: `Bearer ${token}`, Prefer: `outlook.timezone="${tz}"` } });
    if (!r.ok) {
      const txt = await r.text();
      steps.push({ step: 'Accès calendrier (7j à venir)', ok: false, error: `HTTP ${r.status} — ${txt.slice(0, 240)}` });
      return steps;
    }
    const j = await r.json();
    steps.push({
      step: 'Accès calendrier (7j à venir)',
      ok: true,
      detail: {
        count: j.value?.length || 0,
        rdv: j.value?.map(e => ({ subject: e.subject?.slice(0, 60), start: e.start?.dateTime, organizer: e.organizer?.emailAddress?.address, location: e.location?.displayName })),
      },
    });
  } catch (e) {
    steps.push({ step: 'Accès calendrier', ok: false, error: e.message });
  }
  return steps;
}

// Tests "stub" pour les connecteurs marketing/planneo : vérifient seulement
// la présence des credentials. L'implémentation OAuth complète (Google Ads,
// GA4, Meta, etc.) viendra quand les flows OAuth seront branchés.
async function testStubFields(prefix, required, optional = []) {
  const steps = [];
  const missing = [];
  const present = {};
  for (const k of required) {
    const v = await getConfigValue(k);
    if (!v) missing.push(k);
    else present[k] = v.length > 20 ? `${v.slice(0, 8)}…(${v.length} chars)` : v;
  }
  for (const k of optional) {
    const v = await getConfigValue(k);
    if (v) present[k] = v.length > 20 ? `${v.slice(0, 8)}…(${v.length} chars)` : v;
  }
  steps.push({
    step: 'Variables requises présentes',
    ok: missing.length === 0,
    detail: missing.length ? { manquantes: missing, présentes: present } : present,
    error: missing.length ? `Manquantes : ${missing.join(', ')}` : null,
  });
  steps.push({
    step: 'Appel API live',
    ok: false,
    error: `Flow OAuth non encore branché pour ${prefix}. Stub : credentials détectés mais la lecture live des stats sera ajoutée en phase 2.`,
  });
  return steps;
}

async function testGads()     { return testStubFields('Google Ads',     ['GADS_DEVELOPER_TOKEN', 'GADS_CLIENT_ID', 'GADS_CLIENT_SECRET', 'GADS_REFRESH_TOKEN'], ['GADS_CUSTOMER_SPA', 'GADS_CUSTOMER_LUCA', 'GADS_CUSTOMER_VALORCIA']); }
async function testGsc()      { return testStubFields('Search Console', ['GSC_CLIENT_ID', 'GSC_CLIENT_SECRET', 'GSC_REFRESH_TOKEN'], ['GSC_SITE_SPA', 'GSC_SITE_LUCA', 'GSC_SITE_VALORCIA']); }
async function testGa4()      { return testStubFields('Analytics 4',    ['GA4_SERVICE_ACCOUNT_JSON'], ['GA4_PROPERTY_SPA', 'GA4_PROPERTY_LUCA', 'GA4_PROPERTY_VALORCIA']); }
async function testMeta()     { return testStubFields('Meta Ads',       ['META_APP_ID', 'META_APP_SECRET', 'META_ACCESS_TOKEN'], ['META_AD_ACCOUNT_SPA', 'META_AD_ACCOUNT_LUCA', 'META_AD_ACCOUNT_VALORCIA']); }
async function testInstagram(){ return testStubFields('Instagram',      ['IG_ACCESS_TOKEN'], ['IG_BUSINESS_SPA', 'IG_BUSINESS_LUCA', 'IG_BUSINESS_VALORCIA']); }
async function testGmb()      { return testStubFields('My Business',    ['GMB_CLIENT_ID', 'GMB_CLIENT_SECRET', 'GMB_REFRESH_TOKEN'], ['GMB_LOCATION_SPA', 'GMB_LOCATION_LUCA', 'GMB_LOCATION_VALORCIA']); }

async function testPlanneo() {
  const steps = [];
  const urlRaw = await getConfigValue('PLANNEO_URL');
  const key = await getConfigValue('PLANNEO_API_KEY');
  steps.push({ step: 'Variables présentes', ok: !!(urlRaw && key), detail: { url: urlRaw, apiKey: key ? `(${key.length} chars)` : 'manquant' } });
  if (!urlRaw || !key) return steps;

  // Normalisation URL : tolère "https//" / "https:/foo" / trailing slash / espaces.
  let url = String(urlRaw).trim();
  url = url.replace(/^(https?)(?!:)/i, '$1:');     // "https//" → "https://"
  url = url.replace(/^(https?):(?!\/\/)/i, '$1://'); // "https:/" → "https://"
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    steps.push({ step: 'URL Planneo', ok: false, error: `URL invalide après normalisation : "${url}" — ${e.message}. Format attendu : https://app.valorcia.com/pv9` });
    return steps;
  }
  if (url !== urlRaw) {
    steps.push({ step: 'URL Planneo', ok: true, detail: { saisie: urlRaw, normalisée: parsed.toString().replace(/\/$/, '') } });
  }

  const base = parsed.toString().replace(/\/$/, '');

  // Helper qui extrait la vraie raison d'un échec fetch (undici/Node).
  const reasonOf = (e) => {
    const cause = e?.cause;
    const code = cause?.code || cause?.errno;
    const sub = cause?.message || cause?.toString?.();
    if (code === 'ENOTFOUND') return `DNS introuvable : "${parsed.hostname}" n'existe pas. Vérifier l'URL.`;
    if (code === 'ECONNREFUSED') return `Connexion refusée par ${parsed.hostname} (port fermé ?).`;
    if (code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT') return `Timeout sur ${parsed.hostname} — le serveur ne répond pas dans le délai.`;
    if (code === 'CERT_HAS_EXPIRED' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || sub?.includes('certificate')) return `Erreur SSL/TLS sur ${parsed.hostname} : ${sub || code}`;
    if (code === 'UND_ERR_SOCKET' || sub?.includes('socket')) return `Connexion socket interrompue par ${parsed.hostname} — typiquement un pare-feu / WAF qui bloque les requêtes serveur→serveur.`;
    return `${e.message || 'fetch failed'}${code ? ` (code ${code})` : ''}${sub ? ` — ${sub}` : ''}`;
  };

  // 1. Ping de l'URL de base — doit répondre (l'app est en ligne).
  try {
    const r = await fetch(base, { method: 'GET', redirect: 'follow' });
    if (r.ok || (r.status >= 300 && r.status < 400)) {
      steps.push({ step: 'URL Planneo accessible', ok: true, detail: { url: base, status: r.status, contentType: r.headers.get('content-type')?.slice(0, 60) } });
    } else {
      const body = await r.text().catch(() => '');
      steps.push({ step: 'URL Planneo accessible', ok: false, error: `HTTP ${r.status} sur ${base} — ${body.slice(0, 200)}` });
      return steps;
    }
  } catch (e) {
    steps.push({ step: 'URL Planneo accessible', ok: false, error: reasonOf(e), detail: { url: base } });
    return steps;
  }

  // 2. Sonde plusieurs endpoints API plausibles avec plusieurs schémas d'auth.
  // L'API publique de Planneo n'est pas documentée ici, donc on tente les
  // patterns courants et on rapporte le premier qui répond proprement.
  const endpoints = ['/api/health', '/api/ping', '/api/status', '/health', '/api/v1/health'];
  const authVariants = [
    { name: 'Bearer', headers: { Authorization: `Bearer ${key}` } },
    { name: 'X-API-Key', headers: { 'X-API-Key': key } },
    { name: 'API-Key', headers: { 'Api-Key': key } },
  ];
  let firstOk = null;
  const tried = [];
  for (const path of endpoints) {
    for (const av of authVariants) {
      try {
        const r = await fetch(`${base}${path}`, { headers: av.headers });
        tried.push({ path, auth: av.name, status: r.status });
        if (r.ok) { firstOk = { path, auth: av.name, status: r.status }; break; }
      } catch (e) {
        tried.push({ path, auth: av.name, error: e.message.slice(0, 60) });
      }
    }
    if (firstOk) break;
  }
  if (firstOk) {
    steps.push({ step: `Endpoint API trouvé : ${firstOk.path}`, ok: true, detail: firstOk });
  } else {
    steps.push({
      step: 'Endpoint API',
      ok: false,
      error: `Aucun endpoint testé n'a répondu 2xx. L'URL Planneo répond, mais l'API n'est pas exposée aux chemins habituels ou la clé n'a pas le bon format. Tentatives :`,
      detail: { tried: tried.slice(0, 15) },
    });
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
  else if (id === 'calendar') steps = await testCalendar();
  else if (id === 'odoo') steps = await testOdoo();
  else if (id === 'gads') steps = await testGads();
  else if (id === 'gsc') steps = await testGsc();
  else if (id === 'ga4') steps = await testGa4();
  else if (id === 'meta') steps = await testMeta();
  else if (id === 'instagram') steps = await testInstagram();
  else if (id === 'gmb') steps = await testGmb();
  else if (id === 'planneo') steps = await testPlanneo();
  else return res.status(400).json({ ok: false, error: 'id de connecteur inconnu' });

  return res.status(200).json({ ok: steps.every(s => s.ok), id, steps });
}
