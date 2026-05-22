// Endpoint trésorerie hebdomadaire — lecture du fichier "Prévisionnel TRESO"
// sur SharePoint ou OneDrive personnel, via Microsoft Graph (client_credentials).
//
// Structure attendue du fichier (sheet par défaut "Prévisionnel TRESO") :
//   - Ligne 4  : numéros de semaines (S43 … S28) en H:AS
//   - Ligne 36 : total sorties hebdo
//   - Ligne 91 : total entrées TTC hebdo
//   - Ligne 95 : différence (entrées − sorties)
//   - Ligne 97 : trésorerie cumulée fin de semaine
//
// Variables d'env requises côté Vercel :
//   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET
//
//   Mode SharePoint (recommandé pour un fichier partagé) :
//     SHAREPOINT_HOSTNAME    — ex "valorcia.sharepoint.com"
//     SHAREPOINT_SITE_PATH   — ex "/sites/Groupe" (slash inclus)
//     ONEDRIVE_FILE_PATH     — chemin dans la bibliothèque Documents,
//                              ex "/Finance/Previsionnel_Tresorerie_TDB.xlsx"
//
//   Mode OneDrive perso (alternative) :
//     ONEDRIVE_USER          — ex "loic@valorcia.com"
//     ONEDRIVE_FILE_PATH     — chemin dans son OneDrive
//
//   Optionnels :
//     TRESORERIE_SHEET       — défaut "Prévisionnel TRESO"
//     TRESORERIE_RANGE       — défaut "H4:AS97"

