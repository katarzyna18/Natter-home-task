import { describe, expect, it } from "vitest";
import { expandProduct } from "../src/expand.js";
import type { ParsedProduct } from "../src/types.js";

function baseProduct(
  overrides: Partial<ParsedProduct> = {},
): ParsedProduct {
  return {
    url: "https://webscraper.io/test-sites/e-commerce/static/product/119",
    productId: 119,
    name: "Dell Latitude 5480",
    description: "Example description",
    basePriceCents: 118_788,
    activeHdd: "128",
    hddOptions: [],
    colors: [],
    ...overrides,
  };
}

describe("expandProduct", () => {
  it("expands multiple HDD options into separate priced results", () => {
    const expanded = expandProduct(
      baseProduct({ hddOptions: ["128", "256", "512"] }),
    );

    expect(expanded.map((e) => e.result.name)).toEqual([
      "Dell Latitude 5480 128 GB",
      "Dell Latitude 5480 256 GB",
      "Dell Latitude 5480 512 GB",
    ]);
    expect(expanded.map((e) => e.priceCents)).toEqual([
      118_788,
      120_788,
      122_788,
    ]);
    expect(expanded.map((e) => e.result.price)).toEqual([
      1187.88,
      1207.88,
      1227.88,
    ]);
  });

  it("does not expand when there is a single HDD option", () => {
    const expanded = expandProduct(baseProduct({ hddOptions: ["128"] }));
    expect(expanded).toHaveLength(1);
    expect(expanded[0]?.result.name).toBe("Dell Latitude 5480");
    expect(expanded[0]?.priceCents).toBe(118_788);
  });

  it("includes colors only when multiple options exist", () => {
    const withColors = expandProduct(
      baseProduct({ colors: ["gold", "white", "black"] }),
    );
    expect(withColors[0]?.result.colors).toEqual([
      "gold",
      "white",
      "black",
    ]);

    const singleColor = expandProduct(baseProduct({ colors: ["gold"] }));
    expect(singleColor[0]?.result.colors).toBeUndefined();

    const noColors = expandProduct(baseProduct({ colors: [] }));
    expect(noColors[0]?.result.colors).toBeUndefined();
  });

  it("carries colors onto each expanded HDD variant", () => {
    const expanded = expandProduct(
      baseProduct({
        hddOptions: ["128", "256"],
        colors: ["gold", "black"],
      }),
    );

    expect(expanded).toHaveLength(2);
    for (const entry of expanded) {
      expect(entry.result.colors).toEqual(["gold", "black"]);
    }
  });

  it("prices relative to a non-default active HDD swatch", () => {
    // Displayed price is for active 256 (= true 128-base + $20).
    const expanded = expandProduct(
      baseProduct({
        basePriceCents: 120_788,
        activeHdd: "256",
        hddOptions: ["128", "256", "512"],
      }),
    );

    expect(expanded.map((e) => e.priceCents)).toEqual([
      118_788,
      120_788,
      122_788,
    ]);
  });
});
