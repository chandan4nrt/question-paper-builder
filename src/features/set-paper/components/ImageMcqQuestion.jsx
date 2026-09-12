import { Trash2, Star, Plus, X, ChevronUp, ChevronDown, Image as ImageIcon, Check } from 'lucide-react';
import { MAX_IMAGE_SIZE, usePaper } from '../context/PaperContext';

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

export function ImageMcqQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const { dispatch, showToast } = usePaper();
  const options = question.options ?? [];

  function update(data) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  function addOption() {
    update({ options: [...options, { id: `o${Date.now()}`, label: '', image: null, writingLines: false }] });
  }

  function updateOption(id, field, value) {
    update({ options: options.map((o) => (o.id === id ? { ...o, [field]: value } : o)) });
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

  const imageOptions = options.filter((o) => o.image);

  function getWriteAnswer(optionId) {
    const idx = imageOptions.findIndex((o) => o.id === optionId);
    return idx >= 0 ? (question.answers?.[idx] ?? '') : '';
  }

  function setWriteAnswer(optionId, value) {
    const idx = imageOptions.findIndex((o) => o.id === optionId);
    const answers = [...(question.answers ?? [])];
    if (idx >= 0) answers[idx] = value;
    update({ answers });
  }

  function handleImageUpload(id, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      showToast('Image is too large. Please choose an image under 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = String(ev.target?.result);
      update({
        options: options.map((o) =>
          o.id === id ? { ...o, image, imageName: file.name } : o,
        ),
      });
    };
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
        <div className="sp-q-number" style={{ background: 'linear-gradient(135deg,#c43a22,#f4624f)' }}>
          {question.number}
        </div>
        <span className="sp-q-type teal">Circle It</span>
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
          placeholder='e.g. Circle the apple'
          rows={2}
          className="sp-textarea"
        />

        <div className="sp-mcq-options">
          <div className="sp-mcq-options-title">Options (add a picture for each)</div>
          {options.length === 0 && (
            <div className="sp-mcq-empty">No options yet. Add one below.</div>
          )}
          <div className="sp-mcq-grid">
            {options.map((opt, index) => (
              <div key={opt.id} className="sp-mcq-option">
                <span className="sp-match-letter sp-mcq-letter">{getOptionLetter(index)}</span>
                <div className="sp-image-option-body">
                  <div className="sp-image-option-work">
                    {opt.image ? (
                      <>
                        <div className="sp-match-img-wrap">
                          <img src={opt.image} alt="option" className="sp-match-img" />
                          <button
                            type="button"
                            className="sp-img-remove"
                            onClick={() =>
                              update({
                                options: options.map((o) =>
                                  o.id === opt.id ? { ...o, image: null, imageName: null } : o,
                                ),
                              })
                            }
                            title="Remove image"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="sp-upload-label">
                        <ImageIcon size={10} /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageUpload(opt.id, e)}
                        />
                      </label>
                    )}
                    {opt.writingLines && (
                      <div className="sp-image-writing-lines" aria-hidden="true">
                        <span className="sp-image-writing-line-top" />
                        <span className="sp-image-writing-line-mid" />
                        <span className="sp-image-writing-line-mid" />
                        <span className="sp-image-writing-line-bottom" />
                      </div>
                    )}
                    {opt.image && (
                      <div className="sp-answer-section sp-answer-inline">
                        <div className="sp-answer-pair">
                          {opt.writingLines ? (
                            <input
                              className="sp-answer-input"
                              value={getWriteAnswer(opt.id)}
                              onChange={(e) => setWriteAnswer(opt.id, e.target.value)}
                              placeholder="Right name for this picture..."
                              style={{ flex: 1 }}
                            />
                          ) : (
                            <button
                              type="button"
                              className={`sp-correct-answer-btn${question.correctOptionId === opt.id ? ' active' : ''}`}
                              onClick={() => update({ correctOptionId: opt.id })}
                              title="Mark as correct picture"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="sp-mcq-add sp-option-writing-toggle"
                    onClick={() => updateOption(opt.id, 'writingLines', !opt.writingLines)}
                  >
                    {opt.writingLines ? 'Remove writing lines' : 'Add writing lines'}
                  </button>
                  <input
                    className="sp-match-label"
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, 'label', e.target.value)}
                    placeholder={`Option ${getOptionLetter(index)}`}
                  />
                </div>
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
          <button type="button" className="sp-mcq-add" onClick={addOption}>
            <Plus size={14} /> Add option
          </button>
        </div>
      </div>
    </div>
  );
}