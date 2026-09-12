import { Trash2, Star, Plus, X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { usePaper } from '../context/PaperContext';

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function getOptionLetter(index) {
  let value = index + 1;
  let letters = '';
  while (value > 0) {
    value -= 1;
    letters = String.fromCharCode(65 + (value % 26)) + letters;
    value = Math.floor(value / 26);
  }
  return letters || OPTION_LETTERS[0];
}

export function McqQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const { dispatch } = usePaper();
  const options = question.options ?? [];

  function update(data) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  function addOption() {
    update({ options: [...options, { id: `o${Date.now()}`, label: '' }] });
  }

  function updateOption(id, value) {
    update({ options: options.map((o) => (o.id === id ? { ...o, label: value } : o)) });
  }

  function removeOption(id) {
    update({ options: options.filter((o) => o.id !== id) });
  }

  function moveOption(index, delta) {
    const next = [...options];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ options: next });
  }

  function setCorrectOption(id) {
    update({ correctOptionId: id });
  }

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
        <div className="sp-q-number sp-q-number-mcq">{question.number}</div>
        <span className="sp-q-type yellow">MCQ</span>
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
        <textarea
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Type your MCQ question here..."
          rows={2}
          className="sp-textarea"
        />

        <div className="sp-mcq-options">
          <div className="sp-mcq-options-title">Options</div>
          {options.length === 0 && (
            <div className="sp-mcq-empty">No options yet. Add one below.</div>
          )}
          <div className="sp-mcq-grid">
            {options.map((opt, index) => (
              <div key={opt.id} className="sp-mcq-option">
                <button
                  type="button"
                  className={`sp-correct-answer-btn${question.correctOptionId === opt.id ? ' active' : ''}`}
                  onClick={() => setCorrectOption(opt.id)}
                  title="Mark as correct answer"
                >
                  <Check size={14} />
                </button>
                <span className="sp-match-letter sp-mcq-letter">{getOptionLetter(index)}</span>
                <input
                  className="sp-match-label"
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${getOptionLetter(index)}`}
                />
                <div className="sp-reorder">
                  <button type="button" onClick={() => moveOption(index, -1)} disabled={index === 0} title="Move up">
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOption(index, 1)}
                    disabled={index === options.length - 1}
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button type="button" className="sp-icon-btn" onClick={() => removeOption(opt.id)} title="Remove option">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="button-flex">
            <button type="button" className="sp-mcq-add" onClick={addOption}>
            <Plus size={14} /> Add option
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}