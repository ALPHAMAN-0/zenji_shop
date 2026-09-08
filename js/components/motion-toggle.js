/* motion-toggle.js · the user's explicit choice, layered over the OS setting.
   Three states cycle: system -> reduced -> full -> system, so a user whose OS
   asks for reduced motion can still opt back INTO the full experience. */
import { $, say } from '../core/dom.js';
import { getChoice, setChoice, reduced, apply } from '../core/motion.js';

const NEXT = { system: 'reduced', reduced: 'full', full: 'system' };
const LABEL = { system: 'Motion: System', reduced: 'Motion: Reduced', full: 'Motion: Full' };

export function init() {
  const btn = $('#motionToggle');
  apply();
  if (!btn) return;
  /* .switch__label, NOT 'span:last-child'. That selector is not scoped to the
     button's own children: .switch__thumb is the last child of .switch__track
     and comes FIRST in document order, so querySelector returned the 14x14px
     absolutely-positioned dot. Every paint() wrote "Motion: System" into it,
     the string spilled out of a 14px box across the "Reduce Motion" label and
     the copyright line, and the real label never changed at all — so the
     control reported its state twice, in the wrong place, in both cases
     wrongly. On all four pages, from first paint. */
  const label = btn.querySelector('.switch__label');

  const paint = () => {
    const c = getChoice();
    btn.setAttribute('aria-pressed', String(reduced()));
    if (label) label.textContent = LABEL[c];
  };

  btn.addEventListener('click', () => {
    setChoice(NEXT[getChoice()] || 'system');
    paint();
    say(LABEL[getChoice()]);
  });
  paint();
}
