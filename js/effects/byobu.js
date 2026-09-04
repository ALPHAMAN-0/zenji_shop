/* byobu.js · 屏風. The unfold itself is pure CSS driven by .is-in, which the
   shared reveal observer adds. This module exists only to stagger the leaves
   so they open in reading order rather than all at once. */
import { $$ } from '../core/dom.js';

export function init(root = document) {
  $$('.byobu .leaf', root).forEach((leaf, i) => {
    leaf.style.setProperty('--i', String(i));
    leaf.style.setProperty('--s', 'var(--s-card)');
  });
}
