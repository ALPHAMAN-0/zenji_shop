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

/* If the plate's promise never settles, nothing would ever be revealed and
   every [data-reveal] element would sit at --front: 0% — invisible, on a page
   that otherwise looks fine. That is the same class of catastrophic-and-silent
   failure the .js-ready law exists for, so the curtain call is RACED against a
   net rather than trusted. The net is deliberately far past the plate's own
   2200ms cap: it is an emergency exit, not a second schedule. */
const CURTAIN_NET = 3000;

function boot() {
  /* Structure and state. None of this ARRIVES — it is either already on the
     page or it is a listener — so it runs immediately, under the plate. */
  run('nav', Nav.init);
  run('motionToggle', MotionToggle.init);
  run('hanko', Hanko.init);
  run('drawer', Drawer.init);
  run('quickview', QuickView.init);
  run('card', Card.init);
  run('byobu', Byobu.init);
  run('filter', Filter.init);
  run('flood', Flood.init);
  run('lookbook', Lookbook.init);
  run('inkBasin', InkBasin.init);

  /* THE STAGE. Everything that ARRIVES waits for the paper to leave.

     This ordering is the whole fix for the site's oldest bug: reveal and hero
     used to run here, at boot, and Preloader.run()'s promise — the only
     "stage is clear" signal in the codebase — was called last and thrown away.
     Measured on a cold load, 一筆 THE FIRST STROKE and all three headline words
     finished between 967ms and 1268ms behind a plate that did not clear until
     2245ms. The signature moment of the site played, in full, to nobody, on
     every first visit. It resolves instantly for repeat and reduced-motion
     visitors (preloader.js returns Promise.resolve()), so they lose nothing. */
  const curtain = Promise.race([
    Preloader.run().catch(() => {}),
    new Promise(r => setTimeout(r, CURTAIN_NET))
  ]);

  curtain.then(() => {
    /* Reveal FIRST, and in its own try/catch: if Hero.init() throws, the
       observer is already registered and the content still appears. */
    run('reveal', observe);
    run('hero', Hero.init);
  });

  if (isLocal()) {
    import('./dev/verify-data.js').then(m => m.run()).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else boot();