import { getConfigValue } from '../../lib/connectors';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function getAccessToken() {
  const tenant = await getConfigValue('MS_TENANT_ID');
  const clientId = await getConfigValue('MS_CLIENT_ID');
  const secret = await getConfigValue('MS_CLIENT_SECRET');
  if (!tenant || !clientId || !secret) {
    throw new Error('Microsoft Graph non configuré (MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET manquants)');
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: secret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Auth Microsoft Graph échouée : HTTP ${res.status} — ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function graphGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Graph ${res.status} sur ${url.replace(GRAPH_BASE, '')} — ${txt.slice(0, 200)}`);
  }
  return res.json();
}

function encodePath(p) {
  const path = p.startsWith('/') ? p : `/${p}`;
  return path.split('/').map(encodeURIComponent).join('/');
}

// Résout l'URL de base du drive selon le mode (SharePoint ou OneDrive perso).
async function getDriveBaseUrl(token) {
  const spHost = await getConfigValue('SHAREPOINT_HOSTNAME');
  const spSite = await getConfigValue('SHAREPOINT_SITE_PATH');

  if (spHost && spSite) {
    const sitePath = spSite.startsWith('/') ? spSite : `/${spSite}`;
    const siteUrl = `${GRAPH_BASE}/sites/${encodeURIComponent(spHost)}:${sitePath}`;
    const site = await graphGet(siteUrl, token);
    if (!site.id) throw new Error(`Site SharePoint introuvable : ${spHost}${sitePath}`);
    return `${GRAPH_BASE}/sites/${site.id}/drive`;
  }

  const user = await getConfigValue('ONEDRIVE_USER');
  if (user) return `${GRAPH_BASE}/users/${encodeURIComponent(user)}/drive`;

  throw new Error('Configuration manquante : définir SHAREPOINT_HOSTNAME+SHAREPOINT_SITE_PATH ou ONEDRIVE_USER');
}

async function readExcelRange(token, driveBase, filePath, sheet, range) {
  const url = `${driveBase}/root:${encodePath(filePath)}:/workbook/worksheets('${encodeURIComponent(sheet)}')/range(address='${encodeURIComponent(range)}')`;
  return graphGet(url, token);
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}

export default async function handler(req, res) {
  const file = await getConfigValue('ONEDRIVE_FILE_PATH');
  const sheet = (await getConfigValue('TRESORERIE_SHEET')) || 'Prévisionnel TRESO';
  const range = (await getConfigValue('TRESORERIE_RANGE')) || 'H4:AS97';
  const isDiag = req.query.diag === '1';

  if (!file && !isDiag) {
    return res.status(501).json({
      ok: false,
      error: 'ONEDRIVE_FILE_PATH manquant',
    });
  }

  // Mode diagnostic : test progressif de chaque étape de l'auth Graph.
  if (isDiag) {
    const steps = [];
    const tenant = await getConfigValue('MS_TENANT_ID');
    const clientId = await getConfigValue('MS_CLIENT_ID');
    const secret = await getConfigValue('MS_CLIENT_SECRET');

    steps.push({
      step: '1. Variables d\'env',
      ok: !!(tenant && clientId && secret),
      detail: {
        MS_TENANT_ID: tenant ? `${tenant.slice(0, 8)}…${tenant.slice(-4)}` : 'MANQUANT',
        MS_CLIENT_ID: clientId ? `${clientId.slice(0, 8)}…${clientId.slice(-4)}` : 'MANQUANT',
        MS_CLIENT_SECRET: secret ? `(${secret.length} chars)` : 'MANQUANT',
        SHAREPOINT_HOSTNAME: (await getConfigValue('SHAREPOINT_HOSTNAME')) || '(non défini)',
        SHAREPOINT_SITE_PATH: (await getConfigValue('SHAREPOINT_SITE_PATH')) || '(non défini)',
        ONEDRIVE_USER: (await getConfigValue('ONEDRIVE_USER')) || '(non défini)',
        ONEDRIVE_FILE_PATH: file || '(non défini)',
      },
    });

    let token = null;
    try {
      token = await getAccessToken();
      const parts = token.split('.');
      let claims = null;
      if (parts.length === 3) {
        try {
          const payload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
          claims = JSON.parse(payload);
        } catch {}
      }
      steps.push({
        step: '2. Token Graph (client_credentials)',
        ok: true,
        detail: {
          aud: claims?.aud,
          tid: claims?.tid,
          appid: claims?.appid,
          roles: claims?.roles,
          exp: claims?.exp ? new Date(claims.exp * 1000).toISOString() : null,
        },
      });
    } catch (e) {
      steps.push({ step: '2. Token Graph', ok: false, error: e.message });
      return res.status(200).json({ ok: false, mode: 'diagnostic', steps });
    }

    try {
      const org = await graphGet(`${GRAPH_BASE}/organization`, token);
      steps.push({
        step: '3. /organization (vérifie tenant)',
        ok: true,
        detail: {
          tenant: org.value?.[0]?.displayName,
          tenantId: org.value?.[0]?.id,
          verifiedDomains: org.value?.[0]?.verifiedDomains?.map(d => d.name),
        },
      });
    } catch (e) {
      steps.push({ step: '3. /organization', ok: false, error: e.message });
    }

    const spHostDiag = await getConfigValue('SHAREPOINT_HOSTNAME');
    const spSiteDiag = await getConfigValue('SHAREPOINT_SITE_PATH');
    const odUserDiag = await getConfigValue('ONEDRIVE_USER');
    if (spHostDiag && spSiteDiag) {
      const sitePath = spSiteDiag.startsWith('/') ? spSiteDiag : `/${spSiteDiag}`;
      try {
        const site = await graphGet(`${GRAPH_BASE}/sites/${encodeURIComponent(spHostDiag)}:${sitePath}`, token);
        steps.push({ step: '4. Résolution site SharePoint', ok: true, detail: { id: site.id, name: site.displayName, webUrl: site.webUrl } });
      } catch (e) {
        steps.push({ step: '4. Résolution site SharePoint', ok: false, error: e.message });
      }
    } else if (odUserDiag) {
      try {
        const user = await graphGet(`${GRAPH_BASE}/users/${encodeURIComponent(odUserDiag)}`, token);
        steps.push({ step: '4. Résolution utilisateur', ok: true, detail: { id: user.id, upn: user.userPrincipalName, mail: user.mail } });
      } catch (e) {
        steps.push({ step: '4. Résolution utilisateur', ok: false, error: e.message });
      }
    }

    return res.status(200).json({ ok: steps.every(s => s.ok), mode: 'diagnostic', steps });
  }

  try {
    const token = await getAccessToken();
    const driveBase = await getDriveBaseUrl(token);
    const data = await readExcelRange(token, driveBase, file, sheet, range);
    const values = data.values || [];

    const rowSemaines = values[0] || [];
    const rowSorties = values[32] || [];
    const rowEntrees = values[87] || [];
    const rowDiff = values[91] || [];
    const rowCumul = values[93] || [];

    const semaines = [];
    for (let i = 0; i < rowSemaines.length; i++) {
      const sem = rowSemaines[i];
      if (!sem) continue;
      semaines.push({
        semaine: String(sem),
        label: '',
        entrees: toNum(rowEntrees[i]),
        sorties: toNum(rowSorties[i]),
        difference: toNum(rowDiff[i]),
        cumul: toNum(rowCumul[i]),
      });
    }

    return res.status(200).json({
      ok: true,
      source_fichier: file.split('/').pop(),
      onedrive_path: file,
      mode: (await getConfigValue('SHAREPOINT_HOSTNAME')) ? 'sharepoint' : 'onedrive',
      derniere_maj: new Date().toISOString().slice(0, 16).replace('T', ' '),
      semaines,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erreur OneDrive' });
  }
}
