import { MathText } from './MathText';

export function MathPreview({ value, className = '' }) {
  const text = String(value ?? '');
  if (!/\$[^$]/.test(text)) return null;
  return (
    <div className={`sp-math-preview ${className}`.trim()}>
      <MathText>{text}</MathText>
    </div>
  );
}