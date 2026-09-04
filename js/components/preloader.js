/* ============================================================================
   preloader.js · 墨磨り THE GRINDING
   ----------------------------------------------------------------------------
   A wet diagonal stroke sweeps down-right and the ZJ monogram fills in BEHIND
   it — painted, not revealed. A vermillion hanko stamps beside it with a hard
   overshoot. Then the plate wipes upward off the top.

   Hard cap 2200ms, and skipped entirely on repeat visits within a session:
   nobody should sit through a logo animation twice.
   ========================================================================= */
import { $ } from '../core/dom.js';
import { reduced } from '../core/motion.js';
import { sessionSeen, markSeen } from '../core/store.js';

export function run() {
  const plate = $('#plate');
  if (!plate) return Promise.resolve();

  if (reduced() || sessionSeen('plate')) { plate.remove(); return Promise.resolve(); }
  markSeen('plate');

  const mark = $('#plateMark');
  const stamp = $('#plateStamp');
  plate.hidden = false;

  const cs = getComputedStyle(document.documentElement);
  const D = k => parseFloat(cs.getPropertyValue(k)) || 0;
  const E = k => cs.getPropertyValue(k).trim() || 'ease';

  /* The monogram is an alpha mask (88.5% of the file is alpha-0), so it is
     invisible as an <img> on paper and only works as mask-image. The fill is
     a travelling gradient BEHIND that mask, intersected with the fibre tile. */
  const inner = mark && mark.firstElementChild ? mark.firstElementChild : mark;
  if (inner) {
    inner.style.webkitMaskImage = inner.style.maskImage =
      `${cs.getPropertyValue('--fiber').trim()}, linear-gradient(115deg, #000 0 calc(var(--fill) - 12%), transparent var(--fill))`;
    inner.style.webkitMaskSize = inner.style.maskSize = `${cs.getPropertyValue('--fiber-size').trim()}, 100% 100%`;
    inner.style.webkitMaskRepeat = inner.style.maskRepeat = 'repeat, no-repeat';
    inner.style.maskComposite = 'intersect';
    inner.animate([{ '--fill': '0%' }, { '--fill': '118%' }],
      { duration: D('--d-bleed-lg') || 1100, easing: E('--e-brush'), fill: 'forwards' });
  }

  if (stamp) {
    stamp.animate(
      [{ transform: 'scale(1.55) rotate(-7deg)' },
       { transform: 'scale(.97) rotate(1.5deg)', offset: .62 },
       { transform: 'scale(1) rotate(0)' }],
      { duration: D('--d-stamp') || 200, delay: 620, easing: E('--e-flick'), fill: 'forwards' });
    stamp.animate(
      [{ background: cs.getPropertyValue('--shu-wet').trim() || '#E04A2F' },
       { background: cs.getPropertyValue('--shu').trim() || '#C1372B' }],
      { duration: D('--d-soak') || 700, delay: 820, fill: 'forwards' });
  }

  return new Promise(resolve => {
    const finish = () => {
      plate.setAttribute('data-done', '');
      setTimeout(() => { plate.remove(); resolve(); }, D('--d-bleed') || 900);
    };
    setTimeout(finish, Math.min(1500, 2200 - (D('--d-bleed') || 900)));
  });
}
