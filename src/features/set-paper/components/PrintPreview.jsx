import { usePaper } from "../context/PaperContext";
import { formatDate } from "../helpers";
import { WritingLines } from "./WritingQuestion";
import { LabelPreview } from "./LabelQuestion";
import { MathText } from "./MathText";
import { QUESTION_TYPES } from "../types";

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getOptionLetter(index) {
  let value = index + 1;
  let letters = "";
  while (value > 0) {
    value -= 1;
    letters = String.fromCharCode(65 + (value % 26)) + letters;
    value = Math.floor(value / 26);
  }
  return letters || OPTION_LETTERS[0];
}

function McqPreview({ question }) {
  const options = question.options ?? [];
  return (
    <div className="sp-mcq-preview">
      {options.length === 0 && (
        <div className="sp-preview-empty-notice">Add options in the editor...</div>
      )}
      <div className="sp-mcq-grid">
        {options.map((opt, i) => (
          <div key={opt.id} className="sp-mcq-preview-row">
            <span className="sp-match-letter sp-mcq-letter">{getOptionLetter(i)}</span>
            {/* <span className="sp-mcq-answer-dot" /> */}
            <span className="sp-mcq-preview-label">
              {opt.label ? <MathText>{opt.label}</MathText> : <em className="sp-preview-placeholder-italics">Option...</em>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageMcqPreview({ question }) {
  const options = question.options ?? [];
  return (
    <div className="sp-image-mcq-preview">
      {options.length === 0 && (
        <div className="sp-preview-empty-notice">Add picture options in the editor...</div>
      )}
      <div className="sp-image-mcq-grid">
        {options.map((opt, i) => (
          <div key={opt.id} className="sp-image-mcq-option">
            <div className="sp-image-mcq-card">
              <span className="sp-image-mcq-circle">{getOptionLetter(i)}</span>
              {opt.image ? (
                <img src={opt.image} crossOrigin="anonymous" alt={opt.label || "option"} />
              ) : (
                <div className="sp-image-mcq-placeholder">
                  {opt.label || <em className="sp-preview-option-placeholder">Option</em>}
                </div>
              )}
            </div>
            {opt.writingLines && (
              <div className="sp-image-writing-lines" aria-hidden="true">
                <span className="sp-image-writing-line-top" />
                <span className="sp-image-writing-line-mid" />
                <span className="sp-image-writing-line-mid" />
                <span className="sp-image-writing-line-bottom" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FillBlankPreview({ question }) {
  const items = question.items && question.items.length > 0 ? question.items : [""];

  return (
    <div className="sp-fill-blank-preview">
      {items.map((item, index) => {
        const parts = item.split("___");
        return (
          <div key={index} className="sp-fill-blank-row">
            <span className="sp-match-letter">{index + 1}.</span>
            <span className="sp-fill-blank-text">
              {parts.map((part, i) => (
                <span key={i}>
                  <MathText>{part}</MathText>
                  {i < parts.length - 1 && <span className="sp-blank-line sp-w16" />}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TrueFalsePreview({ question }) {
  const items = question.items && question.items.length > 0 ? question.items : [""];

  return (
    <div className="sp-tf-preview">
      {items.map((item, index) => (
        <div key={index} className="sp-tf-row">
          <span className="sp-match-letter">{index + 1}.</span>
          <span className="sp-tf-statement">
            {item ? <MathText>{item}</MathText> : <em className="sp-preview-placeholder-italics">Statement...</em>}
          </span>
          <span className="sp-tf-choice">
            <span className="sp-tf-circle" /> True
          </span>
          <span className="sp-tf-choice">
            <span className="sp-tf-circle" /> False
          </span>
        </div>
      ))}
    </div>
  );
}

function MatchPreview({ question }) {
  const left = question.leftItems ?? [];
  const right = question.rightItems ?? [];
  const maxLen = Math.max(left.length, right.length);

  return (
    <div className="sp-match-preview">
      <table className="sp-match-table">
        <thead>
          <tr>
            <th className="sp-match-col-half">Column A</th>
            <th className="sp-match-col-narrow" />
            <th className="sp-match-col-half">Column B</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxLen }).map((_, i) => {
            const l = left[i];
            const r = right[i];
            return (
              <tr key={i}>
                <td className="sp-match-cell">
                  {l && (
                    <div className="sp-match-box">
                      <span className="sp-match-letter">{String.fromCharCode(65 + i)}</span>
                      {l.image ? <img src={l.image} crossOrigin="anonymous" alt="item" /> : <MathText>{l.label}</MathText>}
                    </div>
                  )}
                </td>
                <td className="sp-match-cell sp-match-divider-cell">
                  {/* — */}
                </td>
                <td className="sp-match-cell">
                  {r && (
                    <div className="sp-match-box right">
                      <span className="sp-match-letter">{i + 1}</span>
                      <MathText>{r.label}</MathText>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PrintPreview({ totalMarks }) {
  const { state } = usePaper();
  const { header, questions } = state;

  return (
    <div id="print-area" className="sp-print-area">
      <div className="sp-school-head">
        {header.logo && (
          <div className="sp-school-logo">
            <img src={header.logo} crossOrigin="anonymous" alt="School logo" />
          </div>
        )}
        <div className="sp-school-name">{header.schoolName}</div>
        <div className="sp-exam-title">
          {header.exam} Examination
          {header.academicYear && <span className="sp-exam-session">{header.academicYear}</span>}
        </div>
        <div className="sp-exam-meta">
          <span>
            <strong>Class:</strong> {header.className}
          </span>
          <span>
            <strong>Subject:</strong> {header.subject}
          </span>
          <span>
            <strong>Duration:</strong> {header.duration}
          </span>
        </div>
        <div className="sp-exam-meta">
          <span>
            <strong>Date:</strong> {formatDate(header.date)}
          </span>
          <span>
            <strong>Total Marks:</strong> {totalMarks}
          </span>
        </div>
        <div className="sp-name-roll">
          <div>
            <strong>Name:</strong> <span className="sp-blank-line sp-w40" />
          </div>
          <div>
            <strong>Roll No:</strong> <span className="sp-blank-line sp-w20" />
          </div>
        </div>
        {header.instructions && (
          <div className="sp-instructions">
            <strong>Instructions:</strong>
            <ol className="sp-instructions-list">
              {header.instructions
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ol>
          </div>
        )}
      </div>

      <div className="sp-preview-question-list">
        {questions.length === 0 && (
          <div className="sp-preview-empty-questions">
            <div className="sp-preview-empty-emoji">📝</div>
            No questions yet. Add some from the editor!
          </div>
        )}

        {questions.map((question) => (
          <div key={question.id} className="sp-question pdf-question-block">
            <div className="sp-q-row">
              <span className="sp-q-no">Q{question.number}.</span>

              <span className="sp-q-text">
                {question.text ? (
                  <MathText>{question.text}</MathText>
                ) : question.type === QUESTION_TYPES.TRUE_FALSE ? (
                  <span className="sp-q-text-heading">{question.questionTitle || "State whether True or False"}</span>
                ) : question.type === QUESTION_TYPES.FILL_BLANK ? (
                  <span className="sp-q-text-heading">{question.questionTitle || "Fill in the blanks"}</span>
                ) : (
                  <em className="sp-preview-placeholder-italics">Question text...</em>
                )}
              </span>

              <span className="sp-q-marks">
                [{question.marks} {Number(question.marks) === 1 ? "mark" : "marks"}]
              </span>
            </div>

            {question.type === QUESTION_TYPES.MATCH && <MatchPreview question={question} />}

            {question.type === QUESTION_TYPES.FILL_BLANK && <FillBlankPreview question={question} />}

            {question.type === QUESTION_TYPES.TRUE_FALSE && <TrueFalsePreview question={question} />}

            {question.type === QUESTION_TYPES.MCQ && <McqPreview question={question} />}

            {question.type === QUESTION_TYPES.IMAGE_MCQ && <ImageMcqPreview question={question} />}

            {question.type === QUESTION_TYPES.LABEL && (
              <LabelPreview
                image={question.image}
                partCount={question.partCount ?? 4}
                markers={question.labelMarkers}
              />
            )}

            {question.type === QUESTION_TYPES.WRITING && (
              <WritingLines count={question.lines || 4} fragments={question.fragments || 0} sampleText={question.sampleText} />
            )}

            {question.type === QUESTION_TYPES.NORMAL && (
              <div className="sp-answer-lines">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="sp-answer-line" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sp-footer">
        <div className="sp-footer-block">
          <div className="lbl">Teacher's Signature:</div>
          <span className="sp-blank-line sp-w40" />
          <div className="sp-footer-meta-text">{header.teacherName}</div>
        </div>
        <div className="sp-footer-central">
          {/* <div className="sp-footer-star">🌟</div> */}
          <div>All the best !!</div>
        </div>
        <div className="sp-footer-block sp-footer-right">
          <div className="lbl">Marks Obtained:</div>
          <span className="sp-blank-line sp-w24" />
          <div className="sp-footer-meta-text">Out of {totalMarks}</div>
        </div>
      </div>
    </div>
  );
}