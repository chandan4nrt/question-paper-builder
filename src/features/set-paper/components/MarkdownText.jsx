import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';

const MATH_TOKEN_PREFIX = '\uE000MATH';

function restoreMath(text, mathParts) {
  return String(text).replace(/\uE000MATH(\d+)\uE001/g, (_, index) => mathParts[Number(index)] ?? '');
}

// Renders the raw AI content as Markdown + LaTeX instead of pre-stripping
// formatting at parse time. KaTeX handles arbitrary nested math inside
// `$...$` / `$$...$$` (including `\text`, `\textbf`, `\textit`, `\frac`, ...),
// and remark parses bold/italic/list/heading markdown.
function normalizeLatexTextCommands(source) {
  const input = String(source ?? '');
  const mathParts = [];
  const protectedInput = input.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (match) => {
    const token = `${MATH_TOKEN_PREFIX}${mathParts.length}\uE001`;
    mathParts.push(match);
    return token;
  });

  let output = protectedInput;
  for (let i = 0; i < 5; i += 1) {
    const next = output
      .replace(/\\textbf\s*\{([^{}]*)\}/g, '**$1**')
      .replace(/\\(?:textit|emph)\s*\{([^{}]*)\}/g, '*$1*')
      .replace(/\\text\s*\{([^{}]*)\}/g, '$1');
    if (next === output) break;
    output = next;
  }

  return restoreMath(output, mathParts);
}

// `$$...$$` on a single line would otherwise be parsed as inline math, so
// promote it to block math (mirrors how MathText rendered `$$...$$`).
function promoteDisplayMath(text) {
  return String(text ?? '').replace(/\$\$([\s\S]+?)\$\$/g, (_match, inner) => {
    return `\n\n$$\n${inner.trim()}\n$$\n\n`;
  });
}

function isInlineOnly(text) {
  const t = String(text ?? '').trim();
  if (!t) return true;
  if (/\n\s*\n/.test(t)) return false;
  for (const raw of t.split('\n')) {
    const line = raw.trim();
    if (/^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```)/.test(line)) return false;
  }
  return true;
}

function MarkdownTextInternal({ children, inline }) {
  const source = useMemo(() => promoteDisplayMath(normalizeLatexTextCommands(children)), [children]);
  const inlineOnly = inline === undefined ? isInlineOnly(source) : inline;

  const components = inlineOnly
    ? {
        p: ({ children: nodeChildren }) => <span>{nodeChildren}</span>,
      }
    : undefined;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkBreaks]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
      components={components}
    >
      {source}
    </ReactMarkdown>
  );
}

export const MarkdownText = memo(MarkdownTextInternal);