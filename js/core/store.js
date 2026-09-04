/* store.js · localStorage behind try/catch and a version key.
   Storage throws outright in some contexts (Safari private mode, blocked
   site data). Every read and write is guarded; a failure degrades to an
   in-memory store for the session rather than breaking the page. */
/* Exported so the pre-paint inline script in every page's <head> can read it
   instead of hardcoding the literal 'zenji.v1.motion'. Bumping this version
   used to silently stop the motion preference hydrating before paint, because
   the prefix existed in two places that nothing kept in step. */
export const PREFIX = 'zenji.v1.';
const V = PREFIX;
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


/* --- Cross-tab -------------------------------------------------------------
   The `storage` event fires in every OTHER tab, never the one that wrote, so
   an echo loop is impossible by spec. Two tabs used to diverge silently and
   the last write won. */
const watchers = new Set();
export const onExternalChange = fn => { watchers.add(fn); return () => watchers.delete(fn); };

addEventListener('storage', e => {
  if (!e.key || !e.key.startsWith(V)) return;   /* null key = clear(); ignore */
  let value;
  try { value = e.newValue == null ? null : JSON.parse(e.newValue); } catch { return; }
  const key = e.key.slice(V.length);
  for (const fn of watchers) { try { fn(key, value); } catch { /* keep going */ } }
});
