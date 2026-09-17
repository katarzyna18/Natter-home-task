#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { scrapeSite } from "./scrape.js";

function parseArgs(argv: readonly string[]): { outPath: string | null } {
  let outPath: string | null = null;
  const args = [...argv];

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === undefined) {
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      const value = args.shift();
      if (!value || value.startsWith("-")) {
        throw new Error("Missing path after --output / -o");
      }
      outPath = value;
      continue;
    }

    if (arg.startsWith("--output=")) {
      const value = arg.slice("--output=".length);
      if (!value) {
        throw new Error("Missing path after --output=");
      }
      outPath = value;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        "Usage: ecommerce-scraper [output.json] [-o <file>]\n" +
          "  [file]         Write UTF-8 JSON to this path (recommended on Windows)\n" +
          "  --output, -o   Same as positional file path\n" +
          "  --help, -h     Show this help\n",
      );
      process.exit(0);
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    // Positional output path. Useful because some npm/PowerShell setups
    // strip -o/--output and only forward the filename.
    if (outPath !== null) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
    outPath = arg;
  }

  return { outPath };
}

async function main(): Promise<void> {
  const { outPath } = parseArgs(process.argv.slice(2));

  const output = await scrapeSite({
    onWarning: (message) => {
      console.error(message);
    },
  });

  const json = `${JSON.stringify(output, null, 2)}\n`;

  if (outPath) {
    // Write via Node so the file is always UTF-8 (PowerShell `>` uses UTF-16).
    await writeFile(outPath, json, "utf8");
    console.error(`Wrote ${outPath}`);
    return;
  }

  // stdout must contain only valid JSON for piping
  process.stdout.write(json);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : `Unexpected error: ${String(error)}`;
  console.error(message);
  process.exitCode = 1;
});
