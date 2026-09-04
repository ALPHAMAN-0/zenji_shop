/* ============================================================================
   raf.js · THE single requestAnimationFrame loop on the site.
   ----------------------------------------------------------------------------
   Three rules this file exists to enforce:

   1. READS ARE BATCHED BEFORE WRITES. Every task's read() runs in one pass,
      then every write() runs in a second pass. Interleaving them is what
      causes layout thrash, and it is invisible until it isn't.

   2. NOTHING IS READ FROM LAYOUT INSIDE A FRAME. scrollY / innerHeight are
      sampled once per frame into a context object; viewport metrics come from
      a resize-time cache. Tasks receive numbers, never the DOM.

   3. THE CHANGE GUARD. A task's write() is called ONLY when its read() value
      actually differs from last frame. Idle scroll therefore produces exactly
      zero style writes, which is the difference between a page that is calm
      at rest and one that quietly burns a core.

   The loop is not scheduled when there is nothing to do, when the document is
   hidden, or when no task is registered.
   ========================================================================= */

const tasks = new Set();
let frame = 0;
let dirty = true;

const ctx = { y: 0, dy: 0, vh: 0, vw: 0, t: 0 };
let lastY = 0;

/** Snap to 1/n so a continuous scroll drives a DISCRETE number of repaints.
    Mask fronts quantize to 1/24, filters to 1/12. Without this a 3000px
    scroll would request 3000 distinct repaints of an uncompositable layer. */
export const q = (v, n) => Math.round(v * n) / n;

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/** Progress of `y` through [from, to], clamped to 0..1. */
export const progress = (y, from, to) => clamp((y - from) / (to - from || 1));

const measurers = new Set();

/** Register a resize-time measurement. Runs immediately, then before every
    frame that follows a resize or orientationchange.

    This exists because rule 2 above forbids layout reads inside a frame, and
    three effects were breaking it anyway for want of anywhere else to put
    them. One hook, on the listeners this module already owns, instead of a
    resize listener per effect. Returns an unsubscribe function. */
export function onMeasure(fn) {
  measurers.add(fn);
  try { fn(ctx); } catch { /* a bad measurer never blocks the rest */ }
  return () => measurers.delete(fn);
}

function measureViewport() {
  ctx.vh = window.innerHeight;
  ctx.vw = window.innerWidth;
  for (const f of measurers) { try { f(ctx); } catch { /* keep going */ } }
  dirty = true;
  schedule();
}

/**
 * add({ read, write, continuous })
 *   read(ctx)  -> value (number | string | null). MUST NOT touch layout.
 *   write(v)   -> applies styles. Called only when v changed.
 *   continuous -> keep the loop alive even when scroll is idle (decay loops).
 * Returns an unsubscribe function.
 */
export function add(task) {
  task._last = Symbol('never');
  tasks.add(task);
  dirty = true;
  schedule();
  return () => { tasks.delete(task); };
}

function schedule() {
  if (frame || document.hidden || !tasks.size) return;
  frame = requestAnimationFrame(tick);
}

function tick(t) {
  frame = 0;
  ctx.t = t;
  ctx.y = window.scrollY;          // the ONLY layout read, once per frame
  ctx.dy = ctx.y - lastY;
  lastY = ctx.y;

  // --- pass 1: read. No writes may happen here. ---
  const pending = [];
  for (const task of tasks) {
    let v;
    try { v = task.read(ctx); } catch { continue; }
    if (v !== task._last) { task._last = v; pending.push([task, v]); }
  }

  // --- pass 2: write. No reads may happen here. ---
  for (const [task, v] of pending) {
    try { task.write(v, ctx); } catch { /* one bad task never kills the loop */ }
  }

  dirty = false;
  for (const task of tasks) if (task.continuous) { dirty = true; break; }
  if (dirty) schedule();
}

addEventListener('scroll', () => { dirty = true; schedule(); }, { passive: true });
addEventListener('resize', measureViewport, { passive: true });
addEventListener('orientationchange', measureViewport, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });

measureViewport();
export { ctx };
