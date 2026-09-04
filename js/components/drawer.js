/* ============================================================================
   drawer.js · bag + wishlist. Two panes, one <dialog>.
   iOS scroll lock uses the fixed-body technique, never body{overflow:hidden},
   which iOS Safari simply ignores.
   ========================================================================= */
import { $, $$, el, say } from '../core/dom.js';
import { fmt, priceOf, CURRENCY } from '../data/products.js';
import * as Bag from '../core/bag.js';

let dlg, pane = 'bag', lockY = 0;

function lock() {
  lockY = window.scrollY;
  document.body.style.cssText += `position:fixed;top:${-lockY}px;left:0;right:0;width:100%`;
}
function unlock() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, lockY);
}

function line(l) {
  const p = l.product;
  return el('div.line', { style: `--plate:${p.front.plate}` },
    el('img.line__thumb', {
      src: p.front.src, width: p.front.w, height: p.front.h, alt: '',
      loading: 'lazy', decoding: 'async', style: `object-position:${p.front.pos}`
    }),
    el('div.line__mid',
      el('span.card__name', { style: 'font-size:var(--t-base)' }, p.name),
      el('span.micro', {}, `${p.colorway.name} · Size ${l.size}`),
      el('span.price', {}, fmt(priceOf(p)))),
    el('div', { style: 'display:flex;flex-direction:column;align-items:flex-end;gap:.5rem' },
      el('div.qty',
        el('button', { type: 'button', 'data-q': '-1', 'data-id': p.id, 'data-size': l.size,
                       'aria-label': `Decrease quantity of ${p.name} size ${l.size}` }, '–'),
        el('output', { 'aria-label': 'Quantity' }, String(l.qty)),
        el('button', { type: 'button', 'data-q': '1', 'data-id': p.id, 'data-size': l.size,
                       'aria-label': `Increase quantity of ${p.name} size ${l.size}` }, '+')),
      el('button.micro', { type: 'button', 'data-rm': p.id, 'data-size': l.size,
                           style: 'color:var(--alert-ink)' }, 'Remove')));
}

function wishCard(p) {
  return el('div.line', { style: `--plate:${p.front.plate}` },
    el('img.line__thumb', {
      src: p.front.src, width: p.front.w, height: p.front.h, alt: '',
      loading: 'lazy', decoding: 'async', style: `object-position:${p.front.pos}`
    }),
    el('div.line__mid',
      el('span.card__name', { style: 'font-size:var(--t-base)' }, p.name),
      el('span.micro', {}, p.colorway.name),
      el('span.price', {}, fmt(priceOf(p)))),
    el('div', { style: 'display:flex;flex-direction:column;gap:.4rem;align-items:flex-end' },
      el('button.micro', { type: 'button', 'data-quick': p.id }, '[ View → ]'),
      el('button.micro', { type: 'button', 'data-unwish': p.id, style: 'color:var(--alert-ink)' }, 'Remove')));
}

function render() {
  if (!dlg || !dlg.open) return;
  const lines = Bag.getBag();
  const wish = Bag.getWish();
  const isBag = pane === 'bag';
  const body = isBag
    ? (lines.length ? lines.map(line)
        : [el('div.empty', el('p.mono', {}, 'Your bag is empty.'),
            el('a.hanko', { href: 'collection.html' }, 'Shop the Drop →'))])
    : (wish.length ? wish.map(wishCard)
        : [el('div.empty', el('p.mono', {}, 'Nothing saved yet.'),
            el('a.hanko', { href: 'collection.html' }, 'Browse the Drop →'))]);

  dlg.replaceChildren(el('div.drawer',
    el('div.drawer__head',
      el('div.drawer__tabs', { role: 'tablist' },
        el('button.drawer__tab', { type: 'button', role: 'tab', 'data-pane': 'bag',
          'aria-selected': String(isBag) }, `Bag (${Bag.bagCount()})`),
        el('button.drawer__tab', { type: 'button', role: 'tab', 'data-pane': 'wishlist',
          'aria-selected': String(!isBag) }, `Saved (${Bag.wishCount()})`)),
      el('button.icon-btn', { type: 'button', 'data-close': true, 'aria-label': 'Close' },
        el('span', { 'aria-hidden': 'true', style: 'font-size:20px;line-height:1' }, '×'))),
    el('div.drawer__body', { 'data-scroller': true }, body),
    isBag && lines.length ? el('div.drawer__foot',
      el('div.card__row', { style: 'justify-content:space-between;margin-bottom:.9rem' },
        el('span.micro', {}, 'Subtotal'),
        el('span.price', { style: 'font-size:var(--t-md)' }, fmt(Bag.bagTotal()))),
      el('p.micro', { style: 'color:var(--sumi-wash);margin-bottom:.9rem' },
        Bag.bagTotal() >= 100 ? '✓ Free shipping unlocked' : `Free shipping over ${CURRENCY}100`),
      el('button.hanko', { type: 'button', 'data-hanko': true, style: 'width:100%',
        disabled: true, 'aria-describedby': 'ckNote' }, 'Checkout'),
      el('p.micro', { id: 'ckNote', style: 'margin-top:.7rem;color:var(--sumi-wash)' },
        'Demo storefront — checkout is not connected.')) : null));
}

export function open(which = 'bag') {
  if (!dlg) return;
  pane = which;
  lock();
  dlg.showModal();
  render();
  const n = which === 'bag' ? Bag.bagCount() : Bag.wishCount();
  const noun = which === 'bag' ? 'Bag' : 'Wishlist';
  say(`${noun}, ${n} ${n === 1 ? 'item' : 'items'}.`);
}

export function init() {
  dlg = $('#drawer');
  if (!dlg) return;

  dlg.addEventListener('close', unlock);
  dlg.addEventListener('cancel', () => { /* native Esc; close handler unlocks */ });

  dlg.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]')) return dlg.close();
    const tab = t.closest('[data-pane]');
    if (tab) { pane = tab.dataset.pane; render(); return; }
    const q = t.closest('[data-q]');
    if (q) {
      const cur = Bag.getBag().find(l => l.id === q.dataset.id && l.size === q.dataset.size);
      if (cur) Bag.setQty(q.dataset.id, q.dataset.size, cur.qty + Number(q.dataset.q));
      return;
    }
    const rm = t.closest('[data-rm]');
    if (rm) { Bag.removeLine(rm.dataset.rm, rm.dataset.size); say('Removed from bag.'); return; }
    const un = t.closest('[data-unwish]');
    if (un) { Bag.toggleWish(un.dataset.unwish); say('Removed from wishlist.'); return; }
    if (t.closest('[data-quick]')) dlg.close();
    if (!t.closest('.drawer')) dlg.close();
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) open(b.dataset.open);
  });
  document.addEventListener('zenji:openDrawer', e => open(e.detail || 'bag'));

  Bag.subscribe(() => { render(); counts(); });
  counts();
}

function counts() {
  $$('[data-count]').forEach(n => {
    const v = n.dataset.count === 'bag' ? Bag.bagCount() : Bag.wishCount();
    n.dataset.n = String(v);
    n.textContent = String(v);
  });
}
