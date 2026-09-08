import { usePaper } from "../context/PaperContext";
import { formatDate } from "../helpers";
import { WritingLines } from "./WritingQuestion";
import { LabelPreview } from "./LabelQuestion";
import { QUESTION_TYPES, type Question } from "../types";

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getOptionLetter(index: number) {
  let value = index + 1;
  let letters = "";
  while (value > 0) {
    value -= 1;
    letters = String.fromCharCode(65 + (value % 26)) + letters;
    value = Math.floor(value / 26);
  }
  return letters || OPTION_LETTERS[0];
}

function McqPreview({ question }: { question: Question }) {
  const options = question.options ?? [];
  return (
    <div className="sp-mcq-preview">
      {options.length === 0 && (
        <div style={{ color: "#94a3b8", fontStyle: "italic" }}>Add options in the editor...</div>
      )}
      <div className="sp-mcq-grid">
        {options.map((opt, i) => (
          <div key={opt.id} className="sp-mcq-preview-row">
            <span className="sp-match-letter sp-mcq-letter">{getOptionLetter(i)}</span>
            {/* <span className="sp-mcq-answer-dot" /> */}
            <span className="sp-mcq-preview-label">{opt.label || <em style={{ color: "#a3a3a3" }}>Option...</em>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageMcqPreview({ question }: { question: Question }) {
  const options = question.options ?? [];
  return (
    <div className="sp-image-mcq-preview">
      {options.length === 0 && (
        <div style={{ color: "#94a3b8", fontStyle: "italic" }}>Add picture options in the editor...</div>
      )}
      <div className="sp-image-mcq-grid">
        {options.map((opt, i) => (
          <div key={opt.id} className="sp-image-mcq-option">
            <div className="sp-image-mcq-card">
              <span className="sp-image-mcq-circle">{getOptionLetter(i)}</span>
              {opt.image ? (
                <img src={opt.image} alt={opt.label || "option"} />
              ) : (
                <div className="sp-image-mcq-placeholder">
                  {opt.label || <em style={{ color: "#cbd5e1" }}>Option</em>}
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
            {!opt.writingLines && (
              <span className="sp-match-label sp-image-mcq-preview-label">
                {opt.label || <em>Option</em>}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FillBlankPreview({ question }: { question: Question }) {
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
                  {part}
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

function TrueFalsePreview({ question }: { question: Question }) {
  const items = question.items && question.items.length > 0 ? question.items : [""];

  return (
    <div className="sp-tf-preview">
      {items.map((item, index) => (
        <div key={index} className="sp-tf-row">
          <span className="sp-match-letter">{index + 1}.</span>
          <span className="sp-tf-statement">{item || <em style={{ color: "#a3a3a3" }}>Statement...</em>}</span>
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

function MatchPreview({ question }: { question: Question }) {
  const left = question.leftItems ?? [];
  const right = question.rightItems ?? [];
  const maxLen = Math.max(left.length, right.length);

  return (
    <div className="sp-match-preview">
      <table className="sp-match-table">
        <thead>
          <tr>
            <th style={{ width: "50%" }}>Column A</th>
            <th style={{ width: 32 }} />
            <th style={{ width: "50%" }}>Column B</th>
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
                      {l.image ? <img src={l.image} alt="item" /> : <span>{l.label}</span>}
                    </div>
                  )}
                </td>
                <td className="sp-match-cell" style={{ textAlign: "center", color: "#cbd5e1" }}>
                  {/* — */}
                </td>
                <td className="sp-match-cell">
                  {r && (
                    <div className="sp-match-box right">
                      <span className="sp-match-letter">{i + 1}</span>
                      <span>{r.label}</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* <div className="sp-answer-key">
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            color: "#94a3b8",
            marginBottom: "0.25rem",
          }}
        >
          Answer:
        </div>
        {left.map((item, i) => (
          <div key={item.id} className="sp-answer-key-row">
            <span className="sp-match-letter">{String.fromCharCode(65 + i)}</span>
            <span className="sp-blank-line sp-w24" />
          </div>
        ))}
      </div> */}
    </div>
  );
}

export function PrintPreview({ totalMarks }: { totalMarks: number }) {
  const { state } = usePaper();
  const { header, questions } = state;

  return (
    <div id="print-area" className="sp-print-area">
      <div className="sp-school-head">
        {header.logo && (
          <div className="sp-school-logo">
            <img src={header.logo} alt="School logo" />
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

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {questions.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
            No questions yet. Add some from the editor!
          </div>
        )}

        {questions.map((question) => (
          <div key={question.id} className="sp-question pdf-question-block">
            <div className="sp-q-row">
              <span className="sp-q-no">Q{question.number}.</span>

              <span className="sp-q-text">
                {question.text ||
                  (question.type === QUESTION_TYPES.TRUE_FALSE ? (
                    <span className="sp-q-text-heading">State whether True or False</span>
                  ) : question.type === QUESTION_TYPES.FILL_BLANK ? (
                    <span className="sp-q-text-heading">Fill in the blanks</span>
                  ) : (
                    <em style={{ color: "#a3a3a3" }}>Question text...</em>
                  ))}
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
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{header.teacherName}</div>
        </div>
        <div className="sp-footer-central">
          {/* <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>🌟</div> */}
          <div>All the best !!</div>
        </div>
        <div className="sp-footer-block" style={{ textAlign: "right" }}>
          <div className="lbl">Marks Obtained:</div>
          <span className="sp-blank-line sp-w24" />
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>Out of {totalMarks}</div>
        </div>
      </div>
    </div>
  );
}
