# Slide tiles (EPAM story)

The EPAM page shows a real lymph-node slide from CAMELYON16 (CC0, Radboud UMC and UMC Utrecht), cut into a deep-zoom tile pyramid and served from R2 at `https://slides.buft.io/<slide>/<version>/`. Tiles are not in git; these two scripts recreate them.

```sh
uv run scripts/slides/build.py                       # downloads tumor_091 (546 MB) into .slides/src, writes .slides/tumor_091
scripts/slides/upload.sh put tumor_091 v4            # next version; v1–v3 are taken, retries failures, exits 1 if any remain
```

Then point `SLIDE_URL` in `src/components/epam/slide-data.ts` at the new version. Files are cached as immutable, so never re-upload over a live version; bump it.

Build defaults are the shipped cut: full resolution only within 800 px of the pathologist tumor outlines, half resolution elsewhere, WebP q70, glass-only tiles skipped. Library versions are pinned, so a rebuild is byte-identical (checked: 2,411 tiles, 115,167,548 bytes).

One-time bucket setup (bucket, CORS for `fetch`, custom domain) on the Cloudflare account that owns buft.io:

```sh
scripts/slides/upload.sh setup <buft.io zone id>
```

R2 has no hard spending cap, so four dashboard settings keep it under $5/month (set by hand, not scripted):

- Billing → Billable Usage → budget alert at $5 (email, fires the day after).
- buft.io → Security → WAF → custom rule "slides: block query strings": `(http.host eq "slides.buft.io" and len(http.request.uri.query) > 0)` → Block. Query strings bypass the edge cache, and each bypass is a billed R2 read.
- Rate limiting rule "slides: 1000 per 10s per IP": `(http.host eq "slides.buft.io")`, 1000 requests / 10 s per IP → Block 10 s. Only slides requests count.
- buft.io → Caching → Cache Rules → "slides: cache all, never 404": `(http.host eq "slides.buft.io")` → Eligible for cache, Edge TTL from the cache-control header, status code TTL 404 → no store. Without it `slide.json` is never edge-cached (JSON is not a default cached type), and a tile requested before its upload finishes would keep serving a cached 404.

Reads that hit the edge cache are free; reaching $5 takes ~24M cache misses in a month (10M free + $0.36/M).
