import { useMemo } from 'react';
import katex from 'katex';

function renderMath(expression, displayMode) {
  try {
    return katex.renderToString(expression, {
      throwOnError: false,
      displayMode,
      trust: true,
    });
  } catch {
    return expression;
  }
}

function splitMath(text) {
  const tokens = [];
  let cursor = 0;
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, match.index) });
    }
    if (match[1] != null) {
      tokens.push({ type: 'block', value: match[1] });
    } else {
      tokens.push({ type: 'inline', value: match[2] });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) });
  }
  return tokens;
}

export function MathText({ children, className = '' }) {
  const tokens = useMemo(() => splitMath(String(children ?? '')), [children]);
  return (
    <span className={`math-text ${className}`.trim()}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          return <span key={index}>{token.value}</span>;
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