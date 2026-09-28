import { MarkdownText } from '../../components/MarkdownText';
import { MathTextArea } from './MathTextArea';
import { QUESTION_TYPES } from '../../types';

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function optionLetter(index) {
  let value = index + 1;
  let letters = '';
  while (value > 0) {
    value -= 1;
    letters = String.fromCharCode(65 + (value % 26)) + letters;
    value = Math.floor(value / 26);
  }
  return letters || OPTION_LETTERS[0];
}

export function isQuestionAnswered(question, value) {
  switch (question.type) {
    case QUESTION_TYPES.MCQ:
    case QUESTION_TYPES.IMAGE_MCQ:
      return Boolean(value?.optionId);
    case QUESTION_TYPES.TRUE_FALSE:
      return Array.isArray(value) && value.length > 0 && value.every((v) => v === 'True' || v === 'False');
    case QUESTION_TYPES.MATCH:
      return Array.isArray(value) && value.length > 0 && value.every((v) => v != null && v !== '');
    case QUESTION_TYPES.FILL_BLANK:
    case QUESTION_TYPES.LABEL:
      return Array.isArray(value) && value.some((v) => String(v ?? '').trim());
    default:
      return Boolean(String(value ?? '').trim());
  }
}

export function StudentAnswerCard({ question, value, onChange, readOnly = false }) {
  const answered = isQuestionAnswered(question, value);

  function setText(newValue) {
    onChange?.({ type: question.type, text: newValue });
  }

  function setPair(index, rightLabel) {
    const next = Array.isArray(value?.items) ? [...value.items] : [];
    next[index] = rightLabel;
    onChange?.({ type: question.type, items: next });
  }

  function setOption(optionId) {
    const option = (question.options ?? []).find((o) => o.id === optionId);
    onChange?.({ type: question.type, optionId, optionText: option?.label ?? '' });
  }

  const items = (question.items ?? []).map((v, i) =>
    Array.isArray(value?.items) ? (value.items[i] ?? '') : (v ?? ''),
  );

  const head = (
    <header className="sp-sq-head">
      <span className="sp-sq-no">{question.number ?? '?'}</span>
      <span className="sp-sq-type">{question.type}</span>
      <span style={{ flex: 1 }} />
      <span className="sp-sq-marks">{question.marks} marks</span>
    </header>
  );

  return (
    <article className={`sp-sq ${answered ? 'sp-sq-answered' : ''}`}>
      {head}

      <div className="sp-sq-text">
        {question.text ? (
          <MarkdownText>{question.text}</MarkdownText>
        ) : (
          <MarkdownText>
            {question.type === QUESTION_TYPES.TRUE_FALSE
              ? 'State whether the following are true or false.'
              : question.type === QUESTION_TYPES.FILL_BLANK
                ? 'Fill in the blanks.'
                : 'Answer the following.'}
          </MarkdownText>
        )}
      </div>

      {(question.type === QUESTION_TYPES.NORMAL || question.type === QUESTION_TYPES.WRITING) && (
        <MathTextArea
          value={typeof value?.text === 'string' ? value.text : ''}
          onChange={(text) => setText(text)}
          rows={question.type === QUESTION_TYPES.WRITING ? 5 : 3}
          readOnly={readOnly}
          placeholder="Write your answer — Hindi, English and math ($…)…"
        />
      )}

      {(question.type === QUESTION_TYPES.MCQ || question.type === QUESTION_TYPES.IMAGE_MCQ) && (
        <div className="sp-sq-options">
          {(question.options ?? []).map((option, index) => {
            const selected = value?.optionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={`sp-sq-option ${selected ? 'sp-sq-option-selected' : ''}`}
                onClick={() => setOption(option.id)}
                disabled={readOnly}
              >
                <span className="sp-sq-option-letter">{optionLetter(index)}</span>
                {option.image ? (
                  <img src={option.image} alt={option.label || `option ${optionLetter(index)}`} />
                ) : option.label ? (
                  <MarkdownText>{option.label}</MarkdownText>
                ) : (
                  <span>Option</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {question.type === QUESTION_TYPES.TRUE_FALSE && (
        <div className="sp-sq-tf">
          {(question.items && question.items.length > 0 ? question.items : [question.text]).map((item, index) => (
            <div key={index} className="sp-sq-tf-row">
              <span className="sp-sq-tf-text">
                {index + 1}. <MarkdownText>{item}</MarkdownText>
              </span>
              <span className="sp-sq-tf-choices">
                {['True', 'False'].map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={`sp-sq-tf-choice ${value?.items?.[index] === choice ? 'sp-sq-tf-choice-selected' : ''}`}
                    onClick={() => {
                      const next = Array.isArray(value?.items) ? [...value.items] : [];
                      next[index] = choice;
                      onChange?.({ type: question.type, items: next });
                    }}
                    disabled={readOnly}
                  >
                    <span className="sp-sq-tf-dot" /> {choice}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      {question.type === QUESTION_TYPES.FILL_BLANK && (
        <div className="sp-sq-fill">
          {(question.items && question.items.length > 0 ? question.items : ['']).map((item, index) => (
            <div key={index} className="sp-sq-fill-row">
              <span className="sp-sq-fill-no">{index + 1}.</span>
              <MarkdownText>{item}</MarkdownText>
              <div className="sp-sq-fill-input">
                <MathTextArea
                  compact
                  rows={1}
                  value={items[index] ?? ''}
                  onChange={(text) => {
                    const next = Array.isArray(value?.items) ? [...value.items] : [];
                    next[index] = text;
                    onChange?.({ type: question.type, items: next });
                  }}
                  placeholder="Answer…"
                  readOnly={readOnly}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {question.type === QUESTION_TYPES.MATCH && (
        <div className="sp-sq-match">
          {(question.leftItems ?? []).map((left, index) => (
            <div key={left.id} className="sp-sq-match-row">
              <div className="sp-sq-match-left">
                <span className="sp-sq-option-letter">{String.fromCharCode(65 + index)}</span>
                {left.image ? <img src={left.image} alt={`item ${index + 1}`} /> : <MarkdownText>{left.label}</MarkdownText>}
              </div>
              <div className="sp-sq-match-arrow">→</div>
              <select
                className="sp-sq-match-select"
                value={value?.items?.[index] ?? ''}
                onChange={(event) => setPair(index, event.target.value)}
                disabled={readOnly}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {(question.rightItems ?? []).map((right, rightIndex) => (
                  <option key={right.id ?? rightIndex} value={right.label ?? ''}>
                    {rightIndex + 1}. {right.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {question.type === QUESTION_TYPES.LABEL && (
        <div className="sp-sq-label">
          {question.image && (
            <div className="sp-sq-label-stage">
              <img src={question.image} alt="diagram" className="sp-label-diagram" />
              {(question.labelMarkers ?? []).map((marker, index) => (
                <span
                  key={marker.id ?? index}
                  className="sp-label-marker"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          )}
          <div className="sp-sq-label-inputs">
            {(question.labelMarkers ?? [])
              .map((_, index) => index)
              .map((index) => (
                <div key={index} className="sp-sq-label-row">
                  <span className="sp-sq-label-no">{index + 1}.</span>
                  <MathTextArea
                    compact
                    rows={1}
                    value={items[index] ?? ''}
                    onChange={(text) => {
                      const next = Array.isArray(value?.items) ? [...value.items] : [];
                      next[index] = text;
                      onChange?.({ type: question.type, items: next });
                    }}
                    placeholder="Label…"
                    readOnly={readOnly}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </article>
  );
}