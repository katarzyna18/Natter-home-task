# E-Commerce Scraper

Command-line scraper for the public [webscraper.io static e-commerce test site](https://webscraper.io/test-sites/e-commerce/static). It discovers every product across categories and pagination, expands HDD configurations into separate results, and prints a single JSON document to stdout.

## Overview

The application:

1. Starts at the static e-commerce root page
2. Crawls in-scope category and pagination links
3. Collects unique product URLs
4. Fetches and parses each product page
5. Expands multi-HDD products into one result per configuration
6. Emits `{ "results": [...], "total": number }` as JSON

## Requirements

- Node.js **20+** (developed against Node 22)
- npm 9+

## Installation

```bash
npm install
```

## Running

On Windows PowerShell, save results with one of these (avoids UTF-16 redirect corruption):

```powershell
npm run start:file
```

```powershell
npm start --silent -- output.json
```

```powershell
node dist/cli.js output.json
```

Do **not** use `> output.json` in PowerShell — it writes UTF-16 and `JSON.parse` will fail.

On macOS/Linux (or Windows `cmd`), stdout redirect is fine:

```bash
npm start --silent > output.json
```

Print JSON to stdout:

```bash
npm start --silent
```

Diagnostics go to **stderr** so they never mix into the JSON payload.

## Testing

```bash
npm test
```

Typecheck and compile:

```bash
npm run typecheck
npm run build
```

## Architecture

| Module | Responsibility |
| --- | --- |
| `src/http/client.ts` | HTTP GET with timeout, User-Agent, and limited retries |
| `src/discover.ts` | BFS crawl of the static site; product URL discovery |
| `src/parse/product.ts` | Cheerio extraction of name, description, price, HDD, colors |
| `src/expand.ts` | HDD → multiple results with configuration-specific prices |
| `src/aggregate.ts` | Deterministic ordering and total calculation |
| `src/scrape.ts` | Orchestration and per-product error isolation |
| `src/cli.ts` | Process entry point; JSON on stdout only |

Helpers stay small: cents-based money math and a concurrency pool with no extra dependencies.

## Data Flow

```
main page
  → category / pagination crawl
  → unique product URLs
  → fetch product HTML (bounded concurrency)
  → parse fields
  → expand HDD configurations
  → sort + sum totals
  → JSON on stdout
```

## Important Decisions

**HTTP client** — Native `fetch` (Node 20+) with AbortController timeouts. Retries only for transient failures (network errors, 429, 5xx), capped at two retries with short backoff.

**HTML parser** — Cheerio. Selectors are scoped to `.product-wrapper` so nav/footer content cannot pollute product fields.

**Discovery** — The main page alone does not list every product. The crawler follows all links under `/test-sites/e-commerce/static` (computers, phones, laptops, tablets, touch, and `?page=` links) and deduplicates product URLs. A failed listing/pagination page is skipped with a stderr warning; failure of the start page aborts the run.

**HDD expansion** — Enabled `button.btn.swatch` values become separate results named like `Dell Latitude 5480 128 GB`. Disabled swatches (often 1024) are skipped. Configuration prices are not present in static HTML; the site updates them in client JS (`EcommerceProduct.updatePrice`) with absolute offsets: `128 +$0`, `256 +$20`, `512 +$40`, `1024 +$60`. This scraper mirrors that formula. The displayed HTML price is treated as the **active** swatch price (normally 128); if another swatch were active, its offset is reversed before applying the target option’s offset. A headless browser was intentionally avoided — HTTP + HTML is enough for this static site.

**Colors** — When two or more `<select>` options have non-empty values, a lowercased `colors` array is included. Colors are never expanded into separate products. The field is omitted when there are fewer than two options.

**Total** — Sum of every price in `results`, computed in integer cents then converted once to dollars to avoid floating-point drift.

**Concurrency** — Product pages are fetched with a pool of 5 concurrent requests.

**Error handling** — Failure to discover products (or total parse failure) aborts the run. A single product fetch/parse problem is logged to stderr and skipped so one bad page does not wipe the run.

**Output** — Deterministic sort by product id, then HDD size. Pretty-printed JSON on stdout only.

## Trade-offs

This is intentionally scoped to a 1–2 hour take-home:

- HDD price modifiers are mirrored from the site’s published client script rather than driving a headless browser
- No persistent cache, metrics, or configurable CLI flags beyond sensible defaults
- Unit tests cover parsers and business rules with fixtures; there is no live integration test in CI
- Missing descriptions become empty strings (with a warning) instead of failing the product

## Future Improvements

- Persistent response caching and ETag support
- Configurable concurrency / timeout via env or CLI flags
- Structured logging / OpenTelemetry hooks
- Stronger retry/backoff policies and circuit breaking
- Snapshot or recorded HTTP integration tests
- Schema validation of the output document before print
- Scheduled scrapes with change detection

## License

MIT
