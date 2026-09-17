import { describe, expect, it } from "vitest";
import {
  extractLinks,
  isProductUrl,
  normalizeUrl,
} from "../src/discover.js";
import { BASE_URL } from "../src/config.js";

describe("URL discovery helpers", () => {
  it("normalizes relative product links and strips hashes", () => {
    expect(
      normalizeUrl(
        "/test-sites/e-commerce/static/product/10#reviews",
        BASE_URL,
      ),
    ).toBe("https://webscraper.io/test-sites/e-commerce/static/product/10");
  });

  it("rejects out-of-scope links", () => {
    expect(normalizeUrl("/about-us", BASE_URL)).toBeNull();
    expect(
      normalizeUrl(
        "https://webscraper.io/test-sites/e-commerce/ajax/product/10",
        BASE_URL,
      ),
    ).toBeNull();
  });

  it("detects product URLs", () => {
    expect(
      isProductUrl(
        "https://webscraper.io/test-sites/e-commerce/static/product/24",
      ),
    ).toBe(true);
    expect(
      isProductUrl(
        "https://webscraper.io/test-sites/e-commerce/static/computers/laptops",
      ),
    ).toBe(false);
  });

  it("extracts unique in-scope links from listing HTML", () => {
    const html = `
      <a href="/test-sites/e-commerce/static/product/1">One</a>
      <a href="/test-sites/e-commerce/static/product/1">Dup</a>
      <a href="/test-sites/e-commerce/static/computers/laptops?page=2">Page</a>
      <a href="/about-us">Ignore</a>
    `;
    const links = extractLinks(html, BASE_URL).sort();
    expect(links).toEqual([
      "https://webscraper.io/test-sites/e-commerce/static/computers/laptops?page=2",
      "https://webscraper.io/test-sites/e-commerce/static/product/1",
    ]);
  });
});
