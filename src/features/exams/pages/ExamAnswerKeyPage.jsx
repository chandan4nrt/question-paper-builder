import { Link, useParams } from 'react-router-dom';
import { useAnswerKey } from '../hooks/useExams';
import { answerKeyPdfUrl } from '../api/examsApi';

export function ExamAnswerKeyPage() {
  const { id } = useParams();
  const examId = Number(id);
  const { data: answerKey, isLoading, isError } = useAnswerKey(examId);

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="button-row" style={{ justifyContent: 'space-between' }}>
        <Link to={`/staff/exams/${examId}`}>&larr; Back</Link>
        {answerKey && (
          <a href={answerKeyPdfUrl(examId)} target="_blank" rel="noreferrer">
            <button>Download PDF</button>
          </a>
        )}
      </div>

      <div className="page-header">
        <h1>Answer Key</h1>
      </div>
      {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
      {isError && <div className="alert alert-error">You may not have permission to view this.</div>}

      {answerKey && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{answerKey.examName}</h3>
          <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {answerKey.entries.map((entry) => (
              <li key={entry.questionNumber} style={{ marginBottom: '0.5rem' }}>
                {entry.answer}
                {entry.evaluationGuidance && (
                  <div className="muted text-sm">Guidance: {entry.evaluationGuidance}</div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}