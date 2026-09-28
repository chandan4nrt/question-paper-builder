import { MarkdownText } from './MarkdownText';

function hasRichMarkup(text) {
  const t = String(text ?? '');
  if (!t.trim()) return false;
  if (/\$[^$\n]/.test(t)) return true;
  if (/\\(?:text|textbf|textit|emph)\s*\{/.test(t)) return true;
  if (/\*\*|__|`/.test(t)) return true;
  if (/^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```)/m.test(t)) return true;
  if (/(^|\s)\*[^*\s][^*\n]*\*/.test(t)) return true;
  if (/(^|\s)_[^\s_][^_\n]*_/.test(t)) return true;
  return false;
}

export function MathPreview({ value, className = '' }) {
  const text = String(value ?? '');
  if (!hasRichMarkup(text)) return null;
  return (
    <div className={`sp-math-preview ${className}`.trim()}>
      <MarkdownText>{text}</MarkdownText>
    </div>
  );
}