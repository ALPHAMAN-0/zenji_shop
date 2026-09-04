/* shuchusen.js · 集中線 concentrated lines.
   The ONE full-viewport flash on the entire site, and it fires at most twice
   per session. The node is removed on finish so the conic gradient — the most
   expensive gradient to rasterise — never persists as a layer.
   flashGate() enforces <=3 flashes/second globally: photosensitivity is a
   mechanism here, not a note in a doc. */
import { reduced } from '../core/motion.js';

let fired = 0;
let lastAt = -Infinity;

export function burst() {
  if (reduced() || fired >= 2) return;
  const now = performance.now();
  if (now - lastAt < 334) return;          // hard gate: max ~3/second
  lastAt = now; fired++;

  const n = document.createElement('div');
  n.className = 'shuchusen';
  n.setAttribute('aria-hidden', 'true');
  document.body.append(n);
  const done = () => n.remove();
  n.addEventListener('animationend', done, { once: true });
  setTimeout(done, 900);                   // net, in case animationend is missed
}
