import { describe, expect, it, vi } from "vitest";
import { HttpClient, HttpError } from "../src/http/client.js";

describe("HttpClient", () => {
  it("retries timeouts and eventually succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error("Aborted"), { name: "AbortError" }),
      )
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html>ok</html>",
      });

    const client = new HttpClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxRetries: 2,
      timeoutMs: 50,
    });

    await expect(client.getText("https://example.com")).resolves.toBe(
      "<html>ok</html>",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent 404 errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const client = new HttpClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxRetries: 2,
    });

    await expect(client.getText("https://example.com/missing")).rejects.toBeInstanceOf(
      HttpError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
