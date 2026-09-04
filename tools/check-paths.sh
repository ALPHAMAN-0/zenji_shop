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

# 7. Every referenced image must exist with EXACT case: macOS git is
#    case-insensitive, the Pages Linux server is not.
missing=0
while read -r ref; do
  [ -z "$ref" ] && continue
  [ -e "$ref" ] || { printf '    missing: %s\n' "$ref"; missing=1; }
done < <(grep -rhoE '(image/[A-Za-z0-9_.-]+\.(webp|mp4|png))' \
  --include='*.html' --include='*.css' --include='*.js' . --exclude-dir=.git 2>/dev/null | sort -u)
[ $missing -eq 0 ] && ok "all image refs resolve" || note "missing image reference"

echo
if [ $fail -eq 0 ]; then printf '\033[32mPASS\033[0m — safe to push\n'; else printf '\033[31mFAILED\033[0m\n'; fi
exit $fail
