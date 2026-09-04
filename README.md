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
| 墨磨り | **The Grinding** | The ZJ monogram is *painted in* behind a wet diagonal stroke, then a vermillion seal stamps beside it. |
| 一筆 | **The First Stroke** | One colossal brush stroke paints across the viewport with the laneway footage living inside it as a warm monochrome ink wash. |
| 乾く | **It Dries** | On scroll the stroke evaporates from the left in ragged patches while the remaining ink darkens. |
| 裏 | **The Turn** | The back of a tee *bleeds through* the front from the cursor's side, and the mount tone interpolates so the photo edge never seams. |
| 屏風 | **The Folding Screen** | The four Origin tees are leaves of a byōbu that unfold in place on alternating hinges. |
| 墨流し | **The Flood** | Ink floods up with a torn front and the headline on the boundary inverts mid-word — pure `mix-blend-mode: difference`, zero JavaScript. |
| 滴 | **The Drop** | Quick view floods radially from the exact pixel you clicked, with the photo FLIPping from its grid slot into the panel. |
| 判 | **The Hanko** | Every primary CTA is a seal. It punches past its resting size, flecks squeeze out, and one drop runs down — accelerating, then simply stopping. |

Deliberately **absent**, because each is a template tell: custom cursors, cursor trails,
magnetic buttons, glassmorphism, glow, gradient type, particle fields, horizontal-scroll
sections, `font-weight` above 500, and evenly-spaced staggers.

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

- `check-paths.sh` — **run before every push.** Catches absolute paths, `url()` missing `../`,
  bad module specifiers, a `<base>` tag, an uncommitted `.nojekyll`, and missing images.
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
- **Reduced motion swaps token values, never `*{animation:none}`.** A blanket nuke breaks every
  `transitionend` the close sequences depend on. Durations become `1ms`, not `0ms`, so those
  events still fire. The footer toggle layers over the OS setting in both directions.

Bag and wishlist persist in `localStorage`. There is no checkout — it's a front-end demo.

Product photography and the reference content structure are from [zenji.shop](https://zenji.shop/).
