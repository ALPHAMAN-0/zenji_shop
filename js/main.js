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
import * as Marquee from './components/marquee.js';
import * as QuickView from './components/quickview.js';
import * as Drawer from './components/drawer.js';
import * as Filter from './components/filter.js';
import * as Preloader from './components/preloader.js';
import * as Hero from './effects/hero.js';
import * as Byobu from './effects/byobu.js';
import * as Flood from './effects/flood.js';
import * as Lookbook from './effects/lookbook.js';
import * as InkBasin from './effects/inkbasin.js';

function boot() {
  /* Structure and state first: these must work even if an effect throws. */
  Nav.init();
  MotionToggle.init();
  Hanko.init();
  Drawer.init();
  QuickView.init();
  Card.init();
  Byobu.init();
  Filter.init();

  /* Then motion. Each is independently guarded so one failure cannot cascade
     into a page that renders but never reveals. */
  for (const [name, fn] of Object.entries({
    marquee: Marquee.init, hero: Hero.init, flood: Flood.init,
    lookbook: Lookbook.init, inkBasin: InkBasin.init
  })) {
    try { fn(); } catch (err) { console.warn(`[zenji] ${name} failed`, err); }
  }

  observe();

  Preloader.run().catch(() => {});

  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      || new URLSearchParams(location.search).has('debug')) {
    import('./dev/verify-data.js').then(m => m.run()).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else boot();
