import { MathPreview } from './MathPreview';

export function SolutionField({ value, onChange, placeholder = 'Explain the correct answer / solution (optional)…' }) {
  return (
    <div className="sp-solution-section">
      <span className="sp-answer-label">Solution (optional)</span>
      <textarea
        className="sp-textarea"
        rows={2}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <MathPreview value={value} />
    </div>
  );
}