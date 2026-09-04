/* motion.js · the motion singleton.
   A user's explicit choice layers OVER the OS setting in BOTH directions:
   data-motion="full" beats prefers-reduced-motion:reduce, and
   data-motion="reduced" applies even when the OS asks for nothing.
   The attribute is the source of truth; the media query is only the default. */
import { read, write } from './store.js';

const mq = matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set();

/** 'system' | 'full' | 'reduced' */
let choice = read('motion', 'system');

export function apply() {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-motion');
  else root.setAttribute('data-motion', choice);
  for (const fn of listeners) fn(reduced());
}

/** The single question every effect asks before scheduling work. */
export function reduced() {
  if (choice === 'full') return false;
  if (choice === 'reduced') return true;
  return mq.matches;
}

export function setChoice(next) {
  choice = next;
  write('motion', next);
  apply();
}
export const getChoice = () => choice;

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

mq.addEventListener?.('change', () => { if (choice === 'system') apply(); });
