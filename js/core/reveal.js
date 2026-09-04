/* ============================================================================
   reveal.js · THE single reveal IntersectionObserver.
   ----------------------------------------------------------------------------
   Animating a mask is a REPAINT, not a composite — it cannot be handed to the
   compositor. Ten elements bleeding at once on a mid-range Android drops the
   page to 30fps. So this is a QUEUE with a hard concurrency cap, not a
   convention that reviewers are asked to remember.

   Weights: an ordinary element costs 1, a full-bleed surface costs 2, and no
   more than 2 full-bleed surfaces may ever run together.
   ========================================================================= */
import { reduced } from './motion.js';

const CAP = 6;
const queue = [];
let load = 0;
let heavyLoad = 0;

function weightOf(node) { return node.hasAttribute('data-heavy') ? 2 : 1; }

function start(node) {
  const w = weightOf(node);
  load += w;
  if (w === 2) heavyLoad += 1;
  node.classList.add('is-in');

  // Release the slot when the bleed finishes. transitionend on a registered
  // custom property fires reliably; the timeout is the net for the case where
  // the element was never actually painted (off-screen, display:none, etc).
  let done = false;
  const release = () => {
    if (done) return;
    done = true;
    load -= w;
    if (w === 2) heavyLoad -= 1;
    node.style.willChange = '';
    clearTimeout(timer);
    node.removeEventListener('transitionend', onEnd);
    pump();
  };
  const onEnd = e => { if (e.target === node) release(); };
  node.addEventListener('transitionend', onEnd);
  const timer = setTimeout(release, 2600);
}

function pump() {
  while (queue.length && load < CAP) {
    const next = queue[0];
    const w = weightOf(next);
    if (load + w > CAP) break;
    if (w === 2 && heavyLoad >= 2) break;   // never 2 full-bleed + more
    queue.shift();
    start(next);
  }
}

const io = new IntersectionObserver((entries) => {
  // Top-of-page first, so the reveal order matches the reading order rather
  // than the observer's callback order.
  entries
    .filter(e => e.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    .forEach(e => {
      io.unobserve(e.target);
      if (reduced()) { e.target.classList.add('is-in'); return; }
      e.target.style.willChange = e.target.classList.contains('bleed')
        ? 'mask-image, clip-path' : 'transform';
      queue.push(e.target);
    });
  pump();
}, {
  // Fire a little before the element is actually visible so the stroke has
  // begun by the time it reaches the eye, but not so early it plays offscreen.
  rootMargin: '0px 0px -12% 0px',
  threshold: 0.08
});

export function observe(root = document) {
  root.querySelectorAll('[data-reveal]:not([data-seen])').forEach(n => {
    n.setAttribute('data-seen', '');
    // Index within its stagger group drives --i.
    const group = n.closest('[data-stagger]');
    if (group && !n.style.getPropertyValue('--i')) {
      const i = Array.prototype.indexOf.call(group.children, n);
      if (i > -1) n.style.setProperty('--i', i);
    }
    io.observe(n);
  });
}

export function revealNow(node) {
  io.unobserve(node);
  node.classList.add('is-in');
}
