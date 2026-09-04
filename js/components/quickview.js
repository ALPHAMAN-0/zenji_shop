/* ============================================================================
   quickview.js · 滴 THE DROP
   ----------------------------------------------------------------------------
   Ink floods the screen RADIALLY from the exact pixel you clicked, and the
   detail view is already sitting inside the flood — the product photo flying
   from its slot in the grid into the panel, one continuous motion. No modal
   fade, ever.

   Native <dialog> does the focus trap, Escape, inertness and focus restore,
   so none of that is hand-rolled.

   Deep link: ?p=<slug> opens on load, and pushState writes the same URL so
   the browser Back button closes the view.
   ========================================================================= */
import { $, el, say, shout } from '../core/dom.js';
import { byId, SIZES, fmt, priceOf, discountOf } from '../data/products.js';
import { reduced } from '../core/motion.js';
import { addToBag, toggleWish, inWish } from '../core/bag.js';
import { press } from './hanko.js';
import { burst } from '../effects/shuchusen.js';

let dlg, current = null, chosenSize = null, restoreUrl = null;

function panel(p) {
  const off = discountOf(p);
  const ink = p.accentInk || 'var(--ink)';
  return el('div.qv', { style: `--accent:${p.colorway.hex};--accent-ink:${ink};--accent-hot:${p.accentHot};--plate:${p.front.plate}` },
    el('div.veil.bleed', { id: 'qvVeil', 'data-heavy': true, 'aria-hidden': 'true' }),
    el('div.qv__panel',
      el('div.qv__frame', { id: 'qvFrame' },
        el('img', {
          src: p.front.src, width: p.front.w, height: p.front.h,
          alt: `${p.name} tee in ${p.colorway.name.toLowerCase()}, front view`,
          decoding: 'async', style: `object-position:${p.front.pos}`
        })),
      el('div',
        el('p.micro', { style: 'color:var(--accent-hot)' }, `// ${p.sku}`),
        el('h2.section__title', { style: 'margin:.4rem 0' }, p.name),
        el('p.jp', { lang: 'ja', style: 'font-size:var(--t-lg);color:var(--accent-hot)' }, p.kanji),
        el('p', { style: 'margin:.9rem 0;max-width:46ch' }, p.lore),
        el('div.card__row', { style: 'margin-bottom:1.1rem' },
          el('span.price', { style: 'font-size:var(--t-md)' }, fmt(priceOf(p))),
          p.onSale && el('span.price.price--was.is-in', {}, fmt(p.price)),
          p.onSale && el('span.tag-sale', { style: 'color:var(--accent-hot);border-color:var(--accent-hot)' }, `${off}% OFF`)),
        el('p.micro', { id: 'qvSizeLabel' }, 'Select size'),
        el('div.sizes', { role: 'group', 'aria-labelledby': 'qvSizeLabel', style: 'margin:.5rem 0 1.3rem' },
          SIZES.map(s => el('button.size', { type: 'button', 'aria-pressed': 'false', 'data-size': s }, s))),
        el('div.card__row',
          el('button.hanko', { type: 'button', id: 'qvAdd', 'data-hanko': true }, 'Add to Bag'),
          el('button.hanko.hanko--ghost', { type: 'button', id: 'qvWish' },
            inWish(p.id) ? 'Saved ✓' : 'Save'),
          el('button.hanko.hanko--ghost', { type: 'button', id: 'qvClose' }, 'Close')))));
}

/** FLIP the photo from its grid slot into the panel. Both boxes are 3/4, so
    this is a uniform scalar with no distortion — that is why the card frame
    and the panel frame share an aspect-ratio. */
function flip(fromRect) {
  const frame = $('#qvFrame');
  if (!frame || !fromRect || reduced()) return;
  const to = frame.getBoundingClientRect();
  if (!to.width) return;
  const d = getComputedStyle(document.documentElement);
  const dur = parseFloat(d.getPropertyValue('--d-turn')) || 620;
  const scale = fromRect.width / to.width;
  frame.animate(
    [{ transform: `translate(${fromRect.left - to.left}px, ${fromRect.top - to.top}px) scale(${scale})`,
       transformOrigin: 'top left' },
     { transform: 'translate(0,0) scale(1)', transformOrigin: 'top left' }],
    { duration: dur, easing: d.getPropertyValue('--e-brush').trim() || 'ease', fill: 'none' });
}

