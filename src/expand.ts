import { HDD_PRICE_MODIFIERS_USD } from "./config.js";
import type { ParsedProduct, ProductResult } from "./types.js";

export interface ExpandedEntry {
  result: ProductResult;
  priceCents: number;
}

function hddModifierCents(option: string): number {
  const dollars = HDD_PRICE_MODIFIERS_USD[option] ?? 0;
  return Math.round(dollars * 100);
}

function formatHddLabel(option: string): string {
  return `${option} GB`;
}

/**
 * Convert the displayed (active) price into the price for a target HDD option.
 *
 * Site JS stores the page-load price as the baseline and then applies absolute
 * offsets by option value (+0/+20/+40/+60). When the active swatch is known we
 * reverse its offset first so a non-default active option still prices correctly.
 */
export function priceCentsForHddOption(
  displayedPriceCents: number,
  activeHdd: string | null,
  targetHdd: string,
): number {
  const baselineCents =
    displayedPriceCents - hddModifierCents(activeHdd ?? "128");
  return baselineCents + hddModifierCents(targetHdd);
}

/**
 * Expand a parsed product into one or more output results.
 * Multiple enabled HDD options become separate entries with adjusted prices.
 */
export function expandProduct(product: ParsedProduct): ExpandedEntry[] {
  const colors =
    product.colors.length >= 2 ? [...product.colors] : undefined;

  const build = (name: string, priceCents: number): ExpandedEntry => {
    const result: ProductResult = {
      name,
      description: product.description,
      price: priceCents / 100,
    };
    if (colors !== undefined) {
      result.colors = colors;
    }
    return { result, priceCents };
  };

  if (product.hddOptions.length <= 1) {
    return [build(product.name, product.basePriceCents)];
  }

  return product.hddOptions.map((option) => {
    const priceCents = priceCentsForHddOption(
      product.basePriceCents,
      product.activeHdd,
      option,
    );
    const name = `${product.name} ${formatHddLabel(option)}`;
    return build(name, priceCents);
  });
}

/** Sort key for configuration suffix on expanded names. */
export function hddSortKey(name: string): number {
  const match = name.match(/(\d+)\s*GB$/i);
  return match?.[1] ? Number.parseInt(match[1], 10) : -1;
}
