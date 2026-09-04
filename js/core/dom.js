/* dom.js · our only "library". ~40 lines, and it stays that way. */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const on = (node, type, fn, opts) => {
  if (!node) return () => {};
  node.addEventListener(type, fn, opts);
  return () => node.removeEventListener(type, fn, opts);
};

/**
 * el('div.card', {'aria-label':'x'}, child, child)
 * el('div.card', child, child)                      <- attrs may be omitted
 *
 * The second argument is only treated as an attribute map when it is a PLAIN
 * object. Without that check, `el('div', el('p'), el('h2'))` silently swallows
 * its first child as attrs and drops it from the DOM — a failure that throws
 * nothing and is invisible until something you never rendered is missing.
 */
function isAttrs(v) {
  return v != null && typeof v === 'object' && !v.nodeType && !Array.isArray(v);
}

export function el(spec, attrs, ...kids) {
  if (!isAttrs(attrs)) { if (attrs !== undefined) kids.unshift(attrs); attrs = null; }
  const [tag, ...classes] = String(spec).split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Announce to screen readers without stealing focus. */
let liveRegion = null;
export function say(msg) {
  liveRegion ||= $('#live');
  if (!liveRegion) return;
  liveRegion.textContent = '';
  // A frame's gap guarantees repeat messages are re-announced.
  requestAnimationFrame(() => { liveRegion.textContent = msg; });
}
