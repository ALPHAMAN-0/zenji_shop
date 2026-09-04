/* ============================================================================
   drawer.js · bag + wishlist. Two panes, one <dialog>.
   iOS scroll lock uses the fixed-body technique, never body{overflow:hidden},
   which iOS Safari simply ignores.
   ========================================================================= */
import { $, $$, el, say } from '../core/dom.js';

/* Resolved against this MODULE's own URL, not the document's. js/components/ is
   a fixed location, so ../../ is always the repo root regardless of how deep
   the page importing it sits. A bare 'collection.html' 404s from anywhere but
   the root, and it only shows up when the bag is empty. */
const COLLECTION = new URL('../../collection.html', import.meta.url).href;
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
  return el('div.line', { 'data-line': `${p.id}|${l.size}`, style: `--plate:${p.front.plate}` },
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
  return el('div.line', { 'data-line': p.id, style: `--plate:${p.front.plate}` },
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
            el('a.hanko', { href: COLLECTION }, 'Shop the Drop →'))])
    : (wish.length ? wish.map(wishCard)
        : [el('div.empty', el('p.mono', {}, 'Nothing saved yet.'),
            el('a.hanko', { href: COLLECTION }, 'Browse the Drop →'))]);

  dlg.replaceChildren(el('div.drawer',
    el('div.drawer__head',
      /* role="tab" with no tabpanel, no aria-controls and no roving tabindex
         is a tablist that announces itself as one and then behaves like two
         unrelated buttons. */
      el('div.drawer__tabs', { role: 'tablist', 'aria-label': 'Bag and wishlist' },
        el('button.drawer__tab', { type: 'button', role: 'tab', id: 'tabBag',
          'aria-controls': 'paneDrawer', 'data-pane': 'bag',
          'aria-selected': String(isBag), tabindex: isBag ? '0' : '-1' },
          `Bag (${Bag.bagCount()})`),
        el('button.drawer__tab', { type: 'button', role: 'tab', id: 'tabWish',
          'aria-controls': 'paneDrawer', 'data-pane': 'wishlist',
          'aria-selected': String(!isBag), tabindex: isBag ? '-1' : '0' },
          `Saved (${Bag.wishCount()})`)),
      el('button.icon-btn', { type: 'button', 'data-close': true, 'aria-label': 'Close' },
        el('span', { 'aria-hidden': 'true', style: 'font-size:20px;line-height:1' }, '×'))),
    /* tabindex="0" is not decoration: .drawer__body is overflow:auto, so
       without it the list cannot be scrolled with the keyboard at all. */
    el('div.drawer__body', {
      id: 'paneDrawer', role: 'tabpanel', tabindex: '0',
      'aria-labelledby': isBag ? 'tabBag' : 'tabWish', 'data-scroller': true
    }, body),
    isBag && lines.length ? el('div.drawer__foot',
      el('div.card__row', { style: 'justify-content:space-between;margin-bottom:.9rem' },
        el('span.micro', {}, 'Subtotal'),
        el('span.price', { style: 'font-size:var(--t-md)' }, fmt(Bag.bagTotal()))),
      el('p.micro', { style: 'color:var(--ink-2);margin-bottom:.9rem' },
        Bag.bagTotal() >= 100 ? '✓ Free shipping unlocked' : `Free shipping over ${CURRENCY}100`),
      /* aria-disabled, not disabled: a disabled button is not focusable, so
         #ckNote was unreachable and the explanation for why Checkout does
         nothing could never be read. And no [data-hanko] — a press animation
         on a dead control is a lie about what just happened. */
      el('button.hanko', { type: 'button', style: 'width:100%',
        'aria-disabled': 'true', 'aria-describedby': 'ckNote' }, 'Checkout'),
      el('p.micro', { id: 'ckNote', style: 'margin-top:.7rem;color:var(--ink-2)' },
        'Demo storefront — checkout is not connected.')) : null));
}

export function open(which = 'bag') {
  if (!dlg) return;
  pane = which;
  /* Re-open guard: a second lock() would read window.scrollY while the body
     is already fixed — i.e. 0 — and lose the user's scroll position. */
  if (dlg.open) { render(); return; }
  lock();
  /* Render BEFORE showModal, matching quickview.js. The other order focused
     an empty dialog, so focus landed on the dialog element rather than the
     selected tab. With content present, native <dialog> focuses the first
     focusable descendant, so no manual .focus() is needed.

     No say() either: "Bag and wishlist, dialog" followed by "Bag (2), tab,
     selected, 1 of 2" is more accurate than a live-region duplicate. */
  render();
  dlg.showModal();
}

/* --- Keeping focus across a re-render --------------------------------------
   THE bug this exists for: every bag mutation ran a full replaceChildren, so
   the +/- button you had just activated was destroyed and focus fell to
   <body>. A keyboard user could not increment twice — the second press went
   nowhere, because there was nothing focused to press.

   Two mechanisms, because the two cases genuinely want different behaviour:

   1. A quantity change must not move focus AT ALL. Nothing structural
      changes, so patch the three things that did change and leave the DOM
      identity alone. No blur, no re-announcement, no lost virtual cursor.

   2. Anything structural — add, remove, pane switch, a change from another
      tab — does a full render, and then puts focus back by stable selector.
      On a remove, focus is SUPPOSED to leave the destroyed button, so a full
      render there is not a bug; it is the right moment to place focus
      deliberately.

   The change payload from bag.js is what tells the two apart. */
