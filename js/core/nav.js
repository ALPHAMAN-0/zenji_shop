/* nav.js · active link, the mobile sheet, and the ground swap when the flood
   has swallowed the page behind a fixed header. */
import { $, $$, on } from './dom.js';
import { add as rafAdd } from './raf.js';

/* The sheet only exists below this width. It is the 960 rung of the ladder in
   tokens.css, and it must match the media query in layout.css — @media cannot
   read a custom property and there is no build step, so this pair is the one
   place the value is written twice. */
const SHEET_MAX = 959;

export function init() {
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const links = $('.nav__links');
  const off = [];

  /* Mark the current page. Compare FILENAMES, never full hrefs — the site
     lives under /zenji_shop/, so an absolute comparison would never match.
     Two nav links point at the same file (`collection.html` and
     `collection.html#drop`), so the most specific match wins: an exact hash
     match if the URL has one, otherwise only the hash-less link. Marking both
     would tell a screen reader the user is in two places at once.

     The wordmark is in the candidate set because it IS the home link. Without
     it the homepage was the one page where NOTHING was ever marked current:
     no .nav__link points at index.html, so the candidate list came back
     empty. A product page correctly marks nothing — it is not one of the four
     nav destinations, and its breadcrumb carries location instead. */
  const here = location.pathname.split('/').pop() || 'index.html';
  const hash = location.hash;
  const candidates = $$('.nav__link, .wordmark').map(a => {
    const href = a.getAttribute('href') || '';
    const [path, frag] = href.split('#');
    return { a, file: path.split('/').pop() || 'index.html', hash: frag ? '#' + frag : '' };
  }).filter(l => l.file === here);

  const exact = candidates.filter(l => l.hash === hash);
  const chosen = exact.length ? exact : candidates.filter(l => !l.hash);
  chosen.slice(0, 1).forEach(l => l.a.setAttribute('aria-current', 'page'));

  /* --- The mobile sheet ---------------------------------------------------
     Every declaration used to live in a JS string appended with `cssText +=`.
     Three things were wrong with that: the close branch appended '' so
     `position:fixed` and `z-index:89` were never removed (widen past the
     breakpoint after one open and the nav reappeared as a fixed overlay), the
     append grew the declaration list on every toggle, and a hardcoded
     `border-bottom:1px` ignored var(--rule)'s prefers-contrast upgrade.
     It is a class now. The styling belongs to the stylesheet. */
  if (toggle && links) {
    if (!links.id) links.id = 'navLinks';
    toggle.setAttribute('aria-controls', links.id);

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    const setOpen = (openNow, restoreFocus) => {
      toggle.setAttribute('aria-expanded', String(openNow));
      links.classList.toggle('is-open', openNow);
      if (openNow) {
        const first = $('.nav__link', links);
        if (first) first.focus();
      } else if (restoreFocus) {
        toggle.focus();
      }
    };

    off.push(on(toggle, 'click', () => setOpen(!isOpen(), true)));

    off.push(on(document, 'keydown', e => {
      if (e.key === 'Escape' && isOpen()) setOpen(false, true);
    }));

    /* A sheet that stays open after you have navigated is a sheet covering
       the page you asked for. Same-page hash links close it too. */
    off.push(on(links, 'click', e => {
      if (e.target.closest('a') && isOpen()) setOpen(false, false);
    }));

    /* Widening past the breakpoint restores the horizontal nav, so an open
       sheet becomes a stuck overlay with no visible way to dismiss it. */
    const mq = window.matchMedia(`(max-width: ${SHEET_MAX}px)`);
    const onMQ = () => { if (!mq.matches && isOpen()) setOpen(false, false); };
    mq.addEventListener?.('change', onMQ);
    off.push(() => mq.removeEventListener?.('change', onMQ));
  }

  /* --- The ground swap ---------------------------------------------------
     A fixed nav with an opaque paper background sitting over the near-black
     flood section. The CSS rule for this existed from the start and nothing
     ever set the attribute, so it never once fired.

     Offsets are cached at resize, never read inside a frame: raf.js batches
     reads before writes precisely so that no task forces layout mid-frame,
     and the change guard means an idle scroll writes nothing at all. */
  const zone = $('#flood');
  if (nav && zone) {
    let top = 0, bottom = 0, navH = 0;
    const measure = () => {
      const r = zone.getBoundingClientRect();
      top = r.top + window.scrollY;
      bottom = top + zone.offsetHeight;
      navH = nav.offsetHeight;
    };
    measure();
    off.push(on(window, 'resize', measure, { passive: true }));
    off.push(rafAdd({
      /* Reads only the cached numbers and ctx.y. Nothing here touches layout:
         measuring the nav height per frame would be the same forced-reflow
         mistake this loop exists to avoid. */
      read: ctx => (ctx.y + navH >= top && ctx.y < bottom) ? 'inv' : '',
      write: v => { if (v) nav.dataset.ground = v; else delete nav.dataset.ground; }
    }));
  }

  return () => off.forEach(fn => fn && fn());
}
