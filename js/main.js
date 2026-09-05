/* ============================================================================
   main.js · the only <script type="module"> on any page.
   Every import specifier is RELATIVE and carries .js — there is no resolver
   on a static host, so bare or extensionless specifiers simply fail.
   ========================================================================= */
import { observe } from './core/reveal.js';
import * as Nav from './core/nav.js';
import * as MotionToggle from './components/motion-toggle.js';
import * as Hanko from './components/hanko.js';
import * as Card from './components/card.js';
import * as QuickView from './components/quickview.js';
import * as Drawer from './components/drawer.js';
import * as Filter from './components/filter.js';
import * as Preloader from './components/preloader.js';
import * as Hero from './effects/hero.js';
import * as Byobu from './effects/byobu.js';
import * as Flood from './effects/flood.js';
import * as Lookbook from './effects/lookbook.js';
import * as InkBasin from './effects/inkbasin.js';

/* Local hosts only. `?debug` used to work in production, which shipped the
   dev verifier — and its 24 image probes — to real visitors. */
const LOCAL = ['localhost', '127.0.0.1', '[::1]', ''];
const isLocal = () => LOCAL.includes(location.hostname);

/* Every init is guarded INDIVIDUALLY.

   This is not defensive noise. The inline head script has already swapped
   `no-js` -> `js-ready` by the time this runs, so every hidden-until-revealed
   rule is live. If one init throws and takes the rest of boot with it,
   `observe()` never runs, no element ever gets `.is-in`, and roughly a dozen
   `.bleed[data-reveal]` elements render INVISIBLE on a page that otherwise
   looks fine. The `.js-ready` law protects against JS being disabled; it does
   not protect against this file failing.

   A real trigger: a malformed `zenji.v1.bag` value in localStorage parses to a
   non-array, `bag.js` accepts it, and `bagCount()`'s .reduce throws inside
   Drawer.init(). One bad storage key should never blank the page. */
const disposers = [];
function run(name, fn) {
  try {
    const d = fn();
    if (typeof d === 'function') disposers.push(d);
  } catch (err) {
    console.warn(`[zenji] ${name} failed`, err);
  }
}

function boot() {
  /* Reveal FIRST. IntersectionObserver callbacks are async, so everything
     below still completes in this same tick before anything reveals — but if
     any of it throws, the observer is already registered and content appears. */
  run('reveal', observe);

  /* Structure and state. */
  run('nav', Nav.init);
  run('motionToggle', MotionToggle.init);
  run('hanko', Hanko.init);
  run('drawer', Drawer.init);
  run('quickview', QuickView.init);
  run('card', Card.init);
  run('byobu', Byobu.init);
  run('filter', Filter.init);

  /* Then motion. */
  run('hero', Hero.init);
  run('flood', Flood.init);
  run('lookbook', Lookbook.init);
  run('inkBasin', InkBasin.init);

  Preloader.run().catch(() => {});

  if (isLocal()) {
    import('./dev/verify-data.js').then(m => m.run()).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else boot();
