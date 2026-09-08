/* ============================================================================
   hero.js · 一筆 THE FIRST STROKE, and 乾く IT DRIES.
   ----------------------------------------------------------------------------
   hero.mp4 is 3.0 MB. It is explicitly OUTSIDE the critical path: the poster
   paints first, and the video element is only constructed once the page is
   idle, the connection is not metered or slow, and motion is not reduced.
   A <video> with a wrong src fails SILENTLY — no error, the poster just sits
   there forever — so the load is verified rather than assumed.
   ========================================================================= */
import { $ } from '../core/dom.js';
import { add, q, progress } from '../core/raf.js';
import { reduced } from '../core/motion.js';

/* Resolved against this MODULE's own URL, not the document's. js/effects/ is a
   fixed location, so ../../ is always the repo root regardless of how deep the
   page importing it sits — and <video> fails SILENTLY on a bad src, so a
   document-relative string here would break with no error at all. */
const SRC = new URL('../../image/hero.mp4', import.meta.url).href;
const POSTER = new URL('../../image/hero-poster.webp', import.meta.url).href;

function cheapConnection() {
  const c = navigator.connection;
  if (!c) return false;
  if (c.saveData) return true;
  return ['slow-2g', '2g', '3g'].includes(c.effectiveType);
}

function mountVideo(host, poster) {
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true;
  v.loop = true; v.playsInline = true; v.autoplay = true;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  v.setAttribute('aria-hidden', 'true');
  v.preload = 'auto';
  v.poster = POSTER;
  v.width = 1920; v.height = 1080;
  v.src = SRC;

  v.addEventListener('canplay', () => {
    poster && poster.remove();
    host.append(v);
    /* Ease the footage up to speed instead of cutting to full rate. */
    v.playbackRate = 0.55;
    v.play().catch(() => {});
    const ramp = setInterval(() => {
      v.playbackRate = Math.min(1, v.playbackRate + 0.06);
      if (v.playbackRate >= 1) clearInterval(ramp);
    }, 90);
  }, { once: true });

  v.addEventListener('error', () => { /* poster stays; nothing breaks */ }, { once: true });
  return v;
}

export function init() {
  const host = $('#heroMedia');
  const hero = document.querySelector('.hero');
  if (!host || !hero) return;
  const poster = $('#heroPoster');

  /* --- the load stroke -------------------------------------------------
     This runs on the frame AFTER the plate has been removed — js/main.js does
     not call init() until the curtain promise settles. It is the first time
     一筆 THE FIRST STROKE has ever been visible to a first-time visitor. */
  requestAnimationFrame(() => host.classList.add('is-in'));

  /* Once the stroke has landed, DROP the transition.

     .bleed transitions --front AND --tail over --d-bleed, and --tail is
     scroll-driven: every quantized step retargets a fresh 900ms eased
     transition roughly 40ms after the last one started, so 乾く never reaches
     its target while you are actually scrolling and the ink lags the wheel by
     up to a full --d-bleed. Measured: one instantaneous scrollTo produced a
     transitionstart at 2624ms and its transitionend at 3524ms.

     The arrival wants the transition; the scroll wants none. So the element
     keeps it for exactly one bleed and then gives it up, and 乾く tracks the
     wheel frame for frame. transitionend is guarded on the property because
     .bleed animates two, and netted with a timer because a bleed that is
     off-screen or never painted emits nothing at all. */
  let armed = true;
  const settle = () => {
    if (!armed) return;
    armed = false;
    host.style.transition = 'none';
  };
  host.addEventListener('transitionend', e => {
    if (e.target === host && e.propertyName === '--front') settle();
  });
  setTimeout(settle, (parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--d-bleed')) || 900) * 2);

  /* --- the video, deferred --------------------------------------------- */
  let video = null;
  if (!reduced() && !cheapConnection()) {
    const start = () => { video = mountVideo(host, poster); };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2400 });
    else setTimeout(start, 1200);
  }

  /* --- 乾く the dry-out -------------------------------------------------
     One scroll progress value drives four registered properties. --tail is
     quantized to 1/24 and the filter to 1/12, so a 900px scroll requests a
     couple of dozen repaints instead of nine hundred. */
  let paused = false;
  add({
    read(ctx) {
      const h = hero.offsetHeight || ctx.vh;
      const p = progress(ctx.y, 0, h * 0.92);
      return `${q(p, 24)}|${q(p, 12)}`;
    },
    write(key) {
      const [tailQ, filmQ] = key.split('|').map(Number);
      host.style.setProperty('--tail', `${(tailQ * 64).toFixed(2)}%`);

      /* 乾く, made literal: the COVER DRIES INTO THE PAGE.

         The hero arrives in full colour — the marigold tee, the sumi-e
         portrait, the laneway — and desaturates to the site's ink-on-paper
         palette as you scroll into the shop. A tankōbon is monochrome pages
         and a colour cover; this is the seam between them, and it is the one
         place on the site where you can watch the palette law being applied
         instead of being told about it.

         The dead zone below 0.10 means the top of the page is unambiguously
         in colour rather than merely nearly so — a hero that starts drying on
         the first pixel of scroll reads as a bug, not a decision. It is the
         SAME quantized 1/12 key that already drove contrast and brightness,
         so this is one extra channel on an existing task: no new loop, no new
         read, no new listener. --v-dry replaces --v-sep, which was consumed in
         sections.css and produced NOWHERE — the only var() in the stylesheet
         with no writer anywhere in the codebase. */
      const dry = Math.min(1, Math.max(0, (filmQ - 0.10) / 0.55));
      hero.style.setProperty('--v-dry', dry.toFixed(3));
      hero.style.setProperty('--v-con', (1.06 + dry * 0.62).toFixed(3));
      hero.style.setProperty('--v-bri', (1 - dry * 0.20).toFixed(3));

      /* Hysteresis: pause at 0.72, resume at 0.68, so a jitter around the
         boundary never thrashes play/pause. */
      if (video) {
        if (!paused && tailQ > 0.72) { paused = true; video.pause(); }
        else if (paused && tailQ < 0.68) { paused = false; video.play().catch(() => {}); }
      }
    }
  });
}
