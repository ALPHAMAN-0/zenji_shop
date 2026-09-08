# ZENJI 墨 — anime ink-brush streetwear

A storefront built with **hand-written HTML, CSS and JavaScript only**. No framework, no
library, no bundler, no build step, no dependencies — `git clone` and open it.

**Live:** https://alphaman-0.github.io/zenji_shop/

---

## The idea

The garment art is sumi-e: Japanese ink-brush portraits with splatter, drips and dry-brush
edges. So the site is built on one rule —

> **Nothing fades. Everything bleeds.**

Every arrival and section change is a registered CSS custom property `--front` driving a
two-layer mask: a `feTurbulence` fibre tile *intersected* with a travelling linear gradient.
The leading edge speckles and dissolves like ink soaking into paper. `opacity` is transitioned
in exactly one place on the whole site, which makes fade-up-on-scroll structurally impossible
rather than merely discouraged.

The duration tokens run `90 · 200 · 220 · 260` and then jump to `620 · 700 · 900 · 1100 · 1200
· 1400 · 1900`. **There is no token between 261ms and 619ms.** You cannot type `400ms`, because
nothing holds that value.

### Signature moments

| | | |
|---|---|---|
| 墨磨り | **The Grinding** | The ZJ monogram is *painted in* behind a wet diagonal stroke, then a vermillion seal punches down beside it — landing **off register** and pulling in, the way a second colour does on a press that is not quite true. Then the paper is gone in a single frame: the one hard **cut** in a site where everything else bleeds. |
| 一筆 | **The First Stroke** | One colossal brush stroke paints across the viewport with the laneway footage living inside it — **in full colour.** |
| 版ずれ | **The Misregister** | Each headline word arrives as two impressions: a vermillion plate a few pixels out, and the black plate over it. The vermillion pulls into register and the colour fringe closes. |
| 効果音 | **The SFX** | Turn a product card and its own katakana — ゴウ, ズシャ, ゴォ, ヒュン — is struck down the frame. Never at rest: an SFX is a *reaction to an impact*, not decoration. |
| 乾く | **It Dries** | On scroll the stroke evaporates from the left in ragged patches, the remaining ink darkens — and **the colour drains out of it.** A tankōbon is monochrome pages and a full-colour cover; the hero is the cover, and this is the seam. It is the one place you can watch the palette law being applied rather than be told about it. |
| 裏 | **The Turn** | The back of a tee *bleeds through* the front from the cursor's side, and the mount tone interpolates so the photo edge never seams. |
| 屏風 | **The Folding Screen** | The four Origin tees are leaves of a byōbu that unfold in place on alternating hinges. |
| 墨流し | **The Flood** | Ink floods up with a torn front and the headline on the boundary inverts mid-word — pure `mix-blend-mode: difference`, zero JavaScript. |
| 滴 | **The Drop** | Quick view floods radially from the exact pixel you clicked, with the photo FLIPping from its grid slot into the panel. |
| 判 | **The Hanko** | Every primary CTA is a seal. It punches past its resting size, flecks squeeze out, and one drop runs down — accelerating, then simply stopping. |

Deliberately **absent**, because each is a template tell: custom cursors, cursor trails,
magnetic buttons, glassmorphism, glow, gradient type, particle fields, horizontal-scroll
sections, `font-weight` above 500, and evenly-spaced staggers.

Also absent, and these were *considered and cut*: a 集中線 burst on arrival (the loudest thing
on the site, spent on a visitor who has done nothing yet — it stays on the quick view, where it
is earned), a screen shake (unrequested vestibular motion), a black leader frame at first paint,
registration crosses (a press artefact trimmed off before a book is ever bound — legible only to
people who have opened a print-ready PDF), and 第○話 episode numbers on every section eyebrow
(costume applied to wayfinding, on a storefront).

---

## Run it

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

`file://` will **not** work — ES modules are blocked by CORS there.

To reproduce the GitHub Pages subpath exactly, serve the *parent* directory and visit
`http://localhost:8000/zenji_shop/`.

---

## Structure

