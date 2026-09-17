import { expandProduct, hddSortKey } from "./expand.js";
import type { ParsedProduct, ProductResult, ScrapeOutput } from "./types.js";
import { centsToDollars, sumCents } from "./util/money.js";

function productSortKey(product: ParsedProduct): number {
  return product.productId ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Expand parsed products, sort deterministically, and compute the total.
 * Total is the sum of every result price (computed in integer cents).
 */
export function aggregateProducts(
  products: readonly ParsedProduct[],
): ScrapeOutput {
  const ordered = [...products].sort((a, b) => {
    const idDiff = productSortKey(a) - productSortKey(b);
    if (idDiff !== 0) {
      return idDiff;
    }
    return a.name.localeCompare(b.name);
  });

  const results: ProductResult[] = [];
  const priceCents: number[] = [];

  for (const product of ordered) {
    const expanded = expandProduct(product).sort(
      (a, b) => hddSortKey(a.result.name) - hddSortKey(b.result.name),
    );
    for (const item of expanded) {
      results.push(item.result);
      priceCents.push(item.priceCents);
    }
  }

  return {
    results,
    total: centsToDollars(sumCents(priceCents)),
  };
}
