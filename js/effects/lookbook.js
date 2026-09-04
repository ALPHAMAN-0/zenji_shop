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
  const io = new IntersectionObserver(es => {
    for (const e of es) e.isIntersecting ? live.add(e.target) : live.delete(e.target);
  }, { rootMargin: '10% 0px' });
  panels.forEach(p => io.observe(p));

  add({
    read(ctx) {
      if (!live.size) return null;
      return q(ctx.y / Math.max(1, ctx.vh), 24);
    },
    write(v) {
      if (v == null) return;
      for (const img of live) {
        const host = img.parentElement;
        const top = host.offsetTop;
        const p = progress(v * (window.innerHeight || 1) + window.innerHeight, top, top + host.offsetHeight + window.innerHeight);
        img.style.setProperty('--py', `${((p - 0.5) * -34).toFixed(1)}px`);
      }
    }
  });
}
