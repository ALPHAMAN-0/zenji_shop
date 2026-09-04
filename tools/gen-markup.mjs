/* ============================================================================
   gen-markup.mjs · authoring helper, NOT a build step.
   ----------------------------------------------------------------------------
   Regenerates the product markup between <!--GRID:name--> ... <!--/GRID:name-->
   markers in the HTML files, from js/data/products.js.

   The OUTPUT is committed. The site is plain static HTML and never runs this.
   Run it only when the product data changes:  node tools/gen-markup.mjs
   ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { PRODUCTS, FEATURED, priceOf, discountOf, fmt } from '../js/data/products.js';

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Six flecks, hand-authored. Never radially symmetric — an even ring reads as
   a CSS demo, not as ink thrown off a brush. */
const FLECKS = [
  [-46, -34], [38, -52], [58, 18], [-30, 46], [72, -12], [-64, 8]
];

function splat() {
  return `<span class="splat" aria-hidden="true">` +
    FLECKS.map(([dx, dy], n) =>
      `<i style="--n:${n};--dx:${dx}px;--dy:${dy}px"></i>`).join('') +
    `</span>`;
}

function priceBlock(p) {
  const now = fmt(priceOf(p));
  if (!p.onSale) {
    return `<span class="price">${now}</span>`;
  }
  const was = fmt(p.price);
  const off = discountOf(p);
  /* Colour is never the only signal, and a struck price is meaningless to a
     screen reader: the visual prices are hidden from AT and one plain
     sentence is exposed instead. */
  return `<span class="price" aria-hidden="true">${now}</span>` +
         `<span class="price price--was" aria-hidden="true">${was}</span>` +
         `<span class="tag-sale" aria-hidden="true">${off}% OFF</span>` +
         `<span class="sr-only">Reduced from ${was} to ${now}, ${off} percent off.</span>`;
}

function card(p, { eager = false } = {}) {
  const img = p.front;
  const ink = p.accentInk || 'var(--sumi)';
  const splash = p.nearNeutral ? 'var(--shu)' : p.colorway.hex;
  const alt = `${p.name} tee in ${p.colorway.name.toLowerCase()}, front view`;
  return `
        <article class="card" data-id="${p.id}" data-reveal
                 style="--accent:${p.colorway.hex};--accent-ink:${ink};--accent-splash:${splash};--plate:${img.plate}">
          <a class="card__frame clip-focus" href="?p=${p.id}" data-quick="${p.id}"
             aria-label="${esc(p.name)} — open quick view">
            <img class="card__img card__img--back" alt="" aria-hidden="true"
                 data-src="${p.back.src}" width="${p.back.w}" height="${p.back.h}"
                 decoding="async" style="object-position:${p.back.pos}">
            <img class="card__img card__img--front bleed" src="${img.src}"
                 width="${img.w}" height="${img.h}" alt="${esc(alt)}"
                 ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}
                 style="object-position:${img.pos}">
            ${splat()}
            <span class="card__deckle" aria-hidden="true"></span>
          </a>
          <div class="card__meta">
            <h3 class="card__name">${esc(p.name)}</h3>
            <span class="card__kanji jp" lang="ja">${p.kanji}</span>
            <div class="card__row">
              <span class="swatch" aria-hidden="true" style="--accent:${p.colorway.hex}"></span>
              <span class="micro">${esc(p.colorway.name)}</span>
            </div>
            <div class="card__row">${priceBlock(p)}</div>
            <span class="quick" aria-hidden="true">[ QUICK VIEW → ]</span>
          </div>
        </article>`;
}

function leaf(p, i) {
  const src = p.hero || p.front;
  const ink = p.accentInk || 'var(--sumi)';
  /* No kanji overlay on the artwork: these hero composites already carry
     their own brushed kanji, and stacking a second set on top reads as a
     mistake. The kanji moves to the caption, where it can still lift into the
     colorway as the leaf comes flat. */
  return `
          <article class="leaf" data-reveal data-id="${p.id}"
                   style="--accent:${p.colorway.hex};--accent-ink:${ink};--plate:${src.plate}">
            <a class="leaf__frame clip-focus" href="?p=${p.id}" data-quick="${p.id}"
               aria-label="${esc(p.name)} — open quick view">
              <img src="${src.src}" width="${src.w}" height="${src.h}"
                   alt="${esc(p.name)} tee, styled" loading="lazy" decoding="async"
                   style="object-position:${src.pos}">
              <span class="leaf__seal" aria-hidden="true"></span>
            </a>
            <div class="leaf__cap">
              <span class="leaf__kanji jp" lang="ja" aria-hidden="true">${p.kanji}</span>
              <h3 class="card__name">${esc(p.name)}</h3>
              <div class="card__row">${priceBlock(p)}</div>
            </div>
          </article>`;
}

const BLOCKS = {
  featured: () => FEATURED.map(card).join('\n'),
  byobu:    () => FEATURED.map(leaf).join('\n'),
  all:      () => PRODUCTS.map((p, i) => card(p, { eager: i < 2 })).join('\n')
};

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node tools/gen-markup.mjs <file.html>...'); process.exit(1); }

for (const file of files) {
  let html = readFileSync(file, 'utf8');
  let hits = 0;
  for (const [name, render] of Object.entries(BLOCKS)) {
    const re = new RegExp(`(<!--GRID:${name}-->)([\\s\\S]*?)(<!--/GRID:${name}-->)`, 'g');
    html = html.replace(re, (_m, a, _old, b) => { hits++; return `${a}\n${render()}\n        ${b}`; });
  }
  writeFileSync(file, html);
  console.log(`${file}: ${hits} block(s) generated`);
}
