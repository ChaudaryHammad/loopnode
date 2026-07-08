import { ScanCancelledError } from "@/lib/scanner/scan-errors";

type CancelCheck = () => Promise<boolean>;

export async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  shouldCancel?: CancelCheck
): Promise<void> {
  if (items.length === 0) return;

  let nextIndex = 0;
  let stopped = false;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!stopped) {
      if (shouldCancel && (await shouldCancel())) {
        stopped = true;
        return;
      }

      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;

      const current = items[currentIndex];
      if (current === undefined) continue;

      await worker(current);
    }
  });

  await Promise.all(runners);

  if (shouldCancel && (await shouldCancel())) {
    throw new ScanCancelledError();
  }
}
