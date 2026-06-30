import type { Browser, Page } from "puppeteer";
import { launchBrowser } from "./launch-browser";

export const RENDERED_PAGE_USER_AGENT = "LoopNode-LinkChecker/1.0";

const PAGE_NAV_TIMEOUT_MS = 30_000;
const NETWORK_SETTLE_MS = 800;
const POST_SCROLL_WAIT_MS = 1_500;
const HYDRATION_WAIT_MS = 1_200;
const BROWSER_CLOSE_TIMEOUT_MS = 5_000;

interface LinkElementConfig {
  selector: string;
  attribute: string;
}

const LINK_ELEMENT_CONFIGS: LinkElementConfig[] = [
  { selector: "a[href]", attribute: "href" },
  { selector: "a[data-href]", attribute: "data-href" },
  { selector: "area[href]", attribute: "href" },
  { selector: "link[href]", attribute: "href" },
  { selector: "img[src]", attribute: "src" },
  { selector: "img[data-src]", attribute: "data-src" },
  { selector: "script[src]", attribute: "src" },
  { selector: "iframe[src]", attribute: "src" },
  { selector: "source[src]", attribute: "src" },
  { selector: "video[src]", attribute: "src" },
  { selector: "audio[src]", attribute: "src" },
  { selector: "embed[src]", attribute: "src" },
  { selector: "object[data]", attribute: "data" },
];

const SKIP_URL_PREFIXES = ["#", "javascript:"];

export interface RawDomLink {
  rawUrl: string;
  tag: string;
  id: string | null;
  className: string | null;
  text: string | null;
  attribute: string;
  rel: string | null;
  index: number;
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const distance = 400;
      const delay = 120;
      let scrollTop = 0;
      const maxScroll = Math.max(
        document.body?.scrollHeight ?? 0,
        document.documentElement?.scrollHeight ?? 0
      );

      const step = () => {
        scrollTop = Math.min(scrollTop + distance, maxScroll);
        window.scrollTo(0, scrollTop);
        if (scrollTop >= maxScroll) {
          window.scrollTo(0, 0);
          resolve();
          return;
        }
        setTimeout(step, delay);
      };

      if (maxScroll <= window.innerHeight) {
        resolve();
        return;
      }

      step();
    });
  });
}

async function waitForNetworkSettle(page: Page, idleMs: number, maxWaitMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    let inflight = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      clearTimeout(hardTimeout);
      if (idleTimer) clearTimeout(idleTimer);
      page.off("request", onRequest);
      page.off("requestfinished", onDone);
      page.off("requestfailed", onDone);
      resolve();
    };

    const scheduleIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (inflight <= 0) cleanup();
      }, idleMs);
    };

    const onRequest = () => {
      inflight += 1;
      if (idleTimer) clearTimeout(idleTimer);
    };

    const onDone = () => {
      inflight = Math.max(0, inflight - 1);
      scheduleIdle();
    };

    const hardTimeout = setTimeout(cleanup, maxWaitMs);

    page.on("request", onRequest);
    page.on("requestfinished", onDone);
    page.on("requestfailed", onDone);
    scheduleIdle();
  });
}

async function waitForDynamicContent(page: Page): Promise<void> {
  await page
    .waitForFunction(() => document.readyState === "complete", {
      timeout: PAGE_NAV_TIMEOUT_MS,
    })
    .catch(() => undefined);

  await page
    .evaluate(async (hydrationWait) => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      await new Promise((r) => setTimeout(r, hydrationWait));
    }, HYDRATION_WAIT_MS)
    .catch(() => undefined);
}

