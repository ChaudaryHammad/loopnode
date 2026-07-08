import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { Font, renderToBuffer } from "@react-pdf/renderer";

/**
 * react-pdf hyphenates by joining syllables with a visible "-".
 * Returning alternating char + empty string allows line breaks without painting hyphens.
 * Must be registered before any document render.
 */
Font.registerHyphenationCallback((word) => {
  if (!word) return [""];
  const parts: string[] = [""];
  for (const char of word) {
    parts.push(char, "");
  }
  return parts;
});

export async function renderReactPdfToBuffer(
  document: ReactElement<DocumentProps>
): Promise<Buffer> {
  const buffer = await renderToBuffer(document);
  return Buffer.from(buffer);
}
