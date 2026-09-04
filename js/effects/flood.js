/* flood.js · 墨流し THE FLOOD.
   Scroll drives --front upward. The headline inversion is NOT scripted: it is
   `color:var(--washi); mix-blend-mode:difference` over the ink, so it is
   frame-perfect because it is compositing rather than a class toggle.
   This module only moves the front and swaps the nav's ground. */
import { $ } from '../core/dom.js';
import { add, q, progress } from '../core/raf.js';
import { reduced } from '../core/motion.js';

export function init() {
  const zone = $('#flood');
  const ink = $('#floodInk');
  const nav = $('#nav');
  if (!zone || !ink) return;

  if (reduced()) { ink.style.setProperty('--front', '115%'); return; }

  let dark = false;
  add({
    read(ctx) {
      const box = zone.offsetTop;
      const h = zone.offsetHeight;
      const p = progress(ctx.y + ctx.vh, box, box + h * 0.85);
      return q(p, 24);
    },
    write(p) {
      ink.style.setProperty('--front', `${(p * 115).toFixed(1)}%`);
      const want = p > 0.55;
      if (want !== dark && nav) {
        dark = want;
        nav.dataset.ground = want ? 'taku' : '';
      }
    }
  });
}