async function extractLinksInBrowser(page: Page): Promise<RawDomLink[]> {
  return page.evaluate(
    (configs, skipPrefixes) => {
      const results: RawDomLink[] = [];
      const seen = new WeakSet<Element>();

      const shouldSkip = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return true;
        const lower = trimmed.toLowerCase();
        return skipPrefixes.some((prefix: string) => lower.startsWith(prefix));
      };

      const pushLink = (
        el: Element,
        rawUrl: string,
        attribute: string,
        index: number
      ) => {
        if (shouldSkip(rawUrl)) return;

        const tag = el.tagName.toLowerCase();
        results.push({
          rawUrl,
          tag,
          id: el.id || null,
          className: el.getAttribute("class"),
          text:
            tag === "a"
              ? (el.textContent?.trim().slice(0, 120) || null)
              : el.getAttribute("alt")?.trim() ||
                el.getAttribute("title")?.trim() ||
                null,
          attribute,
          rel: el.getAttribute("rel"),
          index,
        });
      };

      const walkRoot = (scope: Document | ShadowRoot | Element) => {
        for (const { selector, attribute } of configs as LinkElementConfig[]) {
          scope.querySelectorAll(selector).forEach((el, index) => {
            if (seen.has(el)) return;
            seen.add(el);

            const raw = el.getAttribute(attribute);
            if (raw) pushLink(el, raw, attribute, index);

            const tag = el.tagName.toLowerCase();
            if (tag === "img" || tag === "source") {
              const srcset = el.getAttribute("srcset");
              if (srcset) {
                srcset.split(",").forEach((part, srcsetIndex) => {
                  const candidate = part.trim().split(/\s+/)[0];
                  if (candidate) pushLink(el, candidate, "srcset", srcsetIndex);
                });
              }
            }
          });
        }

        scope.querySelectorAll("*").forEach((el) => {
          const shadow = (el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot;
          if (shadow) walkRoot(shadow);
        });
      };

      walkRoot(document);
      return results;
    },
    LINK_ELEMENT_CONFIGS,
    SKIP_URL_PREFIXES
  );
}

async function navigateAndPreparePage(page: Page, pageUrl: string): Promise<boolean> {
  await page.setUserAgent(RENDERED_PAGE_USER_AGENT);
  await page.setViewport({ width: 1280, height: 800 });

  let navigated = false;

  try {
    const response = await page.goto(pageUrl, {
      waitUntil: "networkidle2",
      timeout: PAGE_NAV_TIMEOUT_MS,
    });
    navigated = true;
    const contentType = response?.headers()?.["content-type"] ?? "";
    if (contentType && !contentType.includes("text/html")) return false;
  } catch {
    try {
      const response = await page.goto(pageUrl, {
        waitUntil: "load",
        timeout: PAGE_NAV_TIMEOUT_MS,
      });
      navigated = true;
      const contentType = response?.headers()?.["content-type"] ?? "";
      if (contentType && !contentType.includes("text/html")) return false;
    } catch {
      return false;
    }
  }

  if (!navigated) return false;

  await waitForDynamicContent(page);
  await waitForNetworkSettle(page, NETWORK_SETTLE_MS, 8_000);
  await autoScroll(page);
  await page.evaluate((waitMs) => new Promise((r) => setTimeout(r, waitMs)), POST_SCROLL_WAIT_MS);
  await waitForNetworkSettle(page, NETWORK_SETTLE_MS, 5_000);

  return true;
}

export async function fetchRenderedPageLinks(
  browser: Browser,
  pageUrl: string
): Promise<RawDomLink[] | null> {
  const page = await browser.newPage();
  try {
    const ready = await navigateAndPreparePage(page, pageUrl);
    if (!ready) return null;
    return await extractLinksInBrowser(page);
  } catch {
    return null;
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function createRenderedPageBrowser(): Promise<Browser> {
  return launchBrowser();
}

export async function closeRenderedPageBrowser(browser: Browser): Promise<void> {
  const closePromise = browser.close();
  const timeoutPromise = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), BROWSER_CLOSE_TIMEOUT_MS);
  });

  const result = await Promise.race([closePromise, timeoutPromise]);
  if (result === "timeout") {
    browser.process()?.kill("SIGKILL");
  }
}

export { LINK_ELEMENT_CONFIGS };
