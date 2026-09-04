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

/* ONE delegated pair for the whole document, the same pattern hanko.js uses.

   What this replaces: three listeners PER CARD, one of which ran a
   querySelector AND a getBoundingClientRect on every single pointermove
   event. Ten cards on collection.html meant thirty listeners and a forced
   layout read per mouse movement — the clearest INP risk on the site.

   The realisation is that the code never wanted continuous tracking. Its own
   comment said --ang is decided by whichever side the cursor entered on, and
   entry happens once. So the rect is read once per hover instead of once per
   event, and `pointerover` is used rather than `pointerenter` because
   pointerover bubbles and pointerenter does not.

   Two live bugs fixed for free: `{ once: true }` on pointerenter meant a card
   whose back image failed to load could never re-arm, and cards injected
   after boot (the related strip on a product page) were never armed at all.
   Delegation covers both, the way observe()'s data-seen marker does. */
let bound = false;
let lastCard = null;

function bindDelegates() {
  if (bound) return () => {};
  bound = true;
  const offOver = on(document, 'pointerover', e => {
    const card = e.target.closest?.('.card');
    if (!card || card === lastCard) return;
    lastCard = card;
    arm(card);
    const frame = card.querySelector('.card__frame');
    if (!frame) return;
    const r = frame.getBoundingClientRect();
    if (!r.width) return;
    card.style.setProperty('--ang',
      (e.clientX - r.left) / r.width < 0.5 ? '100deg' : '280deg');
  }, { passive: true });

  const offOut = on(document, 'pointerout', e => {
    if (e.relatedTarget && e.target.closest?.('.card')?.contains(e.relatedTarget)) return;
    lastCard = null;
  }, { passive: true });

  const offFocus = on(document, 'focusin', e => {
    const card = e.target.closest?.('.card');
    if (card) arm(card);
  });

  return () => { offOver(); offOut(); offFocus(); bound = false; lastCard = null; };
}

export function init(root = document) {
  const offDelegates = bindDelegates();
  let io = null;

  /* Coarse pointer: no hover exists, so the centre band does the turning. */
  if (matchMedia('(pointer: coarse)').matches && !reduced()) {
    io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const card = e.target;
        if (e.isIntersecting) { arm(card); card.classList.add('is-turned'); }
        else card.classList.remove('is-turned');
      }
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    $$('.card', root).forEach(c => io.observe(c));
  }

  return () => {
    offDelegates();
    io?.disconnect();
    $$('.card', root).forEach(c => c.classList.remove('is-turned'));
  };
}
