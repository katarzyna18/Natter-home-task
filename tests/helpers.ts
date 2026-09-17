import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

export function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}
