import { Trash2, GripVertical, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import type { Question } from '../types';

interface CardProps {
  question: Question;
  isDragging?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function NormalQuestion({
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
        <div className="sp-q-number">{question.number}</div>
        <span className="sp-q-type blue">
          <GripVertical size={10} style={{ display: 'none' }} />
          Question
        </span>
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
      <div className="sp-q-body">
        <textarea
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Type your question here..."
          rows={3}
          className="sp-textarea"
        />
      </div>
    </div>
  );
}
