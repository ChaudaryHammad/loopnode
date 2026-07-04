export function parseElementSnippet(html: string | undefined) {
  if (!html?.trim()) return {};
  const tagMatch = html.match(/^<([a-z0-9-]+)/i);
  const idMatch = html.match(/\bid=["']([^"']+)["']/i);
  const classMatch = html.match(/\bclass=["']([^"']+)["']/i);
  return {
    elementTag: tagMatch?.[1],
    elementId: idMatch?.[1],
    elementClass: classMatch?.[1],
  };
}
