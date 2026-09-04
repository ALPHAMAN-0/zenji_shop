/* lookbook.js · panel parallax. transform only, quantized, and the panels are
   only driven while they are actually on screen. */
import { $$ } from '../core/dom.js';
import { add, q, progress } from '../core/raf.js';
import { reduced } from '../core/motion.js';

export function init(root = document) {
  if (reduced()) return;
  const panels = $$('.look__panel img, .look__wide img', root);
  if (!panels.length) return;

  const live = new Set();
  /* img -> { top, height } in document coordinates.

     This map is the whole point. The write pass used to read host.offsetTop,
     host.offsetHeight and window.innerHeight TWICE, per panel, per frame,
     interleaved with setProperty writes across up to eight panels — a
     read/write/read/write thrash inside the one pass that raf.js explicitly
     forbids reads in.

     The fix costs nothing because the observer has already measured it:
     entry.boundingClientRect is computed by the IntersectionObserver itself,
     off the main thread's critical path, and refreshed every time a panel
     re-enters. Free geometry. */
  const geo = new WeakMap();

  const io = new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) { live.delete(e.target); continue; }
      geo.set(e.target, {
        top: e.boundingClientRect.top + window.scrollY,
        height: e.boundingClientRect.height
      });
      live.add(e.target);
    }
  }, { rootMargin: '10% 0px' });
  panels.forEach(p => io.observe(p));

  const off = add({
    read: ctx => live.size ? q(ctx.y / Math.max(1, ctx.vh), 24) : null,
    write(v, ctx) {
      if (v == null) return;
      for (const img of live) {
        const g = geo.get(img);
        if (!g) continue;
        /* ctx.vh, not window.innerHeight: the cached value is the whole
           reason the context object exists. */
        const p = progress(v * ctx.vh + ctx.vh, g.top, g.top + g.height + ctx.vh);
        img.style.setProperty('--py', `${((p - 0.5) * -34).toFixed(1)}px`);
      }
    }
  });

  return () => {
    off();
    io.disconnect();
    live.clear();
    panels.forEach(p => p.style.removeProperty('--py'));
  };
}
