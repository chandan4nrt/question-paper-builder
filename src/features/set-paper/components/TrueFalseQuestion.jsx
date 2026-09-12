import { Trash2, Star, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { usePaper } from '../context/PaperContext';

export function TrueFalseQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const { dispatch } = usePaper();

  const items = question.items || [''];

  function update(data) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  const handleItemChange = (index, value) => {
    const updatedItems = [...items];
    updatedItems[index] = value;
    update({ items: updatedItems });
  };

  const handleAddItem = () => {
    update({ items: [...items, ''] });
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
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
        <div className="sp-q-number sp-q-number-true-false">{question.number}</div>
        <span className="sp-q-type violet">True / False</span>
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

      <div
        className="sp-q-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="sp-tf-row"
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
              placeholder='Write a statement, e.g. "The sun rises in the east."'
              rows={1}
              className="sp-textarea"
              style={{ flex: 1, resize: 'vertical' }}
            />

            <span className="sp-tf-options" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="sp-answer-tf">
                <button
                  type="button"
                  className={`sp-answer-tf-btn true${question.answers?.[index] === 'true' ? ' active' : ''}`}
                  onClick={() => handleAnswerChange(index, 'true')}
                  title="Mark as True"
                >
                  ✓ True
                </button>
                <button
                  type="button"
                  className={`sp-answer-tf-btn false${question.answers?.[index] === 'false' ? ' active' : ''}`}
                  onClick={() => handleAnswerChange(index, 'false')}
                  title="Mark as False"
                >
                  ✗ False
                </button>
              </span>
            </span>

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
            color: '#a83d68',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
          }}
        >
          <Plus size={16} /> Add True/False Statement
        </button>
      </div>
    </div>
  );
}