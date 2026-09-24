import { BloomLevelBadge } from './BloomLevelBadge';
import { QUESTION_TYPE_CONFIG } from '../bloom';

export function StudentQuestion({ question, index, value, onChange, result, showBloom = true }) {
  const typeConfig = QUESTION_TYPE_CONFIG.find((type) => type.id === question.type);
  const typeLabel = typeConfig?.label ?? question.type;
  const answered = question.type === 'mcq' ? Boolean(value) : Boolean(String(value ?? '').trim());

  let stateClass = '';
  if (result) {
    stateClass = result.correct ? 'be-student-correct' : 'be-student-wrong';
  } else if (answered) {
    stateClass = 'be-student-answered';
  }

  return (
    <article className={`be-student-card ${stateClass}`}>
      <header className="be-student-head">
        <span className="be-q-no">{index + 1}</span>
        <span className="be-type-chip">{typeLabel}</span>
        {showBloom && <BloomLevelBadge level={question.bloomLevel} />}
        <span style={{ flex: 1 }} />
        <span className="be-mark-pill">{question.marks} mark{question.marks === 1 ? '' : 's'}</span>
      </header>

      <p className="be-student-question">{question.text}</p>

      {question.type === 'mcq' && (
        <div className="be-student-options">
          {question.options?.map((option, optionIndex) => {
            const isSelected = value === option.id;
            const isCorrect = result ? option.id === question.correctOptionId : false;
            return (
              <button
                key={option.id}
                type="button"
                className={[
                  'be-student-option',
                  isSelected ? 'be-student-selected' : '',
                  result && isSelected && isCorrect ? 'be-student-right' : '',
                  result && isSelected && !isCorrect ? 'be-student-wrong-opt' : '',
                  result && !isSelected && isCorrect ? 'be-student-reveal' : '',
                ].join(' ')}
                onClick={() => onChange(option.id)}
                disabled={Boolean(result)}
              >
                <span className="be-student-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option.label}</span>
                {result && isCorrect && <span className="be-student-icon">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {(question.type === 'short' || question.type === 'scenario') && (
        <label className="be-field be-student-answer">
          <span>Your answer</span>
          <textarea
            rows={question.type === 'scenario' ? 5 : 3}
            value={value ?? ''}
            placeholder={question.type === 'scenario'
              ? 'Explain your reasoning step by step…'
              : 'Type your answer here…'}
            onChange={(e) => onChange(e.target.value)}
            disabled={Boolean(result)}
          />
        </label>
      )}

      {result && (
        <div className={`be-student-result ${result.correct ? 'be-student-result-correct' : 'be-student-result-wrong'}`}>
          <strong>{result.correct ? 'Correct' : 'Incorrect'}</strong>
          <span>
            {result.earned} / {result.max} marks
          </span>
        </div>
      )}
    </article>
  );
}