import * as cheerio from "cheerio";
import { BASE_URL, SITE_ORIGIN } from "./config.js";
import type { HttpClient } from "./http/client.js";

const PRODUCT_PATH_RE = /\/test-sites\/e-commerce\/static\/product\/(\d+)\/?$/;
const SCOPE_PREFIX = "/test-sites/e-commerce/static";

/** Resolve and keep only in-scope absolute URLs under the static test site. */
export function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.origin !== SITE_ORIGIN) {
      return null;
    }
    if (!resolved.pathname.startsWith(SCOPE_PREFIX)) {
      return null;
    }
    resolved.hash = "";
    if (resolved.pathname.length > 1 && resolved.pathname.endsWith("/")) {
      resolved.pathname = resolved.pathname.slice(0, -1);
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

export function isProductUrl(url: string): boolean {
  try {
    return PRODUCT_PATH_RE.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Extract unique in-scope links from an HTML document. */
export function extractLinks(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) {
      return;
    }
    const absolute = normalizeUrl(href, pageUrl);
    if (absolute) {
      links.add(absolute);
    }
  });

  return [...links];
}

export interface DiscoverResult {
  productUrls: string[];
  pagesVisited: number;
}

export interface DiscoverOptions {
  onWarning?: (message: string) => void;
}

/**
 * Breadth-first crawl of the static e-commerce test site.
 * Follows category and pagination links; collects unique product URLs.
 * Listing-page failures are skipped with a warning so one bad page
 * does not abort discovery of the rest of the catalog.
 */
export async function discoverProductUrls(
  http: HttpClient,
  startUrl: string = BASE_URL,
  options: DiscoverOptions = {},
): Promise<DiscoverResult> {
  const queue: string[] = [startUrl];
  const queued = new Set<string>([startUrl]);
  const visited = new Set<string>();
  const products = new Set<string>();

  while (queue.length > 0) {
    const pageUrl = queue.shift();
    if (!pageUrl || visited.has(pageUrl)) {
      continue;
    }
    visited.add(pageUrl);

    let html: string;
    try {
      html = await http.getText(pageUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (pageUrl === startUrl) {
        throw new Error(`Failed to fetch start page ${startUrl}: ${message}`);
      }
      options.onWarning?.(
        `Skipping listing page ${pageUrl}: ${message}`,
      );
      continue;
    }

    const links = extractLinks(html, pageUrl);

    for (const link of links) {
      if (isProductUrl(link)) {
        products.add(link);
        continue;
      }
      if (!visited.has(link) && !queued.has(link)) {
        queued.add(link);
        queue.push(link);
      }
    }
  }

  const productUrls = [...products].sort((a, b) => {
    const idA = Number(a.match(/\/product\/(\d+)/)?.[1] ?? 0);
    const idB = Number(b.match(/\/product\/(\d+)/)?.[1] ?? 0);
    return idA - idB;
  });

  return {
    productUrls,
    pagesVisited: visited.size,
  };
}

export function productIdFromUrl(url: string): number | null {
  try {
    const match = new URL(url).pathname.match(PRODUCT_PATH_RE);
    if (!match?.[1]) {
      return null;
    }
    return Number.parseInt(match[1], 10);
  } catch {
    return null;
  }
}
