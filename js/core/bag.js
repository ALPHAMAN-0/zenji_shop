/* bag.js · cart + wishlist state. localStorage via store.js, versioned. */
import { read, write } from './store.js';
import { byId, priceOf } from '../data/products.js';

const subs = new Set();
let bag = read('bag', []);            // [{id, size, qty}]
let wish = read('wish', []);          // [id]

const persist = () => { write('bag', bag); write('wish', wish); notify(); };
const notify = () => { for (const fn of subs) fn(); };
export const subscribe = fn => { subs.add(fn); return () => subs.delete(fn); };

export const getBag = () => bag.map(l => ({ ...l, product: byId(l.id) })).filter(l => l.product);
export const getWish = () => wish.map(byId).filter(Boolean);

export const bagCount = () => bag.reduce((n, l) => n + l.qty, 0);
export const wishCount = () => wish.length;
export const bagTotal = () =>
  getBag().reduce((sum, l) => sum + priceOf(l.product) * l.qty, 0);

export function addToBag(id, size, qty = 1) {
  if (!byId(id)) return false;
  const line = bag.find(l => l.id === id && l.size === size);
  if (line) line.qty = Math.min(99, line.qty + qty);
  else bag.push({ id, size, qty });
  persist();
  return true;
}

export function setQty(id, size, qty) {
  const i = bag.findIndex(l => l.id === id && l.size === size);
  if (i < 0) return;
  if (qty <= 0) bag.splice(i, 1);
  else bag[i].qty = Math.min(99, qty);
  persist();
}

export function removeLine(id, size) { setQty(id, size, 0); }

export function toggleWish(id) {
  if (!byId(id)) return false;
  const i = wish.indexOf(id);
  if (i < 0) wish.push(id); else wish.splice(i, 1);
  persist();
  return i < 0;
}
export const inWish = id => wish.includes(id);
