/**
 * Parse a display price like "$1,178.19" or "$679" into integer cents.
 * Returns null when the value cannot be parsed.
 */
export function parsePriceToCents(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned || cleaned === ".") {
    return null;
  }

  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return null;
  }

  const dollars = parts[0] ?? "0";
  const fraction = (parts[1] ?? "00").padEnd(2, "0").slice(0, 2);

  if (!/^\d+$/.test(dollars) || !/^\d{2}$/.test(fraction)) {
    return null;
  }

  return Number.parseInt(dollars, 10) * 100 + Number.parseInt(fraction, 10);
}

/** Convert integer cents to a decimal dollar number suitable for JSON. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Sum integer cent amounts. */
export function sumCents(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
