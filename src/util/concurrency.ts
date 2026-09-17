/**
 * Run async work over `items` with at most `limit` tasks in flight.
 * Results are returned in the same order as `items`.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const concurrency = Math.max(1, Math.min(limit, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) {
        return;
      }
      results[current] = await worker(items[current] as T, current);
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, () => runWorker()),
  );

  return results;
}
