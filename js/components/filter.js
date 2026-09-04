/* filter.js · collection filter. Uses the `hidden` attribute rather than a
   display rule, so the accessibility tree and the layout agree, and announces
   the result count because a silently changing grid is invisible to AT. */
import { $, $$, say } from '../core/dom.js';
import { byId } from '../data/products.js';

export function init() {
  const grid = $('#collectionGrid');
  const count = $('#filterCount');
  if (!grid) return;

  const buttons = $$('[data-filter]');
  const cards = $$('.card', grid);

  function apply(mode) {
    let shown = 0;
    for (const card of cards) {
      const p = byId(card.dataset.id);
      const keep = mode === 'all' || (mode === 'sale' ? !!(p && p.onSale) : !(p && p.onSale));
      card.hidden = !keep;
      if (keep) shown++;
    }
    if (count) count.textContent = `${shown} / ${cards.length}`;
    say(`${shown} of ${cards.length} products shown.`);
  }

  for (const b of buttons) {
    b.addEventListener('click', () => {
      buttons.forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      apply(b.dataset.filter);
    });
  }
}
