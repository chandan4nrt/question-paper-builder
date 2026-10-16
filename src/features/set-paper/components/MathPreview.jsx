import { MathText } from './MathText';

export function MathPreview({ value, className = '' }) {
  const text = String(value ?? '');
  if (!/\$|\\\(|\\\[|\\begin\{|\\[a-zA-Z]+|[a-zA-Z0-9]\^[0-9a-zA-Z]/.test(text)) return null;
  return (
    <div className={`sp-math-preview ${className}`.trim()}>
      <MathText>{text}</MathText>
    </div>
  );
}