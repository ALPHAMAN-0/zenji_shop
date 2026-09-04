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

  /* Read from the token so the rail's cycle length lives in exactly one
     place. It used to be 38 here and 38s in components.css. */
  const BASE = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--d-rail')) || 38;

  let vel = 0, blurred = false;

  /* `continuous` is read fresh from the task every frame by raf.js, so the
     task can park ITSELF. It used to be a permanent true, which meant the one
     rAF loop on the site never idled on index.html — a callback every 16ms
     forever, for a rail that is not moving. The change guard kept style
     writes at zero, but the frames still ran.

     vel decays to exactly 0 in read() below, which is the natural place to
     stop: while it is still decaying v > 0 keeps us awake so the tail runs,
     and the scroll listener wakes us again on the next scroll. */
  const task = {
    continuous: false,
    read() {
      vel += (Math.abs(ctx.dy) * 0.06 - vel) * 0.06;
      if (vel < 0.004) vel = 0;
      return Math.round(vel * 100) / 100;      // quantized: discrete repaints only
    },
    write(v) {
      task.continuous = v > 0;
      const rate = 1 + Math.min(v * 0.5, 2.4);
      rail.style.animationDuration = `${(BASE / rate).toFixed(2)}s`;
      const want = v > 0.6;
      if (want !== blurred) {
        blurred = want;
        rail.style.filter = want ? `blur(${Math.min(v * 0.5, 1.6).toFixed(2)}px)` : '';
        rail.style.willChange = want ? 'filter, transform' : '';
      } else if (want) {
        rail.style.filter = `blur(${Math.min(v * 0.5, 1.6).toFixed(2)}px)`;
      }
    }
  };

  const off = add(task);
  return () => {
    off();
    rail.style.animationDuration = '';
    rail.style.filter = '';
    rail.style.willChange = '';
  };
}
