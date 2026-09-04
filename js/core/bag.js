/* bag.js · cart + wishlist state. localStorage via store.js, versioned. */
import { read, write, onExternalChange } from './store.js';
import { byId, priceOf, SIZES } from '../data/products.js';

const subs = new Set();

/* --- Sanitising on the way in ---------------------------------------------
   store.js JSON.parses whatever is in localStorage without validating it, and
   this module used to accept the result as-is. A hand-edited or corrupted
   `zenji.v1.bag` that parsed to a non-array made bagCount()'s .reduce throw
   inside Drawer.init() — which, before main.js was hardened, took the whole
   boot with it and rendered a dozen elements invisible. Storage is untrusted
   input; so is another tab. */
const sanitizeBag = v => Array.isArray(v)
  ? v.filter(l => l && typeof l.id === 'string' && SIZES.includes(l.size)
                    && Number.isFinite(l.qty) && l.qty > 0)
     .map(l => ({ id: l.id, size: l.size, qty: Math.min(99, Math.floor(l.qty)) }))
  : [];
const sanitizeWish = v => Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];

let bag = sanitizeBag(read('bag', []));    // [{id, size, qty}]
let wish = sanitizeWish(read('wish', [])); // [id]

/* Subscribers receive a change descriptor. It is what lets the drawer patch a
   single quantity in place instead of rebuilding its whole subtree and
   throwing away the focused button. Existing zero-argument subscribers keep
   working unchanged. */
const notify = change => { for (const fn of subs) fn(change); };
const persist = change => { write('bag', bag); write('wish', wish); notify(change); };
export const subscribe = fn => { subs.add(fn); return () => subs.delete(fn); };

onExternalChange((key, value) => {
  if (key === 'bag') bag = sanitizeBag(value ?? []);
  else if (key === 'wish') wish = sanitizeWish(value ?? []);
  else return;
  notify({ type: 'external' });   /* notify WITHOUT writing back */
});

export const getBag = () => bag.map(l => ({ ...l, product: byId(l.id) })).filter(l => l.product);
export const getWish = () => wish.map(byId).filter(Boolean);

/* Counts the SAME lines the drawer renders. This used to reduce the raw
   array while getBag() and bagTotal() used the hydrated, filtered one — so
   removing a product from products.js made the header badge say 2 while the
   drawer showed 1, and the subtotal agreed with neither. */
export const bagCount = () => getBag().reduce((n, l) => n + l.qty, 0);
export const wishCount = () => wish.length;
export const bagTotal = () =>
  getBag().reduce((sum, l) => sum + priceOf(l.product) * l.qty, 0);

export function addToBag(id, size, qty = 1) {
  /* The size was never validated — only the product id was. */
  if (!byId(id) || !SIZES.includes(size)) return false;
  const line = bag.find(l => l.id === id && l.size === size);
  if (line) line.qty = Math.min(99, line.qty + qty);
  else bag.push({ id, size, qty });
  persist({ type: line ? 'qty' : 'add', id, size, qty: (line || { qty }).qty });
  return true;
}

export function setQty(id, size, qty) {
  const i = bag.findIndex(l => l.id === id && l.size === size);
  if (i < 0) return;
  if (qty <= 0) { bag.splice(i, 1); persist({ type: 'remove', id, size }); return; }
  bag[i].qty = Math.min(99, qty);
  persist({ type: 'qty', id, size, qty: bag[i].qty });
}

export function removeLine(id, size) { setQty(id, size, 0); }

export function toggleWish(id) {
  if (!byId(id)) return false;
  const i = wish.indexOf(id);
  if (i < 0) wish.push(id); else wish.splice(i, 1);
  persist({ type: 'wish', id, on: i < 0 });
  return i < 0;
}
export const inWish = id => wish.includes(id);
