/* nav.js · active link, mobile sheet, and the ground swap when the flood
   has swallowed the page behind a fixed header. */
import { $, $$, on } from './dom.js';

export function init() {
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const links = $('.nav__links');

  /* Mark the current page. Compare FILENAMES, never full hrefs — the site
     lives under /zenji_shop/, so an absolute comparison would never match.
     Two nav links point at the same file (`collection.html` and
     `collection.html#drop`), so the most specific match wins: an exact hash
     match if the URL has one, otherwise only the hash-less link. Marking both
     would tell a screen reader the user is in two places at once. */
  const here = location.pathname.split('/').pop() || 'index.html';
  const hash = location.hash;
  const candidates = $$('.nav__link').map(a => {
    const href = a.getAttribute('href') || '';
    const [path, frag] = href.split('#');
    return { a, file: path.split('/').pop() || 'index.html', hash: frag ? '#' + frag : '' };
  }).filter(l => l.file === here);

  const exact = candidates.filter(l => l.hash === hash);
  const chosen = exact.length ? exact : candidates.filter(l => !l.hash);
  chosen.slice(0, 1).forEach(l => l.a.setAttribute('aria-current', 'page'));

  if (toggle && links) {
    on(toggle, 'click', () => {
      const openNow = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(openNow));
      links.style.display = openNow ? 'flex' : '';
      links.style.cssText += openNow
        ? ';position:fixed;inset:var(--header-h) 0 auto 0;flex-direction:column;gap:0;background:var(--washi);padding:1rem var(--gutter) 1.5rem;border-bottom:1px solid var(--sumi-12);z-index:89'
        : '';
    });
    on(document, 'keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    });
  }

  return nav;
}
