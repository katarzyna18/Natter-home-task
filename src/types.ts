/** Final product entry written to the results array. */
export interface ProductResult {
  name: string;
  description: string;
  price: number;
  colors?: string[];
}

export interface ScrapeOutput {
  results: ProductResult[];
  total: number;
}

/** Raw fields extracted from a single product page (before HDD expansion). */
export interface ParsedProduct {
  /** Absolute product page URL. */
  url: string;
  /** Numeric product id when present in the URL. */
  productId: number | null;
  name: string;
  description: string;
  /** Base price in integer cents (active / displayed configuration). */
  basePriceCents: number;
  /** Value of the active HDD swatch when present (usually "128"). */
  activeHdd: string | null;
  /** Enabled HDD swatch values (e.g. "128", "256"), empty if none. */
  hddOptions: string[];
  /** Color option labels, lowercased and deduplicated. */
  colors: string[];
}
