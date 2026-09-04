/* sync-shell.mjs · authoring helper, NOT a build step.
   The nav/footer/dialog markup is hand-written INTO each page so the site
   renders completely with JS disabled and keeps its SEO. That means N copies,
   and N copies drift. This copies the canonical blocks out of index.html into
   every other page so they cannot.
     node tools/sync-shell.mjs                     */
import { readFileSync, writeFileSync } from 'node:fs';

const BLOCKS = ['NAV', 'FOOTER', 'DIALOGS'];
const PAGES = ['collection.html', 'lookbook.html', 'story.html'];
const src = readFileSync('index.html', 'utf8');

const grab = name => {
  const m = src.match(new RegExp(`<!--#SHELL:${name}-->[\\s\\S]*?<!--/#SHELL:${name}-->`));
  if (!m) throw new Error(`index.html is missing SHELL:${name}`);
  return m[0];
};
const canon = Object.fromEntries(BLOCKS.map(b => [b, grab(b)]));

for (const page of PAGES) {
  let html = readFileSync(page, 'utf8');
  let n = 0;
  for (const b of BLOCKS) {
    const re = new RegExp(`<!--#SHELL:${b}-->[\\s\\S]*?<!--/#SHELL:${b}-->`);
    if (re.test(html)) { html = html.replace(re, canon[b]); n++; }
  }
  writeFileSync(page, html);
  console.log(`${page}: ${n}/${BLOCKS.length} shell blocks synced`);
}
