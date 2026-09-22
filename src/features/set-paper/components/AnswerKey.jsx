import { usePaper } from '../context/PaperContext';
import { MathText } from './MathText';
import { QUESTION_TYPES } from '../types';

function typeHeading(type) {
  switch (type) {
    case QUESTION_TYPES.MATCH:
      return 'Match the following';
    case QUESTION_TYPES.IMAGE_MCQ:
      return 'Circle / name the correct picture';
    case QUESTION_TYPES.FILL_BLANK:
      return 'Fill in the blanks';
    case QUESTION_TYPES.TRUE_FALSE:
      return 'State whether True or False';
    case QUESTION_TYPES.LABEL:
      return 'Label the picture';
    case QUESTION_TYPES.WRITING:
      return '';
    default:
      return '';
  }
}

function buildAnswers(question) {
  switch (question.type) {
    case QUESTION_TYPES.NORMAL:
    case QUESTION_TYPES.WRITING:
      return (question.answers ?? []).map(String).filter(Boolean);

    case QUESTION_TYPES.MCQ: {
      const option = (question.options ?? []).find((o) => o.id === question.correctOptionId);
      return option?.label ? [option.label] : [];
    }

    case QUESTION_TYPES.IMAGE_MCQ: {
      const imageOptions = (question.options ?? []).filter((o) => o.image);
      const writingMode = (question.options ?? []).some((o) => o.writingLines);
      if (writingMode) {
        return (question.answers ?? []).map(String).filter(Boolean);
      }
      const index = imageOptions.findIndex((o) => o.id === question.correctOptionId);
      if (index < 0) return [];
      const option = imageOptions[index];
      return [option.label || `Option ${String.fromCharCode(65 + index)}`];
    }

    case QUESTION_TYPES.FILL_BLANK:
    case QUESTION_TYPES.TRUE_FALSE:
    case QUESTION_TYPES.LABEL:
      return (question.answers ?? []).map(String).filter(Boolean);

    case QUESTION_TYPES.MATCH: {
      const right = (id) => {
        const match = (question.rightItems ?? []).find((item) => item.id === id);
        return match?.label ? match.label : undefined;
      };
      return (question.leftItems ?? [])
        .map((item, index) => {
          const label = right(question.matchPairs?.[item.id]);
          return label ? `${String.fromCharCode(65 + index)} → ${label}` : undefined;
        })
        .filter(Boolean);
    }

    default:
      return [];
  }
}

export function AnswerKey() {
  const { state } = usePaper();
  const { header, questions } = state;

  return (
    <div className="sp-answer-key-stage" aria-hidden="true">
      <div id="answer-key-area" className="sp-print-area sp-ak-paper">
        <div className="sp-ak-head">
          <div className="sp-ak-title">Answer Key</div>
          <div className="sp-ak-meta">
            {[header.subject, header.className, header.exam, header.academicYear]
              .filter(Boolean)
              .join(' • ') || 'Question Paper'}
          </div>
        </div>

        {questions.length === 0 && (
          <div className="sp-ak-note">No questions yet.</div>
        )}

        {questions.map((question) => {
          const answers = buildAnswers(question);
          const heading = typeHeading(question.type);
          return (
            <div key={question.id} className="pdf-question-block sp-ak-block">
              <div className="sp-ak-qrow">
                <span className="sp-ak-qno">Q{question.number}.</span>
                <span className="sp-ak-qtext">
                  {question.text || heading || 'Untitled question'}
                </span>
              </div>
              {answers.length > 0 ? (
                <div className="sp-ak-answers">
                  {answers.map((answer, index) => (
                    <div key={index} className="sp-ak-answer">
                      {answers.length > 1 && <strong className="sp-ak-answer-no">{index + 1}.</strong>}
                      <MathText>{answer}</MathText>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sp-ak-answer sp-ak-empty">— no answer set —</div>
              )}

              {question.solution ? (
                <div className="sp-ak-solution">
                  <strong>Solution:</strong> <MathText>{question.solution}</MathText>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}