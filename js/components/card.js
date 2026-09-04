/* card.js · 裏 THE TURN.
   The back image is injected ON INTENT and only revealed once it has decoded,
   so the first hover can never expose a bare plate. On coarse pointers there
   is no hover at all, so a centre-band observer turns whichever card is
   nearest the middle of the viewport. */
import { $$, on } from '../core/dom.js';
import { reduced } from '../core/motion.js';

async function arm(card) {
  if (card.dataset.ready != null) return;
  const back = card.querySelector('.card__img--back');
  if (!back || !back.dataset.src) { card.dataset.ready = ''; return; }
  back.src = back.dataset.src;
  try { await back.decode(); } catch { /* a failed decode still lets it show */ }
  card.dataset.ready = '';
}

export function init(root = document) {
  const cards = $$('.card', root);

  for (const card of cards) {
    on(card, 'pointerenter', () => arm(card), { once: true, passive: true });
    on(card, 'focusin', () => arm(card), { once: true });
    /* --ang comes from which side the cursor entered, so the dissolve starts
       from the pointer rather than always from the same edge. */
    on(card, 'pointermove', e => {
      const frame = card.querySelector('.card__frame');
      if (!frame) return;
      const r = frame.getBoundingClientRect();
      if (!r.width) return;
      const left = (e.clientX - r.left) / r.width < 0.5;
      card.style.setProperty('--ang', left ? '100deg' : '280deg');
    }, { passive: true });
  }

  /* Coarse pointer: no hover exists, so the centre band does the turning. */
  if (matchMedia('(pointer: coarse)').matches && !reduced()) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const card = e.target;
        if (e.isIntersecting) { arm(card); card.classList.add('is-turned'); }
        else card.classList.remove('is-turned');
      }
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    cards.forEach(c => io.observe(c));
  }
}