const FOCUS_KEYS = ['data-q', 'data-rm', 'data-quick', 'data-unwish', 'data-pane', 'data-close'];

function focusKey(node) {
  for (const k of FOCUS_KEYS) {
    if (!node.hasAttribute(k)) continue;
    let sel = `[${k}="${CSS.escape(node.getAttribute(k))}"]`;
    for (const extra of ['data-id', 'data-size']) {
      if (node.hasAttribute(extra)) sel += `[${extra}="${CSS.escape(node.getAttribute(extra))}"]`;
    }
    return sel;
  }
  return null;
}

/* Returns false whenever an assumption fails, so the caller falls through to
   a full render rather than leaving a stale row on screen. */
function patchQty({ id, size, qty }) {
  if (pane !== 'bag') return false;
  const row = dlg.querySelector(`[data-line="${CSS.escape(id + '|' + size)}"]`);
  if (!row) return false;
  const out = row.querySelector('output');
  if (!out) return false;

  /* <output> is implicitly role="status", so the new quantity announces
     itself. Deliberately no say() here — that would double-speak. */
  out.textContent = String(qty);

  const plus = row.querySelector('[data-q="1"]');
  const minus = row.querySelector('[data-q="-1"]');
  const name = row.querySelector('.card__name')?.textContent || 'item';
  if (plus) {
    const capped = qty >= 99;
    plus.setAttribute('aria-disabled', String(capped));
    if (capped) say('Maximum quantity, 99.');
  }
  /* Announce destruction BEFORE activation: at qty 1 the minus button removes
     the line, and its name should say so while it still can. */
  if (minus) minus.setAttribute('aria-label', qty === 1
    ? `Remove ${name} size ${size} from bag`
    : `Decrease quantity of ${name} size ${size}`);

  patchTotals();
  return true;
}

function patchTotals() {
  const sub = dlg.querySelector('.drawer__foot .price');
  if (sub) sub.textContent = fmt(Bag.bagTotal());
  const note = dlg.querySelector('.drawer__foot .micro:not(#ckNote)');
  if (note) note.textContent = Bag.bagTotal() >= 100
    ? '\u2713 Free shipping unlocked' : `Free shipping over ${CURRENCY}100`;
  const tabBag = dlg.querySelector('#tabBag');
  if (tabBag) tabBag.textContent = `Bag (${Bag.bagCount()})`;
  const tabWish = dlg.querySelector('#tabWish');
  if (tabWish) tabWish.textContent = `Saved (${Bag.wishCount()})`;
}

function renderPreservingFocus() {
  const body = dlg.querySelector('.drawer__body');
  const scroll = body ? body.scrollTop : 0;
  const active = document.activeElement;
  const key = active && dlg.contains(active) ? focusKey(active) : null;
  const emptyBefore = !dlg.querySelector('[data-line]');

  render();

  const nb = dlg.querySelector('.drawer__body');
  if (nb) nb.scrollTop = scroll;          /* or the list jumps to the top */

  const target = (key && dlg.querySelector(key))
    || dlg.querySelector('[data-rm]')     /* the row that took its place */
    || dlg.querySelector('.drawer__tab[aria-selected="true"]');
  /* preventScroll so restoring focus cannot fight the restored scrollTop. */
  target?.focus({ preventScroll: true });

  if (!emptyBefore && !dlg.querySelector('[data-line]')) {
    say(pane === 'bag' ? 'Bag is empty.' : 'Nothing saved.');
  }
}

export function init() {
  dlg = $('#drawer');
  if (!dlg) return;

  dlg.addEventListener('close', unlock);
  dlg.addEventListener('cancel', () => { /* native Esc; close handler unlocks */ });

  dlg.addEventListener('click', e => {
    const t = e.target;
    /* aria-disabled elements are focusable and clickable by design, so the
       handler is what has to refuse. */
    if (t.closest('[aria-disabled="true"]')) { e.preventDefault(); return; }
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

  /* One delegated keydown on the dialog. Per-node listeners would be
     destroyed by every replaceChildren; this survives. Selection follows
     focus because switching panes is instant local work, not a fetch. */
  dlg.addEventListener('keydown', e => {
    const tab = e.target.closest?.('[role="tab"]');
    if (!tab) return;
    const tabs = $$('[role="tab"]', dlg);
    const i = tabs.indexOf(tab);
    let n = -1;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': n = (i + 1) % tabs.length; break;
      case 'ArrowLeft':  case 'ArrowUp':   n = (i - 1 + tabs.length) % tabs.length; break;
      case 'Home': n = 0; break;
      case 'End':  n = tabs.length - 1; break;
      default: return;
    }
    e.preventDefault();
    pane = tabs[n].dataset.pane;
    render();
    dlg.querySelector(`[data-pane="${pane}"]`)?.focus();
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) open(b.dataset.open);
  });
  document.addEventListener('zenji:openDrawer', e => open(e.detail || 'bag'));

  Bag.subscribe(change => {
    counts();
    if (!dlg.open) return;
    /* A quantity change patches in place and returns early, so focus is never
       touched. Everything else re-renders and restores focus by key. */
    if (change && change.type === 'qty' && patchQty(change)) return;
    renderPreservingFocus();
  });
  counts();
}

function counts() {
  $$('[data-count]').forEach(n => {
    const v = n.dataset.count === 'bag' ? Bag.bagCount() : Bag.wishCount();
    n.dataset.n = String(v);
    n.textContent = String(v);
  });
}
