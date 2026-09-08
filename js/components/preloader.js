/* ============================================================================
   preloader.js · 墨磨り THE GRINDING
   ----------------------------------------------------------------------------
   A wet diagonal stroke sweeps down-right and the ZJ monogram is PAINTED IN
   behind it. A vermillion hanko punches down beside it, overshoots, lands, and
   sets from wet ink to dry — and while it sets, nothing else moves at all.
   That stillness is 間, and it is authored, not incidental.

   Then the paper is GONE. One frame. No slide, no wipe, no fade.

   Two things were wrong with the sequence this replaces.

   1. It ran the whole 一筆 hero arrival UNDERNEATH itself. main.js started the
      hero and the reveal observer at boot and only then called this module,
      throwing the returned promise away. Measured on a cold load: the stroke,
      the three headline words and their dry-down all finished between 967ms
      and 1268ms, and the plate did not clear until 2245ms. The site's
      signature moment completed, in full, behind an opaque white panel, on
      every first visit it has ever had. The plate now OWNS the stage and its
      promise is the "stage is clear" signal main.js waits on.

   2. Its timings were four raw millisecond literals — 620, 820, 1500, 2200 —
      which tools/check-paths.sh gate 8 cannot see, because gate 8 only scans
      css/*.css. So the file that exists to conduct the site's timing was the
      one place in it not bound to the duration tokens. Every beat below is
      derived from a token, and the total is asserted against the 2200ms cap.

   Total: --d-soak + --d-stamp + --d-turn = 1520ms, against a 2200ms cap.
   That is 725ms EARLIER than the sequence it replaces, and it has a hold in
   it. Skipped entirely on repeat visits within a session: nobody should sit
   through a logo animation twice.
   ========================================================================= */
import { $ } from '../core/dom.js';
import { reduced } from '../core/motion.js';
import { sessionSeen, markSeen } from '../core/store.js';

/* The documented hard cap. Asserted below rather than trusted, because the
   beats are now derived and a token change could silently push past it. */
const CAP = 2200;

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

  /* --- The running order, entirely in tokens --------------------------- */
  const grind = D('--d-soak')  || 700;   // 0    -> 700   the monogram
  const punch = D('--d-stamp') || 200;   // 700  -> 900   the seal lands
  const set   = D('--d-turn')  || 620;   // 900  -> 1520  it dries. 間.
  const cut   = grind + punch + set;

  if (cut > CAP) console.warn(`[zenji] plate ${cut}ms exceeds the ${CAP}ms cap`);

  /* The monogram is an alpha mask (88.5% of the file is alpha-0), so it is
     invisible as an <img> on paper and only works as mask-image. The fill is
     a travelling gradient BEHIND that mask, intersected with the fibre tile.
     .plate__mark itself carries NO background — see css/sections.css. It is
     the silhouette; this child is the only ink on the plate. */
  const inner = mark && mark.firstElementChild ? mark.firstElementChild : mark;
  if (inner) {
    inner.style.webkitMaskImage = inner.style.maskImage =
      `${cs.getPropertyValue('--fiber').trim()}, linear-gradient(115deg, #000 0 calc(var(--fill) - 12%), transparent var(--fill))`;
    inner.style.webkitMaskSize = inner.style.maskSize = `${cs.getPropertyValue('--fiber-size').trim()}, 100% 100%`;
    inner.style.webkitMaskRepeat = inner.style.maskRepeat = 'repeat, no-repeat';
    inner.style.maskComposite = 'intersect';
    inner.animate([{ '--fill': '0%' }, { '--fill': '118%' }],
      { duration: grind, easing: E('--e-brush'), fill: 'forwards' });
  }

  if (stamp) {
    /* 版ずれ: the vermillion plate lands OFF REGISTER and pulls in, the way a
       second colour does on a press that is not quite true. The overshoot was
       already here; the misregistration is what makes it read as printed. */
    stamp.animate(
      [{ transform: 'translate(5px, -4px) scale(1.55) rotate(-7deg)' },
       { transform: 'translate(2px, -1px) scale(.97) rotate(1.5deg)', offset: .62 },
       { transform: 'translate(0, 0) scale(1) rotate(0)' }],
      { duration: punch, delay: grind, easing: E('--e-flick'), fill: 'forwards' });
    /* Wet ink sets to dry over exactly the hold, so the last thing that
       changes on the plate finishes on the same frame the paper leaves. */
    stamp.animate(
      [{ background: cs.getPropertyValue('--brand-wet').trim() || '#F2523A' },
       { background: cs.getPropertyValue('--brand').trim() || '#BC0100' }],
      { duration: set, delay: grind + punch, fill: 'forwards' });
  }

  return new Promise(resolve => {
    /* THE CUT. Not a transition — a removal. This site had no cut grammar at
       all: every single state change on it bleeds, which is exactly why one
       hard cut lands. The .plate[data-done] slide-up this replaces was also
       being severed mid-travel anyway, at roughly 94%, because the removal
       timer and the transition started a frame apart. */
    setTimeout(() => { plate.remove(); resolve(); }, cut);
  });
}
