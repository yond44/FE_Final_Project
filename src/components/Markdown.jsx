import React from "react";

// The backend occasionally emits markdown where the closing "**"/"*" of an
// emphasis span gets split across a line break, e.g.
//   "**key risk factors*\n* affecting crypto"   (should be **key risk factors**)
//   "*QRIS\n"                                    (closing "*" missing entirely)
// This collapses the split-marker case back into a clean "**"/"*" BEFORE we
// ever try to parse blocks/lines, so the pair lands on the same line again.
function repairBrokenMarkers(text) {
  return text
    // "*\n*" (optionally with trailing/leading spaces) -> "**"
    .replace(/\*[ \t]*\n[ \t]*\*/g, "**")
    // stray "**" that ended up alone on its own line (nothing to pair with)
    // gets folded into the surrounding text so it doesn't become a lone block
    .replace(/\n[ \t]*\*\*[ \t]*\n/g, "\n");
}

// Inline formatting: **bold**, `code`, *italic* / _italic_
// Anything that never finds a matching closing marker inside this chunk of
// text is treated as noise and stripped, rather than printed as a literal
// asterisk/underscore — a broken marker should never "leak" to the reader.
function InlineMarkdown({ text }) {
  const nodes = [];
  const regex = /\*\*(.+?)\*\*|`([^`]+)`|\*([^*\n]+?)\*|_([^_\n]+?)_/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  const pushPlain = (chunk) => {
    if (!chunk) return;
    // Strip any leftover, unpaired emphasis markers instead of showing them.
    const cleaned = chunk.replace(/\*\*|\*|_/g, "");
    if (cleaned) nodes.push(cleaned);
  };

  while ((match = regex.exec(text)) !== null) {
    pushPlain(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={i++} className="font-semibold text-ink">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <code key={i++} className="rounded bg-[#f1ede3] px-1 py-0.5 font-mono text-[12px] text-ink2">
          {match[2]}
        </code>
      );
    } else if (match[3] !== undefined || match[4] !== undefined) {
      nodes.push(
        <em key={i++} className="text-ink2">
          {match[3] ?? match[4]}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  pushPlain(text.slice(lastIndex));

  return <>{nodes}</>;
}

// Block-level: paragraphs, #/##/### headers, -/*/• lists, 1. lists
export default function Markdown({ text }) {
  if (!text) return null;

  const lines = repairBrokenMarkers(text.replace(/\r\n/g, "\n")).split("\n");
  const blocks = [];
  let i = 0;

  const isHeading = (l) => /^(#{1,4})\s+(.*)/.test(l);
  const isBullet = (l) => /^[-*•]\s+/.test(l);
  const isNumbered = (l) => /^\d+\.\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2] });
      i++;
      continue;
    }

    if (isBullet(line)) {
      const items = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (isNumbered(line)) {
      const items = [];
      while (i < lines.length && isNumbered(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !isHeading(lines[i]) && !isBullet(lines[i]) && !isNumbered(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: paraLines.join(" ") });
  }

  const headingClass = { 1: "text-base font-serif font-semibold", 2: "text-[15px] font-semibold", 3: "text-sm font-semibold", 4: "text-sm font-semibold" };

  return (
    <div className="space-y-2.5">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          return (
            <div key={idx} className={`${headingClass[b.level] || headingClass[4]} pt-1 text-ink`}>
              <InlineMarkdown text={b.content} />
            </div>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-5 marker:text-gold">
              {b.items.map((it, j) => (
                <li key={j} className="leading-relaxed">
                  <InlineMarkdown text={it} />
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal space-y-1 pl-5 marker:text-gold">
              {b.items.map((it, j) => (
                <li key={j} className="leading-relaxed">
                  <InlineMarkdown text={it} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="leading-relaxed">
            <InlineMarkdown text={b.content} />
          </p>
        );
      })}
    </div>
  );
}