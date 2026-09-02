import { Trash2, Star, ChevronUp, ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import type { Question } from '../types';

interface CardProps {
  question: Question;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function LabelPreview({
  image,
  partCount,
}: {
  image?: string | null;
  partCount: number;
}) {
  return (
    <div className="sp-label-preview">
      {image && (
        <div className="sp-label-diagram-wrap">
          <img src={image} alt="diagram" className="sp-label-diagram" />
        </div>
      )}
      <div className="sp-label-blanks">
        {Array.from({ length: partCount }).map((_, i) => (
          <div key={i} className="sp-label-blank-row">
            <span className="sp-label-num">{i + 1}.</span>
            <span className="sp-blank-line sp-w24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LabelQuestion({
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

  const partCount = question.partCount ?? 4;

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ image: String(ev.target?.result) });
    reader.readAsDataURL(file);
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
        <div className="sp-q-number" style={{ background: 'linear-gradient(135deg,#a855f7,#ffb199)' }}>
          {question.number}
        </div>
        <span className="sp-q-type pink">Picture Labeling</span>
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
          placeholder='Label the parts of the diagram below.'
          className="sp-input"
        />

        <div className="sp-diagram-upload">
          {question.image ? (
            <div className="sp-match-img-wrap" style={{ width: '100%' }}>
              <img src={question.image} alt="diagram" className="sp-label-diagram-editor" />
              <button
                type="button"
                className="sp-img-remove"
                onClick={() => update({ image: null })}
                title="Remove diagram"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="sp-upload-label" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              <ImageIcon size={14} /> Upload diagram / picture
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        <div className="sp-line-control">
          <span className="sp-field-label" style={{ margin: 0 }}>
            Number of labels to write:
          </span>
          <button
            type="button"
            className="sp-line-step sp-theme-step"
            onClick={() => update({ partCount: Math.max(1, partCount - 1) })}
            aria-label="Fewer labels"
          >
            <span className="sp-step-sym">−</span>
          </button>
          <span className="sp-line-count">{partCount}</span>
          <button
            type="button"
            className="sp-line-step sp-theme-step"
            onClick={() => update({ partCount: Math.min(12, partCount + 1) })}
            aria-label="More labels"
          >
            <span className="sp-step-sym">+</span>
          </button>
        </div>

        <LabelPreview image={question.image} partCount={partCount} />
      </div>
    </div>
  );
}