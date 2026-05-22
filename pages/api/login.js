import { createSession, constantTimeEqual, SESSION_COOKIE } from '../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const password = process.env.APP_PASSWORD;
  const secret = process.env.APP_SESSION_SECRET;

  if (!password || !secret) {
    return res.status(500).json({ ok: false, error: 'Auth non configurée côté serveur' });
  }

  const submitted = (req.body && req.body.password) || '';
  if (!constantTimeEqual(String(submitted), password)) {
    // Petite tempo pour limiter le brute-force naïf.
    await new Promise((r) => setTimeout(r, 400));
    return res.status(401).json({ ok: false, error: 'Mot de passe incorrect' });
  }

  const maxAge = 60 * 60 * 24 * 14; // 14 jours
  const token = await createSession({ ok: true }, secret, maxAge);

  const cookie = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
