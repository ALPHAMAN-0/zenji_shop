/* flood.js · 墨流し THE FLOOD.
   Scroll drives --front upward. The headline inversion is NOT scripted: it is
   `color:var(--ground); mix-blend-mode:difference` over the ink, so it is
   frame-perfect because it is compositing rather than a class toggle.
   This module only moves the front; nav.js owns the nav's ground. */
import { $ } from '../core/dom.js';
import { add, q, progress, onMeasure } from '../core/raf.js';
import { reduced } from '../core/motion.js';

export function init() {
  const zone = $('#flood');
  const ink = $('#floodInk');
  if (!zone || !ink) return;

  if (reduced()) { ink.style.setProperty('--front', '115%'); return; }

  /* Offsets cached at resize, never read inside a frame. They were stable
     values read before writes, so this was the mild version of the problem —
     but raf.js's rule 2 does not have a mild version. */
  let box = 0, h = 0;
  const offMeasure = onMeasure(() => { box = zone.offsetTop; h = zone.offsetHeight; });

  const off = add({
    read: ctx => q(progress(ctx.y + ctx.vh, box, box + h * 0.85), 24),
    write(p) {
      ink.style.setProperty('--front', `${(p * 115).toFixed(1)}%`);
    }
  });

  /* The nav ground swap moved to nav.js, which owns the nav. It also used to
     write dataset.ground = 'taku' — a value no CSS rule has ever matched,
     since the only selector was .nav[data-ground="taku"] and nothing set it
     until now. Two modules writing one attribute is one too many. */
  return () => { off(); offMeasure(); };
}
