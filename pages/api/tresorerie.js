// Endpoint trésorerie hebdomadaire — lecture d'un Excel sur OneDrive via Microsoft Graph.
//
// Configuration requise (variables d'env Vercel) :
//   MS_TENANT_ID        — Tenant Azure AD
//   MS_CLIENT_ID        — App registration client ID
//   MS_CLIENT_SECRET    — App registration secret
//   ONEDRIVE_USER       — UPN du propriétaire OneDrive (ex: loic@valorcia.com)
//   ONEDRIVE_FILE_PATH  — Chemin du fichier (ex: /Finance/Tresorerie_Groupe_2026.xlsx)
//   TRESORERIE_SHEET    — Nom de la feuille (défaut: "Données")
//
// Tant que ces variables ne sont pas définies, on renvoie 501 et le dashboard
// affiche les données simulées (fallback côté UI).

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
  const encoded = encodeURIComponent(filePath.startsWith('/') ? filePath : `/${filePath}`);
  const url = `${GRAPH_BASE}/users/${encodeURIComponent(user)}/drive/root:${encoded}:/workbook/worksheets('${encodeURIComponent(sheet)}')/range(address='${encodeURIComponent(range)}')`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Lecture Excel échouée : HTTP ${res.status} — ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// Parse les valeurs Excel en lignes [semaine, label, entrees, sorties].
// Attendu : colonne A=semaine (ex "S20"), B=label (ex "12-18 mai"), C=entrées, D=sorties.
function parseRows(values) {
  const out = [];
  for (const row of values || []) {
    if (!row || !row[0]) continue;
    const entrees = parseFloat(String(row[2] ?? '').replace(/\s/g, '').replace(',', '.'));
    const sorties = parseFloat(String(row[3] ?? '').replace(/\s/g, '').replace(',', '.'));
    if (!isFinite(entrees) && !isFinite(sorties)) continue;
    out.push({
      semaine: String(row[0]),
      label: row[1] ? String(row[1]) : '',
      entrees: isFinite(entrees) ? entrees : 0,
      sorties: isFinite(sorties) ? sorties : 0,
    });
  }
  return out;
}

export default async function handler(req, res) {
  const user = process.env.ONEDRIVE_USER;
  const file = process.env.ONEDRIVE_FILE_PATH;
  const sheet = process.env.TRESORERIE_SHEET || 'Données';
  const range = req.query.range || process.env.TRESORERIE_RANGE || 'A2:D14';

  if (!user || !file) {
    return res.status(501).json({
      ok: false,
      error: 'OneDrive non configuré (ONEDRIVE_USER / ONEDRIVE_FILE_PATH manquants)',
    });
  }

  try {
    const token = await getAccessToken();
    const data = await readExcelRange(token, user, file, sheet, range);
    const semaines = parseRows(data.values);
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
