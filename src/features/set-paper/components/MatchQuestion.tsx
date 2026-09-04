import { useState } from 'react';
import { Trash2, Star, X, Shuffle, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { shuffleArray } from '../helpers';
import type { MatchItem, Question } from '../types';

interface CardProps {
  question: Question;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function MatchQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: CardProps) {
  const { dispatch } = usePaper();
  const [shuffled, setShuffled] = useState(false);

  const leftItems = question.leftItems ?? [];
  const rightItems = question.rightItems ?? [];
  const rowCount = Math.max(leftItems.length, rightItems.length);

  function update(data: Partial<Question>) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  function addLeftItem() {
    update({ leftItems: [...leftItems, { id: `l${Date.now()}`, label: '', image: null }] });
  }

  function addRightItem() {
    update({ rightItems: [...rightItems, { id: `r${Date.now()}`, label: '' }] });
  }

  function updateLeftItem(id: string, field: keyof MatchItem, value: string | null) {
    update({
      leftItems: leftItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    });
  }

  function updateRightItem(id: string, value: string) {
    update({ rightItems: rightItems.map((item) => (item.id === id ? { ...item, label: value } : item)) });
  }

  function removeLeftItem(id: string) {
    update({ leftItems: leftItems.filter((item) => item.id !== id) });
  }

  function removeRightItem(id: string) {
    update({ rightItems: rightItems.filter((item) => item.id !== id) });
  }

  function moveRightItem(index: number, delta: number) {
    const next = [...rightItems];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ rightItems: next });
  }

  function handleImageUpload(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateLeftItem(id, 'image', String(ev.target?.result));
    reader.readAsDataURL(file);
  }

  function handleShuffle() {
    update({ rightItems: shuffleArray(rightItems) });
    setShuffled(true);
    setTimeout(() => setShuffled(false), 1000);
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
        <div className="sp-q-number" style={{ background: 'linear-gradient(135deg,#f5a623,#e86624)' }}>
          {question.number}
        </div>
        <span className="sp-q-type green">Match the Following</span>
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
        <input
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Match the following (e.g. Match the animals to their homes)"
          className="sp-input"
        />
      </div>

      <div className="sp-match-cols">
        <div className="sp-col-title">
          <span>Column A</span>
        </div>
        <div className="sp-col-title">
          <span style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              type="button"
              onClick={handleShuffle}
              className="sp-mini-btn blue"
              style={shuffled ? { background: 'rgba(245,166,35,0.25)', color: '#8f240b' } : {}}
            >
              <Shuffle size={12} /> Shuffle
            </button>
          </span>
        </div>

        {Array.from({ length: rowCount }).map((_, index) => {
          const left = leftItems[index];
          const right = rightItems[index];
          return (
            <div key={index} className="sp-match-row">
              <div className="sp-match-cell-box">
                {left ? (
                  <div className="sp-match-item left">
                    <span className="sp-match-letter">{String.fromCharCode(65 + index)}</span>
                    <div className="sp-match-content">
                      {left.image ? (
                        <div className="sp-match-img-wrap">
                          <img src={left.image} alt="item" className="sp-match-img" />
                          <button
                            type="button"
                            className="sp-img-remove"
                            onClick={() => updateLeftItem(left.id, 'image', null)}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="sp-upload-label">
                          <ImageIcon size={10} /> Upload image
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageUpload(left.id, e)}
                          />
                        </label>
                      )}
                      <input
                        className="sp-match-label"
                        value={left.label}
                        onChange={(e) => updateLeftItem(left.id, 'label', e.target.value)}
                        placeholder="Label..."
                      />
                    </div>
                    <button type="button" className="sp-icon-btn" onClick={() => removeLeftItem(left.id)}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="sp-match-item left sp-match-add sp-match-placeholder">
                    <span className="sp-match-letter">—</span>
                  </span>
                )}
              </div>

              <div className="sp-match-cell-box">
                {right ? (
                  <div className="sp-match-item right">
                    <span className="sp-match-letter">{index + 1}</span>
                    <div className="sp-match-content">
                      <input
                        className="sp-match-label"
                        value={right.label}
                        onChange={(e) => updateRightItem(right.id, e.target.value)}
                        placeholder="Label..."
                      />
                    </div>
                    <div className="sp-right-controls">
                      <div className="sp-reorder">
                        <button
                          type="button"
                          onClick={() => moveRightItem(index, -1)}
                          disabled={index === 0}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRightItem(index, 1)}
                          disabled={index === rightItems.length - 1}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <button type="button" className="sp-icon-btn" onClick={() => removeRightItem(right.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="sp-match-item right sp-match-add sp-match-placeholder">
                    <span className="sp-match-letter">—</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div className="sp-match-row">
          <button type="button" className="sp-match-add sp-match-add-btn left" onClick={addLeftItem}>
            <span className="sp-match-letter">+</span>
            <span>Add item to Column A</span>
          </button>
          <button type="button" className="sp-match-add sp-match-add-btn right" onClick={addRightItem}>
            <span className="sp-match-letter">+</span>
            <span>Add item to Column B</span>
          </button>
        </div>
      </div>
    </div>
  );
}
