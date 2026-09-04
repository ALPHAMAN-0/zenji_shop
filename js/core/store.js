/* store.js · localStorage behind try/catch and a version key.
   Storage throws outright in some contexts (Safari private mode, blocked
   site data). Every read and write is guarded; a failure degrades to an
   in-memory store for the session rather than breaking the page. */
const V = 'zenji.v1.';
const memory = new Map();
let usable = true;

try {
  const probe = V + '__probe';
  localStorage.setItem(probe, '1');
  localStorage.removeItem(probe);
} catch { usable = false; }

export function read(key, fallback) {
  try {
    if (!usable) return memory.has(V + key) ? memory.get(V + key) : fallback;
    const raw = localStorage.getItem(V + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function write(key, value) {
  try {
    if (!usable) { memory.set(V + key, value); return true; }
    localStorage.setItem(V + key, JSON.stringify(value));
    return true;
  } catch {
    memory.set(V + key, value);
    return false;
  }
}

export function sessionSeen(key) {
  try { return sessionStorage.getItem(V + key) === '1'; } catch { return false; }
}
export function markSeen(key) {
  try { sessionStorage.setItem(V + key, '1'); } catch { /* fine */ }
}
