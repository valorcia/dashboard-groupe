import { executeKw, searchRead } from '../../lib/odoo';

// Renvoie une chaîne de date Odoo "YYYY-MM-DD HH:MM:SS" pour il y a N jours.
function daysAgo(n) {
  const d = new Date(Date.now() - n * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function daysBetween(odooDate) {
  if (!odooDate) return null;
  const d = new Date(odooDate.replace(' ', 'T') + 'Z');
  return Math.floor((Date.now() - d.getTime()) / (1000 * 3600 * 24));
}

// many2one Odoo : [id, "name"] ou false
function m2oName(v) {
  return Array.isArray(v) && v.length > 1 ? v[1] : null;
}

async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (e) {
    return { __error: e.message, fallback };
  }
}

export default async function handler(req, res) {
  const relanceDelay = Math.max(1, parseInt(req.query.relanceDays || '7', 10));
  const sinceMonth = daysAgo(30);
  const sinceRelance = daysAgo(relanceDelay);

  try {
    // ── CRM : leads créés depuis 30 jours ──
    const leadsMois = await safe(
      searchRead(
        'crm.lead',
        [['create_date', '>=', sinceMonth]],
        ['id', 'name', 'partner_name', 'email_from', 'phone', 'create_date', 'stage_id', 'source_id', 'team_id', 'company_id', 'expected_revenue', 'type', 'date_last_stage_update'],
        200
      ),
      []
    );

    const leadsArray = Array.isArray(leadsMois) ? leadsMois : [];

    // Sources de leads (group by source_id.name)
    const sourcesMap = {};
    for (const l of leadsArray) {
      const src = m2oName(l.source_id) || 'Autre';
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    }
    const palette = ['#f97316', '#2e6da4', '#6b3fa0', '#2d7a5a', '#dc2626', '#b5600c'];
    const sources_leads = Object.entries(sourcesMap)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count], i) => ({ source, count, couleur: palette[i % palette.length] }));

    // Leads à traiter : sans relance depuis 24h, triés par ancienneté
    const leads_a_traiter = leadsArray
      .filter(l => l.type === 'lead' || l.type === 'opportunity')
      .map(l => ({
        nom: l.partner_name || l.name || '—',
        email: l.email_from || null,
        source: m2oName(l.source_id) || 'Inconnue',
        societe: m2oName(l.company_id) || '—',
        equipe: m2oName(l.team_id) || null,
        stage: m2oName(l.stage_id) || null,
        montant: l.expected_revenue || 0,
        jours: daysBetween(l.create_date) ?? 0,
        urgent: (daysBetween(l.create_date) ?? 0) > 3,
        demande: l.name || '',
      }))
      .sort((a, b) => b.jours - a.jours)
      .slice(0, 8);

    // ── VENTE : devis et conversions ──
    const devisEnvoyes = await safe(
      searchRead(
        'sale.order',
        [['state', '=', 'sent'], ['date_order', '>=', sinceMonth]],
        ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state', 'company_id', 'user_id', 'validity_date'],
        200
      ),
      []
    );
    const devisEnvoyesArr = Array.isArray(devisEnvoyes) ? devisEnvoyes : [];

    const conversions = await safe(
      executeKw('sale.order', 'search_count', [[['state', 'in', ['sale', 'done']], ['date_order', '>=', sinceMonth]]]),
      0
    );
    const nbConversions = typeof conversions === 'number' ? conversions : 0;

    // Devis à relancer : state=sent ET date_order < J-relanceDelay
    const devisARelancer = devisEnvoyesArr
      .map(d => ({
        client: m2oName(d.partner_id) || '—',
        montant: d.amount_total || 0,
        date: d.date_order,
        jours: daysBetween(d.date_order) ?? 0,
        societe: m2oName(d.company_id) || '—',
        commercial: m2oName(d.user_id) || null,
        ref: d.name,
      }))
      .filter(d => d.jours >= relanceDelay)
      .sort((a, b) => b.jours - a.jours)
      .slice(0, 10)
      .map(d => ({
        ...d,
        action: d.jours > 21
          ? 'Appel direct recommandé — devis dépassé'
          : d.jours > 14
            ? '2e relance email — modèle "objection prix"'
            : 'Relance email programmée',
      }));

    const totalLeads = leadsArray.length;
    const devisEnvoyesCount = devisEnvoyesArr.length;
    const devisSansReponse = devisARelancer.length;
    const tauxConversion = devisEnvoyesCount > 0
      ? Math.round((nbConversions / (devisEnvoyesCount + nbConversions)) * 1000) / 10
      : 0;

    return res.status(200).json({
      ok: true,
      generated_at: new Date().toISOString(),
      relance_days: relanceDelay,
      kpis: {
        leads_mois: totalLeads,
        devis_envoyes: devisEnvoyesCount,
        devis_sans_reponse: devisSansReponse,
        conversions: nbConversions,
        taux_conversion: tauxConversion,
      },
      sources_leads,
      leads_a_traiter,
      devis_a_relancer: devisARelancer,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Odoo error' });
  }
}
