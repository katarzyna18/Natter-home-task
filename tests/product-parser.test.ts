import { describe, expect, it } from "vitest";
import { parseProductHtml } from "../src/parse/product.js";
import { loadFixture } from "./helpers.js";

const PRODUCT_URL =
  "https://webscraper.io/test-sites/e-commerce/static/product/119";

describe("parseProductHtml", () => {
  it("extracts name, description, price, and enabled HDD options", () => {
    const product = parseProductHtml(loadFixture("product-hdd.html"), PRODUCT_URL);

    expect(product.name).toBe("Dell Latitude 5480");
    expect(product.description).toContain('14" FHD');
    expect(product.basePriceCents).toBe(118_788);
    expect(product.hddOptions).toEqual(["128", "256", "512"]);
    expect(product.activeHdd).toBe("128");
    expect(product.colors).toEqual([]);
    expect(product.productId).toBe(119);
  });

  it("extracts multiple colors and lowercases them", () => {
    const product = parseProductHtml(
      loadFixture("product-colors.html"),
      "https://webscraper.io/test-sites/e-commerce/static/product/1",
    );

    expect(product.name).toBe("Nokia 123");
    expect(product.colors).toEqual(["gold", "white", "black"]);
    expect(product.hddOptions).toEqual([]);
  });

  it("parses combined HDD and color products", () => {
    const product = parseProductHtml(
      loadFixture("product-hdd-and-colors.html"),
      "https://webscraper.io/test-sites/e-commerce/static/product/24",
    );

    expect(product.name).toBe("Galaxy Note 10.1");
    expect(product.hddOptions).toEqual(["128", "256", "512"]);
    expect(product.colors).toEqual(["gold", "white", "black"]);
  });

  it("handles products without configurations", () => {
    const product = parseProductHtml(
      loadFixture("product-plain.html"),
      "https://webscraper.io/test-sites/e-commerce/static/product/48",
    );

    expect(product.name).toBe("Acer Aspire A515-51-5654");
    expect(product.basePriceCents).toBe(67_900);
    expect(product.activeHdd).toBeNull();
    expect(product.hddOptions).toEqual([]);
    expect(product.colors).toEqual([]);
  });

  it("records the active HDD swatch", () => {
    const product = parseProductHtml(loadFixture("product-hdd.html"), PRODUCT_URL);
    expect(product.activeHdd).toBe("128");
  });

  it("throws when the product wrapper is missing", () => {
    expect(() =>
      parseProductHtml("<html><body>no product</body></html>", PRODUCT_URL),
    ).toThrow(/Missing \.product-wrapper/);
  });

  it("throws when the product name is missing", () => {
    const html = `
      <div class="product-wrapper">
        <span itemprop="price">$10.00</span>
        <p class="description">desc</p>
      </div>
    `;
    expect(() => parseProductHtml(html, PRODUCT_URL)).toThrow(/Missing product name/);
  });
});
