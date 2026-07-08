import * as cheerio from "cheerio";
import {
  type LinkResourceType,
  classifyLinkResource,
} from "@/lib/scanner/link-resource-types";
import {
  buildElementSelector,
  isCrawlablePageUrl,
  isSameOrigin,
  normalizeUrl,
} from "@/lib/scanner/url-utils";
import type { ExtractedLink } from "./types";

interface LinkElementConfig {
  selector: string;
  attribute: "href" | "src";
}

const LINK_SELECTORS: LinkElementConfig[] = [
  { selector: "a[href]", attribute: "href" },
  { selector: "link[href]", attribute: "href" },
  { selector: "img[src]", attribute: "src" },
  { selector: "script[src]", attribute: "src" },
  { selector: "iframe[src]", attribute: "src" },
  { selector: "source[src]", attribute: "src" },
  { selector: "video[src]", attribute: "src" },
  { selector: "audio[src]", attribute: "src" },
];

export function extractLinksFromHtml(
  html: string,
  sourcePageUrl: string,
  siteOrigin: string
): { pageLinks: ExtractedLink[]; internalPageUrls: string[] } {
  const $ = cheerio.load(html);
  const pageLinks: ExtractedLink[] = [];
  const internalPageUrls: string[] = [];

  for (const { selector, attribute } of LINK_SELECTORS) {
    $(selector).each((index, el) => {
      const raw = $(el).attr(attribute);
      if (
        !raw ||
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:") ||
        raw.startsWith("javascript:")
      ) {
        return;
      }

      const normalized = normalizeUrl(raw, sourcePageUrl);
      if (!normalized) return;

      const tag = String($(el).prop("tagName") ?? "a").toLowerCase();
      const id = $(el).attr("id") ?? undefined;
      const className = $(el).attr("class") ?? undefined;
      const rel = $(el).attr("rel") ?? undefined;
      const text =
        tag === "a"
          ? $(el).text().trim().slice(0, 120) || undefined
          : $(el).attr("alt")?.trim() || $(el).attr("title")?.trim() || undefined;

      const internal = isSameOrigin(normalized, siteOrigin);

      pageLinks.push({
        href: normalized,
        sourcePageUrl,
        tag,
        id,
        className,
        text,
        selector: buildElementSelector(tag, id, className, index),
        attribute,
        isInternal: internal,
        resourceType: classifyLinkResource(tag, attribute, normalized, rel),
      });

      if (internal && attribute === "href" && isCrawlablePageUrl(normalized, siteOrigin)) {
        internalPageUrls.push(normalized);
      }
    });
  }

  return { pageLinks, internalPageUrls };
}

export function filterLinksForCheck(
  links: ExtractedLink[],
  mode: "INTERNAL" | "EXTERNAL",
  resourceTypes: LinkResourceType[]
): ExtractedLink[] {
  const allowed = new Set(resourceTypes);
  return links.filter((link) => {
    const scopeMatch = mode === "INTERNAL" ? link.isInternal : !link.isInternal;
    return scopeMatch && allowed.has(link.resourceType);
  });
}
