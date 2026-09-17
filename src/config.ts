export const BASE_URL =
  "https://webscraper.io/test-sites/e-commerce/static";

export const SITE_ORIGIN = "https://webscraper.io";

export const USER_AGENT =
  "NatterEcommerceScraper/1.0 (+take-home assessment; contact: local)";

/** Request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Extra attempts after the first failure for retryable errors. */
export const MAX_RETRIES = 2;

/** Base delay between retries (multiplied by attempt number). */
export const RETRY_BASE_DELAY_MS = 400;

/** Max concurrent product page fetches. */
export const PRODUCT_CONCURRENCY = 5;

/**
 * Client-side HDD price modifiers from the site's EcommerceProduct.updatePrice
 * in app.js. The HTML shows the base price for the active (usually 128) option;
 * other sizes add a fixed dollar offset.
 */
export const HDD_PRICE_MODIFIERS_USD: Readonly<Record<string, number>> = {
  "128": 0,
  "256": 20,
  "512": 40,
  "1024": 60,
};
