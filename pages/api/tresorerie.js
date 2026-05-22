// Endpoint trésorerie hebdomadaire — lecture du fichier "Prévisionnel TRESO"
// hébergé sur OneDrive, via Microsoft Graph (flow client_credentials).
//
// Structure attendue du fichier (sheet "Prévisionnel TRESO") :
//   - Ligne 4  : numéros de semaines (S43, S44, … , S28) en H:AS
//   - Ligne 36 : total sorties hebdo (H:AS)
//   - Ligne 91 : total entrées TTC hebdo (H:AS)
//   - Ligne 95 : différence hebdo (entrées − sorties)
//   - Ligne 97 : trésorerie cumulée fin de semaine
//
// Variables d'env requises côté Vercel :
//   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET
//   ONEDRIVE_USER       — ex: loic@valorcia.com
//   ONEDRIVE_FILE_PATH  — ex: /Finance/Previsionnel_Tresorerie_TDB.xlsx
//   TRESORERIE_SHEET    — défaut: "Prévisionnel TRESO"
//   TRESORERIE_RANGE    — défaut: "H4:AS97" (couvre toutes les lignes utiles)

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
  if (!res.ok) throw new Error(`Auth Microsoft Graph échouée : HTTP ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function readExcelRange(token, user, filePath, sheet, range) {
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `${GRAPH_BASE}/users/${encodeURIComponent(user)}/drive/root:${encodedPath}:/workbook/worksheets('${encodeURIComponent(sheet)}')/range(address='${encodeURIComponent(range)}')`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Lecture Excel échouée : HTTP ${res.status} — ${txt.slice(0, 300)}`);
  }
  return res.json();
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}

export default async function handler(req, res) {
  const user = process.env.ONEDRIVE_USER;
  const file = process.env.ONEDRIVE_FILE_PATH;
  const sheet = process.env.TRESORERIE_SHEET || 'Prévisionnel TRESO';
  const range = process.env.TRESORERIE_RANGE || 'H4:AS97';

  if (!user || !file) {
    return res.status(501).json({
      ok: false,
      error: 'OneDrive non configuré (ONEDRIVE_USER / ONEDRIVE_FILE_PATH manquants)',
    });
  }

  try {
    const token = await getAccessToken();
    const data = await readExcelRange(token, user, file, sheet, range);
    const values = data.values || [];

    // values[0] = ligne 4 du sheet (semaines)
    // values[32] = ligne 36 (sorties), values[87] = ligne 91 (entrées),
    // values[91] = ligne 95 (différence), values[93] = ligne 97 (cumul)
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
      derniere_maj: new Date().toISOString().slice(0, 16).replace('T', ' '),
      semaines,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Erreur OneDrive' });
  }
}
