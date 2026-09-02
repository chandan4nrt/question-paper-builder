import { Trash2, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import type { Question } from '../types';

interface CardProps {
  question: Question;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function FillBlankPreview({ count }: { count: number }) {
  return (
    <div className="sp-fill-blank-preview">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sp-fill-blank-line" />
      ))}
    </div>
  );
}

export function FillBlankQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: CardProps) {
  const { dispatch } = usePaper();

  function update(data: Partial<Question>) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  const blankCount = question.blankCount ?? 3;

  return (
    <div className="sp-question-card">
      <div className="sp-q-head">
        <div className="sp-reorder">
          <button type="button" onClick={onMoveUp} disabled={!canMoveUp} title="Move up">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown} title="Move down">
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="sp-q-number" style={{ background: 'linear-gradient(135deg,#0d9488,#5eead4)' }}>
          {question.number}
        </div>
        <span className="sp-q-type green">Fill in the Blanks</span>
        <div className="sp-q-actions">
          <div className="sp-marks">
            <Star size={12} color="#FFE29A" fill="#FFE29A" />
            <input
              type="number"
              min={0}
              max={100}
              value={question.marks}
              onChange={(e) => update({ marks: Number(e.target.value) })}
            />
            <span>pts</span>
          </div>
          <button
            type="button"
            className="sp-icon-btn"
            onClick={() => dispatch({ type: 'DELETE_QUESTION', payload: question.id })}
            title="Delete question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="sp-q-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder='Use ___ or (blank) in your sentence, e.g. "The sun rises in the ___."'
          rows={2}
          className="sp-textarea"
        />
        <div className="sp-line-control">
          <span className="sp-field-label" style={{ margin: 0 }}>
            Number of blanks:
          </span>
          <button
            type="button"
            className="sp-line-step sp-theme-step"
            onClick={() => update({ blankCount: Math.max(1, blankCount - 1) })}
            aria-label="Fewer blanks"
          >
            <span className="sp-step-sym">−</span>
          </button>
          <span className="sp-line-count">{blankCount}</span>
          <button
            type="button"
            className="sp-line-step sp-theme-step"
            onClick={() => update({ blankCount: Math.min(10, blankCount + 1) })}
            aria-label="More blanks"
          >
            <span className="sp-step-sym">+</span>
          </button>
        </div>
        <FillBlankPreview count={blankCount} />
      </div>
    </div>
  );
}