/* ============================================================================
   hanko.js · 判 THE PRESS. Every primary CTA is a seal, not a button.
   Bound on pointerdown, not click, so the press lands under the finger.
   In-flight animations are cancelled first so rapid presses re-trigger
   cleanly instead of queueing.
   ========================================================================= */
import { reduced } from '../core/motion.js';

const FLECKS = [[-14, 16], [12, 18], [-9, 22], [17, 13]];

export function press(node) {
  if (!node || reduced()) return;

  node.getAnimations().forEach(a => a.cancel());
  const d = getComputedStyle(node);
  const dur = parseFloat(d.getPropertyValue('--d-stamp')) || 200;
  const ease = d.getPropertyValue('--e-flick').trim() || 'ease';

  node.animate(
    [
      { transform: 'scale(1.55) rotate(-7deg)' },
      { transform: 'scale(0.97) rotate(1.5deg)', offset: 0.62 },
      { transform: 'scale(1) rotate(0deg)' }
    ],
    { duration: dur, easing: ease, fill: 'none' }
  );

  /* Wet ink flashes brighter, then sets back over 700ms. */
  node.setAttribute('data-wet', '');
  setTimeout(() => node.removeAttribute('data-wet'),
    parseFloat(d.getPropertyValue('--d-soak')) || 700);

  /* Four flecks squeezed from under the seal's edges. */
  const box = node.getBoundingClientRect();
  for (const [dx, dy] of FLECKS) {
    const fleck = document.createElement('span');
    Object.assign(fleck.style, {
      position: 'fixed', zIndex: '140', pointerEvents: 'none',
      left: `${box.left + box.width * 0.16}px`, top: `${box.bottom - 4}px`,
      width: '4px', height: '4px', borderRadius: '52% 44% 50% 46%',
      background: d.getPropertyValue('--shu').trim() || '#C1372B'
    });
    document.body.append(fleck);
    fleck.animate(
      [{ transform: 'translate3d(0,0,0) scale(.3)', opacity: 1 },
       { transform: `translate3d(${dx}px,${dy}px,0) scale(1)`, opacity: 0 }],
      { duration: dur * 1.6, easing: ease, fill: 'none' }
    ).finished.then(() => fleck.remove(), () => fleck.remove());
  }

  /* The drip: accelerating, then simply stopping. */
  node.removeAttribute('data-drip');
  void node.offsetWidth;                       // restart the CSS animation
  node.setAttribute('data-drip', '');
}

export function init(root = document) {
  root.addEventListener('pointerdown', e => {
    const seal = e.target.closest('[data-hanko]');
    if (seal) press(seal);
  }, { passive: true });
}
