/* marquee.js · 濡れ THE WET RIBBON.
   A CSS steps-free linear rail is the floor; this couples it to scroll
   velocity so the ink smears when dragged and eases back over ~1s. Six lines
   of real work separate this from a stock CSS marquee, and it is the cheapest
   character-per-byte on the site.
   Blur is capped at 1.6px, applied only above a threshold, and will-change is
   gated identically — a permanently promoted blurred layer is exactly the
   thing that quietly costs 15MB. */
import { add, ctx } from '../core/raf.js';
import { reduced } from '../core/motion.js';

export function init(root = document) {
  const rail = root.querySelector('#marqueeRail');
  const bar = root.querySelector('#marquee');
  if (!rail || !bar) return;

  /* Duplicate the segment so the -50% keyframe loops seamlessly. */
  const seg = rail.firstElementChild;
  if (seg && rail.children.length === 1) rail.append(seg.cloneNode(true));

  if (reduced()) return;

  let vel = 0, blurred = false;
  add({
    continuous: true,
    read() {
      vel += (Math.abs(ctx.dy) * 0.06 - vel) * 0.06;
      if (vel < 0.004) vel = 0;
      return Math.round(vel * 100) / 100;      // quantized: discrete repaints only
    },
    write(v) {
      const rate = 1 + Math.min(v * 0.5, 2.4);
      rail.style.animationDuration = `${(38 / rate).toFixed(2)}s`;
      const want = v > 0.6;
      if (want !== blurred) {
        blurred = want;
        rail.style.filter = want ? `blur(${Math.min(v * 0.5, 1.6).toFixed(2)}px)` : '';
        rail.style.willChange = want ? 'filter, transform' : '';
      } else if (want) {
        rail.style.filter = `blur(${Math.min(v * 0.5, 1.6).toFixed(2)}px)`;
      }
    }
  });
}
