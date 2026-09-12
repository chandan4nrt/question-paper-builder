import { Trash2, Star, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { Fragment } from 'react';
import { usePaper } from '../context/PaperContext';

export function FillBlankQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const { dispatch } = usePaper();

  // Fallback to single text if items array doesn't exist yet
  const items = question.items || (question.text ? [question.text] : ['']);

  function update(data) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  // Sub-question handlers
  const handleItemChange = (index, value) => {
    const updatedItems = [...items];
    updatedItems[index] = value;
    update({ items: updatedItems });
  };

  const handleAddItem = () => {
    update({ items: [...items, ''] });
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return; // Keep at least one sub-question
    const updatedItems = items.filter((_, i) => i !== index);
    update({ items: updatedItems });
  };

  const handleAnswerChange = (index, value) => {
    const answers = [...(question.answers ?? [])];
    answers[index] = value;
    update({ answers });
  };

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

        {/* Fill in the Blanks Header */}
        <div
          className="sp-q-number"
          style={{
            background: 'linear-gradient(135deg, #347a58, #63ad82)',
          }}
        >
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

            <span>marks</span>
          </div>

          <button
            type="button"
            className="sp-icon-btn"
            onClick={() =>
              dispatch({
                type: 'DELETE_QUESTION',
                payload: question.id,
              })
            }
            title="Delete question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Sub-Questions List */}
      <div
        className="sp-q-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {items.map((item, index) => (
          <Fragment key={index}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  minWidth: '1.25rem',
                }}
              >
                {index + 1}.
              </span>

              <textarea
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder='Use ___ in your sentence, e.g. "The sun rises in the ___."'
                rows={1}
                className="sp-textarea"
                style={{ flex: 1, resize: 'vertical' }}
              />

              {items.length > 1 && (
                <button
                  type="button"
                  className="sp-icon-btn"
                  onClick={() => handleRemoveItem(index)}
                  title="Remove item"
                  style={{ color: '#ef4444' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="sp-answer-section sp-answer-inline" style={{ marginTop: 0, paddingTop: 0, border: 'none', paddingLeft: '1.75rem' }}>
              <input
                className="sp-answer-input"
                value={question.answers?.[index] ?? ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Answer..."
              />
            </div>
          </Fragment>
        ))}

        <button
          type="button"
          onClick={handleAddItem}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            alignSelf: 'flex-start',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#347a58',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
          }}
        >
          <Plus size={16} /> Add Blank Question
        </button>
      </div>
    </div>
  );
}