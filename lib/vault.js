// Client-side encryption for budgets. Everything here runs in the browser.
// The database only ever receives the encrypted envelope returned by encrypt().
const enc = new TextEncoder()
const dec = new TextDecoder()
const ITER = 600000

const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s) }
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const rand = (n) => crypto.getRandomValues(new Uint8Array(n))

const A32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function toBase32(u8) {
  let bits = 0, val = 0, out = ''
  for (const b of u8) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += A32[(val >>> (bits - 5)) & 31]; bits -= 5 } }
  if (bits > 0) out += A32[(val << (5 - bits)) & 31]
  return out
}
function fromBase32(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0, val = 0; const out = []
  for (const ch of clean) { val = (val << 5) | A32.indexOf(ch); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8 } }
  return Uint8Array.from(out)
}
export const formatRecovery = (u8) => toBase32(u8).match(/.{1,4}/g).join('-')

async function passKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass.normalize('NFKC')), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
const recKey = (u8) => crypto.subtle.importKey('raw', u8, 'AES-GCM', false, ['encrypt', 'decrypt'])
const dataKey = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
async function seal(key, bytes) { const iv = rand(12); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes); return { iv: b64(iv), ct: b64(ct) } }
async function open(key, o) { return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, key, unb64(o.ct))) }

export const isVault = (d) => !!d && d.enc === 2

// Encrypt the budget with the data key, keeping the wrapped keys from the envelope.
export async function encrypt(dek, obj, env) {
  const s = await seal(dek, enc.encode(JSON.stringify(obj === undefined ? null : obj)))
  return { enc: 2, kdf: env.kdf, wp: env.wp, wr: env.wr, iv: s.iv, ct: s.ct }
}
export async function decrypt(dek, env) { return JSON.parse(dec.decode(await open(dek, env))) }

// First-time set-up: new data key, wrapped by the passphrase and by a recovery key.
export async function create(pass, obj) {
  const raw = rand(32), salt = rand(16), rec = rand(32)
  const wp = await seal(await passKey(pass, salt, ITER), raw)
  const wr = await seal(await recKey(rec), raw)
  const base = { kdf: { salt: b64(salt), iter: ITER }, wp, wr }
  const dek = await dataKey(raw)
  return { dek, envelope: await encrypt(dek, obj, base), recovery: formatRecovery(rec) }
}
export async function unlockWithPass(env, pass) {
  const raw = await open(await passKey(pass, unb64(env.kdf.salt), env.kdf.iter), env.wp)
  const dek = await dataKey(raw); await decrypt(dek, env); return dek
}
// Forgot the passphrase: the recovery key opens the data, and a new passphrase replaces the old one.
export async function recover(env, recovery, newPass) {
  const raw = await open(await recKey(fromBase32(recovery)), env.wr)
  const dek = await dataKey(raw), obj = await decrypt(dek, env)
  const salt = rand(16), wp = await seal(await passKey(newPass, salt, ITER), raw)
  const base = { kdf: { salt: b64(salt), iter: ITER }, wp, wr: env.wr }
  return { dek, obj, envelope: await encrypt(dek, obj, base) }
}

// Optional "remember on this device": a non-extractable key kept in this browser only.
const DB = 'bt-vault'
function idb() { return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) }) }
export async function remember(uid, dek) { try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').put(dek, uid); t.oncomplete = res; t.onerror = () => rej(t.error) }) } catch (e) {} }
export async function recall(uid) { try { const db = await idb(); return await new Promise((res) => { const q = db.transaction('k').objectStore('k').get(uid); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null) }) } catch (e) { return null } }
export async function forget(uid) { try { const db = await idb(); await new Promise((res) => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').delete(uid); t.oncomplete = res; t.onerror = res }) } catch (e) {} }