export function open(id, origin) {
  const p = byId(id);
  if (!p || !dlg) return;
  current = p; chosenSize = null;

  dlg.replaceChildren(panel(p));
  dlg.showModal();

  const veil = $('#qvVeil');
  if (veil && origin) {
    /* The click point becomes the centre of a radial mask front. */
    veil.style.setProperty('--mx', `${origin.x}px`);
    veil.style.setProperty('--my', `${origin.y}px`);
    veil.style.webkitMaskImage = veil.style.maskImage =
      `radial-gradient(circle at ${origin.x}px ${origin.y}px, #000 0 calc(var(--front) - 12%), transparent var(--front))`;
    veil.style.webkitMaskSize = veil.style.maskSize = '100% 100%';
    veil.style.webkitMaskRepeat = veil.style.maskRepeat = 'no-repeat';
  }
  requestAnimationFrame(() => {
    veil && veil.classList.add('is-in');
    if (veil) veil.style.setProperty('--front', '150%');
    flip(origin && origin.rect);
  });

  restoreUrl = location.pathname + location.search;
  const next = `${location.pathname}?p=${encodeURIComponent(id)}`;
  if (restoreUrl !== next) history.pushState({ qv: id }, '', next);

  say(`${p.name}, ${fmt(priceOf(p))}. Quick view opened.`);
}

/* dlg.close() FIRES the 'close' event, and Escape closes the dialog natively
   without ever calling this function. So history is unwound in exactly one
   place — the 'close' listener — and this flag tells it when to stay put
   (namely when we are already responding to a popstate). Unwinding in both
   places sends the user two entries back for a single dismissal. */
let suppressHistory = false;

export function close(fromPop) {
  if (!dlg || !dlg.open) return;
  suppressHistory = !!fromPop;
  dlg.close();
}

function onAdd(btn) {
  if (!current) return;
  if (!chosenSize) {
    /* A blocked action must interrupt, not queue politely behind whatever
       confirmation is already in the region. */
    shout('Select a size before adding to bag.');
    const first = dlg.querySelector('.size');
    first && first.focus();
    return;
  }
  addToBag(current.id, chosenSize);
  press(btn);
  burst();                                    // the ONE full-viewport flash
  say(`${current.name}, size ${chosenSize}, added to bag.`);
  close();
  document.dispatchEvent(new CustomEvent('zenji:openDrawer', { detail: 'bag' }));
}

export function init() {
  dlg = $('#quickview');
  if (!dlg) return;

  dlg.addEventListener('click', e => {
    const size = e.target.closest('.size');
    if (size) {
      chosenSize = size.dataset.size;
      dlg.querySelectorAll('.size').forEach(b =>
        b.setAttribute('aria-pressed', String(b === size)));
      return;
    }
    if (e.target.closest('#qvAdd')) return onAdd(e.target.closest('#qvAdd'));
    if (e.target.closest('#qvWish')) {
      const now = toggleWish(current.id);
      e.target.closest('#qvWish').textContent = now ? 'Saved ✓' : 'Save';
      say(now ? 'Saved to wishlist.' : 'Removed from wishlist.');
      return;
    }
    if (e.target.closest('#qvClose')) return close();
    /* Clicking the veil itself closes; clicking the panel does not. */
    if (!e.target.closest('.qv__panel')) close();
  });

  /* The single place history is unwound. Catches programmatic close, a click
     on the veil, and the native Escape key alike. */
  dlg.addEventListener('close', () => {
    const skip = suppressHistory;
    suppressHistory = false;
    current = null;
    if (!skip && history.state && history.state.qv) history.back();
  });

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-quick]');
    if (!trigger) return;
    e.preventDefault();
    const rect = trigger.getBoundingClientRect();
    open(trigger.dataset.quick, {
      x: e.clientX || rect.left + rect.width / 2,
      y: e.clientY || rect.top + rect.height / 2,
      rect
    });
  });

  addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get('p');
    if (id) { if (!dlg.open || !current || current.id !== id) open(id, null); }
    else if (dlg.open) close(true);
  });

  const initial = new URLSearchParams(location.search).get('p');
  if (initial && byId(initial)) open(initial, null);
}
