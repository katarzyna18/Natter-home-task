import { describe, expect, it } from "vitest";
import { parsePriceToCents, centsToDollars, sumCents } from "../src/util/money.js";

describe("parsePriceToCents", () => {
  it('parses "$1178.19" into cents', () => {
    expect(parsePriceToCents("$1178.19")).toBe(117_819);
  });

  it("parses whole-dollar prices", () => {
    expect(parsePriceToCents("$679")).toBe(67_900);
  });

  it('parses "$0.99"', () => {
    expect(parsePriceToCents("$0.99")).toBe(99);
  });

  it("trims whitespace around prices", () => {
    expect(parsePriceToCents("  $93.99  ")).toBe(9399);
  });

  it("ignores commas and currency symbols", () => {
    expect(parsePriceToCents("$1,178.19")).toBe(117_819);
  });

  it("returns null for invalid input", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("n/a")).toBeNull();
  });
});

describe("money helpers", () => {
  it("converts cents to dollars", () => {
    expect(centsToDollars(117_819)).toBe(1178.19);
  });

  it("sums cents without floating-point drift", () => {
    expect(centsToDollars(sumCents([10, 20, 30]))).toBe(0.6);
  });
});
