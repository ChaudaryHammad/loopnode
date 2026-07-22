import type { Page, HTTPRequest } from "puppeteer";

const BLOCKED_RESOURCE_TYPES = new Set(["media", "font"]);

const BLOCKED_URL_PATTERNS = [
  /\.(mp4|webm|m3u8|mpd|avi|mov|mkv)(\?|$)/i,
  /youtube\.com/i,
  /youtu\.be/i,
  /vimeo\.com/i,
  /dailymotion\.com/i,
  /tiktok\.com/i,
  /facebook\.com\/.*\/videos/i,
];

export function shouldBlockAuditRequest(request: HTTPRequest): boolean {
  if (BLOCKED_RESOURCE_TYPES.has(request.resourceType())) {
    return true;
  }

  const url = request.url();
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

export async function configureAuditPage(page: Page): Promise<void> {
  await page.setRequestInterception(true);

  page.on("request", (request) => {
    if (shouldBlockAuditRequest(request)) {
      void request.abort("blockedbyclient");
      return;
    }
    void request.continue();
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 HealthMeshAudit/1.0"
  );
}
