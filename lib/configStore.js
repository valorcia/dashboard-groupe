// Stockage chiffré (AES-256-GCM) des valeurs de config dans Upstash Redis / Vercel KV.
// Secrets jamais stockés en clair. Lecture/écriture via clé maîtresse CONNECTORS_MASTER_KEY
// (64 caractères hex = 32 octets). Sans clé maîtresse, les opérations sur secrets échouent.

import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const KV_KEY = 'connectors:config:v1';
const ALGO = 'aes-256-gcm';

// Compatibilité Upstash <-> Vercel KV : les deux fournisseurs utilisent des noms
// d'env différents. On accepte les deux.
function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getMasterKey() {
  const hex = process.env.CONNECTORS_MASTER_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, 'hex');
}

export function isStoreReady() {
  return !!(getRedis() && getMasterKey());
}

export function storeStatus() {
  return {
    redis: !!getRedis(),
    masterKey: !!getMasterKey(),
    masterKeyLength: process.env.CONNECTORS_MASTER_KEY?.length || 0,
  };
}

function encrypt(plaintext) {
  const key = getMasterKey();
  if (!key) throw new Error('CONNECTORS_MASTER_KEY manquant ou invalide (64 chars hex requis)');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function decrypt(payload) {
  const key = getMasterKey();
  if (!key) throw new Error('CONNECTORS_MASTER_KEY manquant ou invalide');
  const [tag1, ver, ivB64, tagB64, encB64] = payload.split(':');
  if (tag1 !== 'enc' || ver !== 'v1') throw new Error('Format chiffré invalide');
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([decipher.update(Buffer.from(encB64, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}

// Lit le blob brut KV ; retourne un objet { key: { value, secret } } ou {} si vide.
async function readBlob() {
  const redis = getRedis();
  if (!redis) return {};
  const raw = await redis.get(KV_KEY);
  if (!raw) return {};
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function writeBlob(blob) {
  const redis = getRedis();
  if (!redis) throw new Error('Redis non configuré (KV_REST_API_URL/TOKEN manquants)');
  await redis.set(KV_KEY, JSON.stringify(blob));
}

// Lit toutes les valeurs KV en clair (secrets déchiffrés). Pour usage côté serveur uniquement.
export async function readAll() {
  const blob = await readBlob();
  const out = {};
  for (const [key, entry] of Object.entries(blob)) {
    if (!entry || entry.value == null) continue;
    if (entry.secret && typeof entry.value === 'string' && entry.value.startsWith('enc:')) {
      try {
        out[key] = decrypt(entry.value);
      } catch (e) {
        out[key] = undefined;
      }
    } else {
      out[key] = entry.value;
    }
  }
  return out;
}

// Lit toutes les valeurs avec secrets masqués. Pour exposition côté UI.
export async function readAllMasked() {
  const blob = await readBlob();
  const out = {};
  for (const [key, entry] of Object.entries(blob)) {
    if (!entry || entry.value == null) {
      out[key] = { defined: false, secret: !!entry?.secret };
      continue;
    }
    if (entry.secret) {
      out[key] = { defined: true, secret: true, preview: '••••••••' };
    } else {
      const v = String(entry.value);
      out[key] = { defined: true, secret: false, value: v.length > 80 ? `${v.slice(0, 77)}…` : v };
    }
  }
  return out;
}

// Met à jour plusieurs clés à la fois. `updates` = [{ key, value, secret }].
// value === null efface la clé.
export async function writeMany(updates) {
  const blob = await readBlob();
  for (const u of updates) {
    if (u.value === null || u.value === undefined || u.value === '') {
      delete blob[u.key];
      continue;
    }
    if (u.secret) {
      blob[u.key] = { value: encrypt(String(u.value)), secret: true };
    } else {
      blob[u.key] = { value: String(u.value), secret: false };
    }
  }
  await writeBlob(blob);
}
