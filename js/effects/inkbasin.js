/* ============================================================================
   inkbasin.js · the footer canvas. Last thing built, first thing deletable.
   dpr capped at 2 (1.5 on coarse), particle count scales with area and
   --ink-density, resize is debounced with ONE getBoundingClientRect per
   resize and none per frame, and the loop is NOT SCHEDULED while off-screen
   or while the document is hidden.
   ========================================================================= */
import { reduced } from '../core/motion.js';

export function init(root = document) {
  const cv = root.querySelector('#inkBasin');
  if (!cv || reduced()) return;
  const ctx = cv.getContext('2d', { alpha: true });
  if (!ctx) return;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
  const density = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--ink-density')) || 1;

  let w = 0, h = 0, drops = [], raf = 0, visible = false;

  function size() {
    const r = cv.getBoundingClientRect();           // one read, per resize only
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(52, (w * h) / 9000) * density);
    drops = Array.from({ length: n }, (_, i) => ({
      x: ((i * 97) % 100) / 100 * w,
      y: ((i * 53) % 100) / 100 * h,
      r: 2 + ((i * 31) % 26) / 6,
      vy: 0.06 + ((i * 17) % 20) / 260,
      a: 0.05 + ((i * 13) % 18) / 180
    }));
  }

  function frame() {
    raf = 0;
    ctx.clearRect(0, 0, w, h);
    for (const d of drops) {
      d.y += d.vy;
      if (d.y - d.r > h) { d.y = -d.r; }
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,213,198,${d.a})`;
      ctx.fill();
    }
    schedule();
  }
  function schedule() {
    if (raf || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { size(); schedule(); }, 150);
  }, { passive: true });

  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible) schedule(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(cv);

  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });

  size();
}
