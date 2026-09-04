/* verify-data.js · localhost / ?debug only. Never shipped into the page path.
   Asserts on load that every referenced file resolves and that the intrinsic
   dimensions in products.js match the real files, because a wrong width/height
   is a silent CLS source that no visual test catches. */
import { PRODUCTS } from '../data/products.js';

export async function run() {
  const problems = [];
  let checked = 0;

  await Promise.all(PRODUCTS.flatMap(p =>
    ['front', 'back', 'hero'].map(async key => {
      const img = p[key];
      if (!img) return;
      checked++;
      await new Promise(res => {
        const probe = new Image();
        probe.onload = () => {
          if (probe.naturalWidth !== img.w || probe.naturalHeight !== img.h) {
            problems.push(`${img.src}: declared ${img.w}x${img.h}, real ${probe.naturalWidth}x${probe.naturalHeight}`);
          }
          res();
        };
        probe.onerror = () => { problems.push(`${img.src}: FAILED TO LOAD`); res(); };
        probe.src = img.src;
      });
    })));

  const ids = new Set();
  for (const p of PRODUCTS) {
    if (ids.has(p.id)) problems.push(`duplicate id: ${p.id}`);
    ids.add(p.id);
    if (p.onSale && p.salePrice == null) problems.push(`${p.id}: onSale with no salePrice`);
    if (!p.accentInk && !p.nearNeutral) problems.push(`${p.id}: no accentInk and not flagged nearNeutral`);
  }

  if (problems.length) console.error('[zenji:verify] %d problem(s)\n%s', problems.length, problems.join('\n'));
  else console.info('[zenji:verify] OK — %d image refs, %d products', checked, PRODUCTS.length);
  return problems;
}
