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
  const label = btn.querySelector('span:last-child');

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
