import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { usePaper } from '../context/PaperContext';

export function WritingLines({ count, fragments = 1, sampleText }) {
  const fragmentCount = Math.max(1, fragments);

  return (
    <div className="sp-lines-box">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`sp-writing-line sp-cols-${Math.min(6, fragmentCount)}`}
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
}) {
  const { dispatch } = usePaper();

  function update(data) {
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
        <div className="sp-q-number sp-q-number-writing">
          {question.number}
        </div>
        <span className="sp-q-type pink">Writing Practice</span>
        <div className="sp-q-actions">
          <div className="sp-marks">
            <input
              type="number"
              min={0}
              max={100}
              value={question.marks}
              onChange={(e) => update({ marks: Number(e.target.value) })}
            />
            <span>marks</span>
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
      <div className="sp-q-body">
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
          className="sp-input sp-writing-mode-btn"
        />
        <div className='sp-control'>
          <div className="sp-line-control">
            <span className="sp-field-label sp-no-margin">
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
            <span className="sp-field-label sp-no-margin">
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