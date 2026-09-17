import { describe, expect, it } from "vitest";
import { aggregateProducts } from "../src/aggregate.js";
import type { ParsedProduct } from "../src/types.js";

describe("aggregateProducts", () => {
  it("sorts by product id, expands HDD, and totals in cents", () => {
    const products: ParsedProduct[] = [
      {
        url: "https://webscraper.io/test-sites/e-commerce/static/product/10",
        productId: 10,
        name: "Lenovo IdeaTab",
        description: "7\" screen, Android",
        basePriceCents: 6999,
        activeHdd: "128",
        hddOptions: ["128", "256"],
        colors: ["gold", "white", "black"],
      },
      {
        url: "https://webscraper.io/test-sites/e-commerce/static/product/1",
        productId: 1,
        name: "Nokia 123",
        description: "7 day battery",
        basePriceCents: 2499,
        activeHdd: null,
        hddOptions: [],
        colors: ["gold", "white", "black"],
      },
    ];

    const output = aggregateProducts(products);

    expect(output.results.map((r) => r.name)).toEqual([
      "Nokia 123",
      "Lenovo IdeaTab 128 GB",
      "Lenovo IdeaTab 256 GB",
    ]);

    // 24.99 + 69.99 + 89.99 = 184.97
    expect(output.total).toBe(184.97);
    expect(
      output.results.reduce((sum, r) => sum + Math.round(r.price * 100), 0) /
        100,
    ).toBe(output.total);
  });
});
