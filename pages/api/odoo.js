import { searchRead, version } from '../../lib/odoo';

export default async function handler(req, res) {
  const { model = 'res.partner', limit = '10', fields, ping } = req.query;

  try {
    if (ping === '1') {
      const v = await version();
      return res.status(200).json({ ok: true, version: v });
    }

    const fieldList = fields
      ? String(fields).split(',').map((f) => f.trim()).filter(Boolean)
      : ['id', 'name', 'email', 'phone', 'country_id'];

    const records = await searchRead(
      String(model),
      [],
      fieldList,
      Math.min(parseInt(String(limit), 10) || 10, 200)
    );

    return res.status(200).json({ ok: true, model, count: records.length, records });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Odoo error' });
  }
}
