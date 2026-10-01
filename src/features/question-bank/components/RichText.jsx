import { MarkdownText } from '../../set-paper/components/MarkdownText';

// Question text is stored as raw Markdown + LaTeX (same as the paper builder
// and AI-generated papers), so every place that shows it has to go through the
// shared KaTeX renderer instead of printing the raw `$...$` source.

export function RichText({ children, inline, className = '' }) {
  return (
    <div className={`qb-rich ${className}`.trim()}>
      <MarkdownText inline={inline}>{children}</MarkdownText>
    </div>
  );
}

// Variant for running inline next to a label or inside a list item, so the
// rendered math flows in the same paragraph as the surrounding text.
export function RichTextInline({ children }) {
  return <MarkdownText inline>{children}</MarkdownText>;
}

// Clamped renderer for table cells: clamping happens in CSS so the LaTeX stays
// intact instead of being sliced mid-delimiter by a character truncation.
export function RichTextPreview({ children, lines = 3, className = '' }) {
  return (
    <div
      className={`qb-rich qb-rich-clamp ${className}`.trim()}
      style={{ '--qb-clamp-lines': lines }}
    >
      <MarkdownText>{children}</MarkdownText>
    </div>
  );
}

// Readable plain-text projection of Markdown/LaTeX source, used for search,
// sorting and aria-labels where KaTeX markup would be noise.
export function plainText(value) {
  return String(value ?? '')
    .replace(/\$\$([\s\S]*?)\$\$|\$([^$\n]*?)\$/g, (_, display, inlineText) => ` ${display ?? inlineText} `)
    .replace(/\\\[([\s\S]*?)\\\]/g, ' $1 ')
    .replace(/\\\(([\s\S]*?)\\\)/g, ' $1 ')
    .replace(/\\([a-zA-Z]+)/g, ' ')
    .replace(/[{}\\_^~&]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}