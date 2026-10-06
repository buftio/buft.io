#!/usr/bin/env bash
set -euo pipefail

BUCKET=buft-slides
DOMAIN=slides.buft.io
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/../.."
WRANGLER="$ROOT/node_modules/.bin/wrangler"

usage() {
  echo "usage: $0 setup <buft.io zone id>"
  echo "       $0 put <slide> <version>      e.g. put tumor_091 v1"
  exit 1
}

case "${1:-}" in
  setup)
    [ $# -eq 2 ] || usage
    "$WRANGLER" r2 bucket create "$BUCKET" || true
    "$WRANGLER" r2 bucket cors set "$BUCKET" --file "$HERE/cors.json" --force
    "$WRANGLER" r2 bucket domain add "$BUCKET" --domain "$DOMAIN" --zone-id "$2" --min-tls 1.2 --force
    ;;
  put)
    [ $# -eq 3 ] || usage
    dir="$ROOT/.slides/$2"
    todo="$(mktemp)"
    [ -f "$dir/slide.json" ] || { echo "no $dir/slide.json, run: uv run scripts/slides/build.py --slide $2"; exit 1; }
    cd "$dir"
    find . -type f \( -name '*.webp' -o -name 'slide.json' \) | sed 's|^\./||' | sort >"$todo"
    total=$(wc -l <"$todo" | tr -d ' ')
    for jobs in 8 2 1; do
      xargs -P "$jobs" -I{} sh -c '
        case "$1" in *.json) type=application/json ;; *) type=image/webp ;; esac
        "$0" r2 object put "$2/$1" --file "$1" --ct "$type" \
          --cc "public, max-age=31536000, immutable" --remote >/dev/null 2>&1 || echo "$1"
      ' "$WRANGLER" {} "$BUCKET/$2/$3" <"$todo" | sort >"$todo.failed"
      mv "$todo.failed" "$todo"
      echo "$((total - $(wc -l <"$todo" | tr -d ' '))) / $total uploaded"
      [ -s "$todo" ] || break
    done
    [ -s "$todo" ] && { echo "failed:"; cat "$todo"; exit 1; }
    echo "https://$DOMAIN/$2/$3/slide.json"
    ;;
  *) usage ;;
esac
