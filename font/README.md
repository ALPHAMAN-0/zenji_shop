# font/

Self-hosted, never a CDN. This is a GitHub Pages project page at `/zenji_shop/`
with no build step and no third-party dependency, and that stays true of the
fonts. `css/tokens.css` references these three files with `../font/…`.

## What belongs here

| file | family | weight | used by |
|---|---|---|---|
| `anton-400.woff2` | Anton | 400 | `--display` — hero, page titles, section titles |
| `plex-mono-400.woff2` | IBM Plex Mono | 400 | `--body` — all body copy |
| `plex-mono-500.woff2` | IBM Plex Mono | 500 | label register — eyebrows, card names, nav |

Two families, three faces. The reference brand uses IBM Plex Mono for body *and*
JetBrains Mono for 11px tracked-out uppercase eyebrows; at that size, uppercase,
and tracked out, the two are indistinguishable, so the eyebrow role is served by
Plex Mono 500 and one whole face is not shipped.

## Fetching them

Both are OFL-licensed. From the repo root:

```sh
curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf" -o /tmp/anton.ttf
curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf" -o /tmp/plex400.ttf
curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf" -o /tmp/plex500.ttf
# then subset to Latin + the punctuation the site actually uses:
pip install fonttools brotli
pyftsubset /tmp/anton.ttf   --output-file=font/anton-400.woff2   --flavor=woff2 --layout-features='*' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
pyftsubset /tmp/plex400.ttf --output-file=font/plex-mono-400.woff2 --flavor=woff2 --layout-features='*' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
pyftsubset /tmp/plex500.ttf --output-file=font/plex-mono-500.woff2 --flavor=woff2 --layout-features='*' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
```

Then commit the three `.woff2` files, and add each family's `OFL.txt` here.

## The site works without them

`--display` and `--mono` in `css/tokens.css` carry deep local fallback stacks
(Impact / Haettenschweiler / Arial Narrow for the condensed display; the system
mono stack for body), so every page renders correctly and on-brand with this
directory empty. The fonts are an upgrade, not a dependency — which is also why
`font-display: swap` is safe here.

## Still to do once the files land

Measure each face's real metrics and add a metric-overridden fallback
`@font-face` (`size-adjust`, `ascent-override`, `descent-override`) so the
fallback occupies the same box as the webfont and the swap costs no layout
shift. Do not guess these numbers — read them off the actual file:

```sh
python3 -c "from fontTools.ttLib import TTFont; f=TTFont('font/anton-400.woff2'); \
  h=f['hhea']; o=f['OS/2']; u=f['head'].unitsPerEm; \
  print('upem',u,'asc',h.ascent/u,'desc',h.descent/u,'cap',o.sCapHeight/u)"
```

CJK deliberately stays on the local `--jp` / `--jp-gothic` Mincho and Gothic
stacks. A Japanese webfont is megabytes for the handful of `lang="ja"` strings
on the site, and both resolve natively on macOS, Windows and Linux.
