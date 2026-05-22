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

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function getAccessToken() {
  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const secret = process.env.MS_CLIENT_SECRET;
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
  const spHost = process.env.SHAREPOINT_HOSTNAME;
  const spSite = process.env.SHAREPOINT_SITE_PATH;

  if (spHost && spSite) {
    // Mode SharePoint : on résout d'abord le site-id.
    const sitePath = spSite.startsWith('/') ? spSite : `/${spSite}`;
    const siteUrl = `${GRAPH_BASE}/sites/${encodeURIComponent(spHost)}:${sitePath}`;
    const site = await graphGet(siteUrl, token);
    if (!site.id) throw new Error(`Site SharePoint introuvable : ${spHost}${sitePath}`);
    return `${GRAPH_BASE}/sites/${site.id}/drive`;
  }

  const user = process.env.ONEDRIVE_USER;
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
  const file = process.env.ONEDRIVE_FILE_PATH;
  const sheet = process.env.TRESORERIE_SHEET || 'Prévisionnel TRESO';
  const range = process.env.TRESORERIE_RANGE || 'H4:AS97';

  if (!file) {
    return res.status(501).json({
      ok: false,
      error: 'ONEDRIVE_FILE_PATH manquant',
    });
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
      mode: process.env.SHAREPOINT_HOSTNAME ? 'sharepoint' : 'onedrive',
      derniere_maj: new Date().toISOString().slice(0, 16).replace('T', ' '),
      semaines,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erreur OneDrive' });
  }
}
