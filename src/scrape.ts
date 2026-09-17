import { aggregateProducts } from "./aggregate.js";
import { PRODUCT_CONCURRENCY } from "./config.js";
import { discoverProductUrls } from "./discover.js";
import { HttpClient } from "./http/client.js";
import { parseProductHtml, ProductParseError } from "./parse/product.js";
import type { ParsedProduct, ScrapeOutput } from "./types.js";
import { mapWithConcurrency } from "./util/concurrency.js";

export interface ScrapeOptions {
  http?: HttpClient;
  concurrency?: number;
  onWarning?: (message: string) => void;
}

function warn(onWarning: ScrapeOptions["onWarning"], message: string): void {
  onWarning?.(message);
}

/**
 * Full scrape workflow: discover product URLs, fetch/parse each page,
 * expand HDD configurations, and aggregate into the output shape.
 */
export async function scrapeSite(
  options: ScrapeOptions = {},
): Promise<ScrapeOutput> {
  const http = options.http ?? new HttpClient();
  const concurrency = options.concurrency ?? PRODUCT_CONCURRENCY;
  const onWarning = options.onWarning;

  const { productUrls, pagesVisited } = await discoverProductUrls(
    http,
    undefined,
    onWarning ? { onWarning } : {},
  );
  warn(
    onWarning,
    `Discovered ${productUrls.length} products across ${pagesVisited} pages`,
  );

  if (productUrls.length === 0) {
    throw new Error("No product URLs discovered on the target site");
  }

  const parsed = await mapWithConcurrency(
    productUrls,
    concurrency,
    async (url): Promise<ParsedProduct | null> => {
      try {
        const html = await http.getText(url);
        const product = parseProductHtml(html, url);
        if (!product.description) {
          warn(onWarning, `Missing description for ${url}; using empty string`);
        }
        return product;
      } catch (error) {
        const message =
          error instanceof ProductParseError || error instanceof Error
            ? error.message
            : String(error);
        warn(onWarning, `Skipping product ${url}: ${message}`);
        return null;
      }
    },
  );

  const products = parsed.filter((p): p is ParsedProduct => p !== null);

  if (products.length === 0) {
    throw new Error("All product pages failed to parse");
  }

  return aggregateProducts(products);
}