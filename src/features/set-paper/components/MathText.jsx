import { useMemo } from 'react';
import katex from 'katex';

function renderMath(expression, displayMode) {
  try {
    let cleaned = String(expression ?? '').trim();
    // Decode common HTML entities that might have been escaped
    cleaned = cleaned.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    // Normalize double-escaped backslashes before LaTeX macros: e.g. \\frac -> \frac
    cleaned = cleaned.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
    return katex.renderToString(cleaned, {
      throwOnError: false,
      displayMode,
      trust: true,
      strict: false,
      output: 'htmlAndMathml',
    });
  } catch {
    return expression;
  }
}

function splitRawLatex(text) {
  const tokens = [];
  let cursor = 0;
  const pattern = /(\\(?:frac|dfrac|tfrac|binom)\s*\{[^{}]*\}\s*\{[^{}]*\}|\\sqrt\s*(?:\[[^\]]*\])?\s*\{[^{}]*\}|\\[a-zA-Z]+(?:\s*\{[^{}]*\})*(?:_\{[^{}]*\}|\^\{[^{}]*\}|_[0-9a-zA-Z]|\^[0-9a-zA-Z])*|[a-zA-Z0-9]+(?:\^\{[^{}]*\}|_\{[^{}]*\}|\^[0-9a-zA-Z]+|_[0-9a-zA-Z]+)+)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, match.index) });
    }
    tokens.push({ type: 'inline', value: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) });
  }
  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }];
}

function splitMath(text) {
  if (!text) return [];
  const str = String(text);
  const tokens = [];
  let cursor = 0;

  // Patterns for standard math blocks and inline math
  // 1: $$ ... $$
  // 2: \[ ... \] or \\[ ... \\]
  // 3: \begin{env} ... \end{env}
  // 4: \( ... \) or \\( ... \\)
  // 5: $ ... $
  const pattern = /\$\$([\s\S]+?)\$\$|\\(?:\\)?\[([\s\S]+?)\\(?:\\)?\]|(\\begin\{(?:align\*?|equation\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|cases)\}[\s\S]+?\\end\{(?:align\*?|equation\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|cases)\})|\\(?:\\)?\(([\s\S]+?)\\(?:\\)?\)|\$([^\$]+?)\$/g;

  let match;
  while ((match = pattern.exec(str)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: 'text', value: str.slice(cursor, match.index) });
    }
    if (match[1] != null) {
      tokens.push({ type: 'block', value: match[1].trim() });
    } else if (match[2] != null) {
      tokens.push({ type: 'block', value: match[2].trim() });
    } else if (match[3] != null) {
      tokens.push({ type: 'block', value: match[3].trim() });
    } else if (match[4] != null) {
      tokens.push({ type: 'inline', value: match[4].trim() });
    } else if (match[5] != null) {
      tokens.push({ type: 'inline', value: match[5].trim() });
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < str.length) {
    tokens.push({ type: 'text', value: str.slice(cursor) });
  }

  // If no math delimiters matched, check if raw text contains common LaTeX commands like \frac, \sqrt, \pm
  if (tokens.length === 1 && tokens[0].type === 'text') {
    const raw = tokens[0].value;
    if (/\\(?:frac|dfrac|tfrac|sqrt|sum|int|binom|pm|times|div|cdot|alpha|beta|gamma|theta|pi|le|ge|neq|approx|infty)\b/.test(raw)) {
      return splitRawLatex(raw);
    }
  }

  return tokens;
}

export function MathText({ children, className = '' }) {
  const tokens = useMemo(() => splitMath(String(children ?? '')), [children]);
  return (
    <span className={`math-text ${className}`.trim()}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          return <span key={index} className="sp-math-prewrap">{token.value}</span>;
        }
        return (
          <span
            key={index}
            className={token.type === 'block' ? 'math-text-block' : 'math-text-inline'}
            dangerouslySetInnerHTML={{ __html: renderMath(token.value, token.type === 'block') }}
          />
        );
      })}
    </span>
  );
}