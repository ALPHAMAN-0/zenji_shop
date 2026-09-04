#!/usr/bin/env bash
# ============================================================================
# check-paths.sh · run before every push.
# This site is a GitHub Pages PROJECT page served from /zenji_shop/. A leading
# slash escapes to alphaman-0.github.io/, which is a different site entirely,
# and <video> in particular fails SILENTLY on a bad src — no error, the poster
# just sits there forever. That is why this is a gate and not a guideline.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
note() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=1; }
ok()   { printf '  \033[32mok\033[0m   %s\n' "$1"; }

echo "checking paths..."

# 1. Absolute src/href/url()/import — everywhere except 404.html, which MUST
#    use them (Pages renders it at the requested URL, so relative paths break).
hits=$(grep -rnE '(src|href)="/[^/]|url\((["'"'"']?)/[^/]|from ["'"'"']/|import\(["'"'"']/' \
  --include='*.html' --include='*.css' --include='*.js' . \
  --exclude=404.html --exclude-dir=.git 2>/dev/null || true)
if [ -n "$hits" ]; then echo "$hits"; note "absolute path (leading slash)"; else ok "no absolute paths"; fi

# 2. CSS url() resolves against the STYLESHEET, not the document. From css/,
#    url(image/x) becomes /zenji_shop/css/image/x and 404s. It needs ../.
hits=$(grep -rn 'url("\?image/' css/ 2>/dev/null || true)
if [ -n "$hits" ]; then echo "$hits"; note "css url() missing ../"; else ok "css url() paths correct"; fi

# 3. <base> "fixes" paths and breaks every in-page #anchor.
hits=$(grep -rn '<base ' --include='*.html' . --exclude-dir=.git 2>/dev/null || true)
if [ -n "$hits" ]; then echo "$hits"; note "<base> tag present"; else ok "no <base> tag"; fi

# 4. No local dev URLs left behind.
# A `location.hostname === 'localhost'` comparison is an intentional debug
# guard, not a leftover dev URL. Only flag localhost inside an actual URL.
hits=$(grep -rnE "(src|href|url\(|from )[\"'(]?https?://(localhost|127\.0\.0\.1)" \
  --include='*.html' --include='*.css' --include='*.js' . \
  --exclude-dir=.git --exclude-dir=tools 2>/dev/null || true)
if [ -n "$hits" ]; then echo "$hits"; note "local URL"; else ok "no local URLs"; fi

# 5. Module specifiers must be relative AND carry .js — there is no resolver
#    on a static host, so bare/extensionless specifiers simply fail.
hits=$(grep -rnE "from ['\"][^./][^'\"]*['\"]|from ['\"]\.[^'\"]*[^s]['\"]" \
  --include='*.js' js/ 2>/dev/null | grep -v "\.js['\"]" || true)
if [ -n "$hits" ]; then echo "$hits"; note "bad module specifier"; else ok "module specifiers ok"; fi

# 6. .nojekyll must be COMMITTED. Dotfiles get silently missed, and without it
#    Jekyll drops _-prefixed files and eats {{ }} in inline <script>.
if git ls-files --error-unmatch .nojekyll >/dev/null 2>&1; then ok ".nojekyll committed"
else note ".nojekyll not committed (git add .nojekyll)"; fi

# 7. Every referenced asset must exist with EXACT case: macOS git is
#    case-insensitive, the Pages Linux server is not.
#
#    This gate used `[ -e "$ref" ]`, which on a case-insensitive filesystem is
#    true for image/will-of-the-sun-1.webp even though the real file is
#    Will-of-the-sun-1.webp. So it could only ever catch a MISSING file, never
#    a MISCASED one — which is the failure that reaches the Linux server and
#    the only reason the gate says "EXACT case". `grep -qxF` against a real
#    listing is case-sensitive regardless of the filesystem.
real=$(find image font -type f 2>/dev/null | sed 's|^\./||' | sort)
missing=0
while read -r ref; do
  [ -z "$ref" ] && continue
  printf '%s\n' "$real" | grep -qxF "$ref" \
    || { printf '    missing or miscased: %s\n' "$ref"; missing=1; }
done < <(grep -rhoE '((image|font)/[A-Za-z0-9_.@-]+\.(webp|avif|png|jpg|jpeg|svg|mp4|webm|woff2|woff|ttf))' \
  --include='*.html' --include='*.css' --include='*.js' . --exclude-dir=.git 2>/dev/null | sort -u)
[ $missing -eq 0 ] && ok "all asset refs resolve, case-exact" || note "missing/miscased asset reference"

# 8. The duration DEAD BAND. README.md claims you cannot type 400ms because no
#    token holds that value; this is what makes that true rather than merely
#    aspirational. Only tokens.css may contain a time literal, and only the
#    reduced-motion 1ms swap may appear outside it.
#    Comments are stripped first, and three things are legitimately literal:
#    the reduced-motion 1ms swap, a 0ms stagger (which is an ABSENCE of
#    stagger, not a duration), and base.css's hand-authored 12-value jitter
#    list, which is authored data — the README is explicit that it must never
#    be Math.random().
hits=$(python3 - <<'PY'
import glob, re, sys
bad = []
for f in sorted(glob.glob('css/*.css')):
    if f.endswith('tokens.css'): continue
    src = re.sub(r'/\*.*?\*/', '', open(f).read(), flags=re.S)   # drop comments
    for i, line in enumerate(src.split('\n'), 1):
        if '--j:' in line: continue                              # authored jitter
        for m in re.finditer(r'(?<![\w.-])(\d+(?:\.\d+)?)(ms|s)\b', line):
            if m.group(0) in ('0ms', '1ms'): continue
            bad.append(f"{f}:{i}: {m.group(0)}")
print('\n'.join(bad))
PY
)
if [ -n "$hits" ]; then echo "$hits"; note "time literal outside tokens.css"
else ok "no time literals outside tokens"; fi

# 9. The pre-paint boot script reads the motion preference straight out of
#    localStorage before any module loads, so it hardcodes store.js's version
#    prefix. Bump the prefix in one place and the other silently stops
#    hydrating, with no error anywhere.
prefix=$(grep -oE "PREFIX = '[^']+'" js/core/store.js | grep -oE "'[^']+'" | tr -d "'")
bad=0
for f in index.html collection.html lookbook.html story.html; do
  grep -q "'${prefix}motion'" "$f" || { printf '    %s does not use %smotion\n' "$f" "$prefix"; bad=1; }
done
[ $bad -eq 0 ] && ok "boot script matches store.js prefix ($prefix)" || note "storage prefix drift"

echo
if [ $fail -eq 0 ]; then printf '\033[32mPASS\033[0m — safe to push\n'; else printf '\033[31mFAILED\033[0m\n'; fi
exit $fail