```
index.html  collection.html  lookbook.html  story.html  404.html
css/    tokens · base · layout · components · sections · motion   (linked in that order)
js/     core/ · components/ · effects/ · data/products.js
image/  hero.mp4, 24 product photographs, logo, banner
tools/  check-paths.sh · gen-markup.mjs · sync-shell.mjs
```

`css/motion.css` is linked **last** on purpose: motion has to win the cascade.

### `tools/` are authoring helpers, not a build step

The site never runs them; their output is committed.

- `check-paths.sh` — **run before every push.** Eleven gates: absolute paths, `url()` missing
  `../`, a `<base>` tag, local URLs, bad module specifiers, an uncommitted `.nojekyll`, missing
  or miscased images, time literals outside `tokens.css`, storage-prefix drift, font preloads
  without `crossorigin`, and **CSS that parses wrong** — orphaned `@keyframes` bodies, stray
  top-level braces, and `animation:` names with no `@keyframes` behind them. That last gate
  exists because this file shipped three orphaned keyframe bodies: per CSS Syntax L3 a stray `}`
  at the top level starts a qualified rule whose prelude runs to the next `{`, so each one
  *swallowed the rule after it*. `document.styleSheets` reported **zero keyframes site-wide**,
  and the 集中線 flash — with nothing left to scale and clear it — sat on screen at full strength
  for 900ms instead of 260.
- `gen-markup.mjs` — regenerates product markup from `js/data/products.js`.
- `sync-shell.mjs` — copies the canonical nav/footer out of `index.html` into the other pages.

---

## Notes for anyone editing this

- **This is a project page at `/zenji_shop/`, so every path is relative.** A leading `/`
  escapes to `alphaman-0.github.io/`, a different site. CSS `url()` resolves against the
  *stylesheet*, so from `css/` it needs `../image/`. `<video>` fails silently on a bad `src` —
  no error, the poster just sits there forever.
- **`404.html` is the one file that must use absolute `/zenji_shop/` paths**, because Pages
  renders it at the requested URL.
- **Product filenames are hand-authored, never templated.** Warrior Spirit has no `-1` file;
  its front is `Warrior-spirit-2.webp`. Any `${slug}-1.webp` interpolation will break it.
- **Animating a mask is a repaint, not a composite.** `js/core/reveal.js` enforces a hard cap
  of 6 concurrent bleeds as a queue. Ten at once drops a mid-range Android to 30fps.
- **One rAF loop, in `js/core/raf.js`.** Reads are batched before writes, and a change guard
  means idle scroll produces zero style writes. Don't add a second loop.
- **The plate owns the stage.** `js/main.js` does not start `observe()` or `Hero.init()` until
  `Preloader.run()`'s promise settles. Before that ordering existed, the entire 一筆 arrival —
  stroke, three words, dry-down — completed between 967ms and 1268ms behind a plate that did not
  clear until 2245ms: the site's signature moment played, in full, to nobody, on every first
  visit. The promise is raced against a 3000ms net, because a page whose reveal never fires is
  a page of invisible content.
- **The plate's timings come from tokens, not literals.** Gate 8 only scans `css/*.css`, so
  `preloader.js` was the one file conducting the site's timing while bound to none of it. The
  running order is now `--d-soak + --d-stamp + --d-turn` = 1520ms, asserted against the 2200ms
  cap in code.
- **A `transition` shorthand resets `transition-delay`.** `.bleed.dry` has to restate it or the
  reveal stagger is silently discarded — which is exactly what happened to the hero headline.
- **`[hidden]` needs `display: none !important` in `base.css`.** The UA rule is a single
  attribute selector and loses to any author `display`. Two components trusted the attribute and
  both lost: the preloader plate (JS failure ⇒ opaque white page) and the collection filter
  (which announced "5 of 10 products shown" while all ten stayed on screen).
- **Reduced motion swaps token values, never `*{animation:none}`.** A blanket nuke breaks every
  `transitionend` the close sequences depend on. Durations become `1ms`, not `0ms`, so those
  events still fire. The footer toggle layers over the OS setting in both directions.

Bag and wishlist persist in `localStorage`. There is no checkout — it's a front-end demo.

Product photography and the reference content structure are from [zenji.shop](https://zenji.shop/).
