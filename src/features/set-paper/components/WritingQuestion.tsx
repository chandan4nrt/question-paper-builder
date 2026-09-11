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

export function WritingLines({ count, fragments = 1, sampleText }: { count: number; fragments?: number; sampleText?: string }) {
  const fragmentCount = Math.max(1, fragments);

  return (
    <div className="sp-lines-box">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="sp-writing-line"
          style={{ gridTemplateColumns: `repeat(${fragmentCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: fragmentCount }).map((_, fragmentIndex) => (
            <div key={fragmentIndex} className="sp-line-fragment">
              <div className="sp-line-top" />
              <div className="sp-line-mid1" />
              <div className="sp-line-mid2" />
              <div className="sp-line-bottom" />
              {i === 0 && fragmentIndex === 0 && sampleText && <div className="sp-line-sample">{sampleText}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function WritingQuestion({
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

  const lines = question.lines || 4;
  const fragments = question.fragments || 1;

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
        <div className="sp-q-number" style={{ background: 'linear-gradient(135deg,#f4624f,#ff7a52)' }}>
          {question.number}
        </div>
        <span className="sp-q-type pink">Writing Practice</span>
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
        <input
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Writing instruction (e.g. Trace and write the letters A, B, C)"
          className="sp-input"
        />
        <input
          value={question.sampleText ?? ''}
          onChange={(e) => update({ sampleText: e.target.value })}
          placeholder="Sample text to trace (optional, shown on first line)"
          className="sp-input"
          style={{ background: '#fff3e6', color: '#c43a22' }}
        />
        <div className='sp-control'>
          <div className="sp-line-control">
            <span className="sp-field-label" style={{ margin: 0 }}>
              Number of lines:
            </span>
            <button
              type="button"
              className="sp-line-step sp-theme-step"
              onClick={() => update({ lines: Math.max(1, lines - 1) })}
              aria-label="Fewer lines"
            >
              <span className="sp-step-sym">−</span>
            </button>
            <span className="sp-line-count">{lines}</span>
            <button
              type="button"
              className="sp-line-step sp-theme-step"
              onClick={() => update({ lines: Math.min(10, lines + 1) })}
              aria-label="More lines"
            >
              <span className="sp-step-sym">+</span>
            </button>
          </div>
          <div className="sp-line-control">
            <span className="sp-field-label" style={{ margin: 0 }}>
              Number of fragments:
            </span>
            <button
              type="button"
              className="sp-line-step sp-theme-step"
              onClick={() => update({ fragments: Math.max(0, fragments - 1) })}
              aria-label="Fewer fragments"
            >
              <span className="sp-step-sym">−</span>
            </button>
            <span className="sp-line-count">{fragments}</span>
            <button
              type="button"
              className="sp-line-step sp-theme-step"
              onClick={() => update({ fragments: Math.min(5, fragments + 1) })}
              aria-label="More fragments"
            >
              <span className="sp-step-sym">+</span>
            </button>
          </div>
        </div>
        <WritingLines count={lines} fragments={fragments} sampleText={question.sampleText} />
        <div className="sp-answer-section">
          <span className="sp-answer-label">Right answer (optional)</span>
          <input
            className="sp-answer-input"
            value={question.answers?.[0] ?? ''}
            onChange={(e) => update({ answers: [e.target.value] })}
            placeholder="Expected word(s) to write..."
          />
        </div>
      </div>
    </div>
  );
}
