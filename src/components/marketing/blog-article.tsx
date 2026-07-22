import React from "react";

export function BlogArticle({
  content,
}: {
  content: Array<{ type: "p" | "h2" | "h3" | "ul"; text?: string; items?: string[] }>;
}) {
  return (
    <div className="space-y-6 text-[var(--ln-ink-soft)]">
      {content.map((block, i) => {
        if (block.type === "p") {
          return (
            <p key={i} className="text-base leading-relaxed text-[var(--ln-muted)]">
              {block.text}
            </p>
          );
        }
        if (block.type === "h2") {
          return (
            <h2 key={i} className="pt-4 font-display text-2xl font-medium text-[var(--ln-ink)]">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={i} className="pt-2 font-display text-xl font-medium text-[var(--ln-ink)]">
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="space-y-2 pl-5 text-sm leading-relaxed text-[var(--ln-muted)]">
              {(block.items || []).map((item) => (
                <li key={item} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}
