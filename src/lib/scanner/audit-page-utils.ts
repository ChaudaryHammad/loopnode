import * as cheerio from "cheerio";
import type { Page } from "puppeteer";

const VIDEO_EMBED_HOSTS = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
  "dailymotion.com",
  "wistia.com",
  "brightcove.com",
  "player.vimeo.com",
];

const STREAMING_URL_PATTERN = /\.(m3u8|mpd)(\?|$)/i;

function isVideoEmbedUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return VIDEO_EMBED_HOSTS.some((host) => lower.includes(host));
}

function shouldAbortAuditRequest(
  resourceType: string,
  url: string,
  isNavigationRequest: boolean
): boolean {
  if (resourceType === "media") return true;

  if (
    resourceType === "websocket" ||
    resourceType === "eventsource" ||
    STREAMING_URL_PATTERN.test(url)
  ) {
    return true;
  }

  if (isNavigationRequest && resourceType === "document" && isVideoEmbedUrl(url)) {
    return true;
  }

  return false;
}

/** Stop autoplay and block open-ended media/streaming requests during audits. */
export async function prepareAuditPage(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    HTMLMediaElement.prototype.play = function playStub() {
      return Promise.resolve();
    };

    try {
      Object.defineProperty(HTMLMediaElement.prototype, "autoplay", {
        configurable: true,
        set() {},
        get() {
          return false;
        },
      });
    } catch {
      // Some environments may not allow overriding autoplay.
    }
  });

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    const url = request.url();
    const resourceType = request.resourceType();

    if (shouldAbortAuditRequest(resourceType, url, request.isNavigationRequest())) {
      void request.abort().catch(() => undefined);
      return;
    }

    void request.continue().catch(() => undefined);
  });
}

/** Tear down active players so later CDP calls do not wait on decoding/buffering. */
export async function stabilizePageMedia(page: Page): Promise<void> {
  await page.evaluate((embedHosts) => {
    document.querySelectorAll("video, audio").forEach((element) => {
      const media = element as HTMLMediaElement;
      try {
        media.pause();
        media.removeAttribute("autoplay");
        media.removeAttribute("src");
        media.querySelectorAll("source").forEach((source) => {
          source.removeAttribute("src");
        });
        media.load();
      } catch {
        // Ignore elements that cannot be reset.
      }
    });

    document.querySelectorAll("iframe").forEach((iframe) => {
      const src = iframe.getAttribute("src")?.toLowerCase() ?? "";
      if (embedHosts.some((host: string) => src.includes(host))) {
        iframe.removeAttribute("src");
      }
    });
  }, VIDEO_EMBED_HOSTS);
}

/** Strip media from cloned HTML so accessibility setContent does not restart players. */
export function sanitizeHtmlForAccessibilityAudit(html: string): string {
  const $ = cheerio.load(html);

  $("video, audio").each((_, element) => {
    const node = $(element);
    node.removeAttr("src autoplay loop muted playsinline preload");
    node.removeAttr("data-src data-video-id");
    node.empty();
  });

  $("iframe").each((_, element) => {
    const node = $(element);
    const src = (node.attr("src") ?? "").toLowerCase();
    if (isVideoEmbedUrl(src)) {
      node.removeAttr("src");
    }
  });

  $("script[src]").each((_, element) => {
    const src = ($(element).attr("src") ?? "").toLowerCase();
    if (
      isVideoEmbedUrl(src) ||
      src.includes("videojs") ||
      src.includes("hls.js") ||
      src.includes("dash.js")
    ) {
      $(element).remove();
    }
  });

  return $.html();
}
