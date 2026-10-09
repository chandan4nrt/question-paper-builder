import { MarkdownText } from '../../components/MarkdownText';
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

const BLANK_REGEX = /(_{2,}|\.{3,}|\[\s*blank\s*\]|\(\s*blank\s*\)|\[\s*_{1,}\s*\])/gi;

function InlineBlankItem({ sentence, answer, onChange, readOnly }) {
  if (!sentence) {
    return (
      <input
        type="text"
        className="sp-inline-blank-input"
        value={answer ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Type answer…"
        disabled={readOnly}
      />
    );
  }

  const parts = sentence.split(/(_{2,}|\.{3,}|\[\s*blank\s*\]|\(\s*blank\s*\)|\[\s*_{1,}\s*\])/i);
  const hasBlank = BLANK_REGEX.test(sentence);
  BLANK_REGEX.lastIndex = 0;

  if (!hasBlank) {
    return (
      <span className="sp-fill-sentence-inline">
        <span>{sentence}</span>{' '}
        <input
          type="text"
          className="sp-inline-blank-input"
          value={answer ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type answer…"
          disabled={readOnly}
        />
      </span>
    );
  }

  let blankRendered = false;

  return (
    <span className="sp-fill-sentence-inline">
      {parts.map((part, i) => {
        const isBlankPart = /(_{2,}|\.{3,}|\[\s*blank\s*\]|\(\s*blank\s*\)|\[\s*_{1,}\s*\])/i.test(part);
        if (isBlankPart && !blankRendered) {
          blankRendered = true;
          return (
            <input
              key={i}
              type="text"
              className="sp-inline-blank-input"
              value={answer ?? ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="Type answer…"
              disabled={readOnly}
              autoComplete="off"
              spellCheck={false}
            />
          );
        }
        if (isBlankPart && blankRendered) {
          return (
            <input
              key={i}
              type="text"
              className="sp-inline-blank-input"
              value={answer ?? ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="Type answer…"
              disabled={readOnly}
              autoComplete="off"
              spellCheck={false}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function isQuestionAnswered(question, value) {
  if (!value) return false;
  switch (question.type) {
    case QUESTION_TYPES.MCQ:
    case QUESTION_TYPES.IMAGE_MCQ:
      return Boolean(value?.optionId);
    case QUESTION_TYPES.TRUE_FALSE: {
      const items = Array.isArray(value) ? value : value?.items;
      return Array.isArray(items) && items.length > 0 && items.every((v) => v === 'True' || v === 'False');
    }
    case QUESTION_TYPES.MATCH: {
      const items = Array.isArray(value) ? value : value?.items;
      return Array.isArray(items) && items.length > 0 && items.every((v) => v != null && v !== '');
    }
    case QUESTION_TYPES.FILL_BLANK:
    case QUESTION_TYPES.LABEL: {
      const items = Array.isArray(value) ? value : value?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items.some((v) => String(v ?? '').trim().length > 0);
      }
      return Boolean(String(value?.text ?? (typeof value === 'string' ? value : '')).trim());
    }
    default:
      return Boolean(String(value?.text ?? (typeof value === 'string' ? value : '')).trim());
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
        <div className="sp-clean-textarea-wrap">
          <textarea
            className="sp-clean-textarea"
            value={typeof value?.text === 'string' ? value.text : (typeof value === 'string' ? value : '')}
            onChange={(e) => setText(e.target.value)}
            rows={question.type === QUESTION_TYPES.WRITING ? 6 : 4}
            disabled={readOnly}
            placeholder="Type your answer here"
          />
        </div>
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
          {(question.items && question.items.length > 0 ? question.items : [question.text || '']).map((item, index) => {
            const currentAns = Array.isArray(value?.items)
              ? (value.items[index] ?? '')
              : (typeof value?.text === 'string' ? value.text : '');
            return (
              <div key={index} className="sp-fill-sentence-row">
                <span className="sp-fill-num">{index + 1}.</span>
                <div className="sp-fill-sentence-content">
                  <InlineBlankItem
                    sentence={item}
                    answer={currentAns}
                    onChange={(text) => {
                      const next = Array.isArray(value?.items) ? [...value.items] : [];
                      next[index] = text;
                      onChange?.({ type: question.type, items: next, text: next.join(', ') });
                    }}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            );
          })}
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
              .map((index) => {
                const currentLabel = Array.isArray(value?.items) ? (value.items[index] ?? '') : '';
                return (
                  <div key={index} className="sp-sq-label-row">
                    <span className="sp-sq-label-no">{index + 1}.</span>
                    <input
                      type="text"
                      className="sp-inline-blank-input"
                      style={{ minWidth: '180px', textAlign: 'left' }}
                      value={currentLabel}
                      onChange={(e) => {
                        const next = Array.isArray(value?.items) ? [...value.items] : [];
                        next[index] = e.target.value;
                        onChange?.({ type: question.type, items: next });
                      }}
                      placeholder="Type label name…"
                      disabled={readOnly}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </article>
  );
}