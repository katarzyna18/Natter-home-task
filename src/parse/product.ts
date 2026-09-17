import * as cheerio from "cheerio";
import { productIdFromUrl } from "../discover.js";
import type { ParsedProduct } from "../types.js";
import { parsePriceToCents } from "../util/money.js";

export class ProductParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductParseError";
  }
}

/**
 * Extract product fields from a product detail HTML document.
 * Scoped to `.product-wrapper` to avoid nav/footer noise.
 */
export function parseProductHtml(html: string, url: string): ParsedProduct {
  const $ = cheerio.load(html);
  const root = $(".product-wrapper").first();
  if (root.length === 0) {
    throw new ProductParseError(`Missing .product-wrapper on ${url}`);
  }

  const name = root.find("h4.title").first().text().trim();
  if (!name) {
    throw new ProductParseError(`Missing product name on ${url}`);
  }

  const description = root.find("p.description").first().text().trim();

  const priceText = root.find('span[itemprop="price"]').first().text().trim();
  const basePriceCents = parsePriceToCents(priceText);
  if (basePriceCents === null) {
    throw new ProductParseError(
      `Invalid or missing price "${priceText}" on ${url}`,
    );
  }

  const hddOptions: string[] = [];
  let activeHdd: string | null = null;

  root.find("div.swatches button.btn.swatch").each((_, el) => {
    const button = $(el);
    if (button.is("[disabled]") || button.attr("disabled") !== undefined) {
      return;
    }
    const value = button.attr("value")?.trim();
    if (!value) {
      return;
    }
    hddOptions.push(value);
    if (button.hasClass("active")) {
      activeHdd = value;
    }
  });

  const colors: string[] = [];
  const seenColors = new Set<string>();
  root.find("select option").each((_, el) => {
    const value = ($(el).attr("value") ?? "").trim();
    if (!value) {
      return;
    }
    const normalized = value.toLowerCase();
    if (seenColors.has(normalized)) {
      return;
    }
    seenColors.add(normalized);
    colors.push(normalized);
  });

  return {
    url,
    productId: productIdFromUrl(url),
    name,
    description,
    basePriceCents,
    activeHdd,
    hddOptions,
    colors,
  };
}
