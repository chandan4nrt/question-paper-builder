import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useApproveQuestion,
  useArchiveQuestion,
  useQuestion,
  useRejectQuestion,
  useSubmitForReview,
} from '../hooks/useQuestions';
import { StatusBadge } from '../components/Badges';
import { extractErrorMessage } from '../../../services/api';
import { getStoredProfile } from '../../auth/hooks/useAuth';

export function QuestionDetailPage() {
  const { id } = useParams();
  const questionId = Number(id);
  const { data: question, isLoading } = useQuestion(questionId);
  const submitMutation = useSubmitForReview(questionId);
  const approveMutation = useApproveQuestion(questionId);
  const rejectMutation = useRejectQuestion(questionId);
  const archiveMutation = useArchiveQuestion(questionId);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const profile = getStoredProfile();
  const canReview = profile?.role === 'ADMIN' || profile?.role === 'REVIEWER';
  const canArchive = profile?.role === 'ADMIN';

  if (isLoading || !question) return <div className="loading"><span className="spinner" /> Loading…</div>;

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1>Question #{question.id}</h1>
          <p>
            <strong>{question.className} · {question.subjectName} · {question.chapterName} · {question.topicName}</strong>
          </p>
        </div>
        <StatusBadge status={question.status} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span className="kbd-chip">{question.questionType.replace('_', ' ')}</span>
        <span className="kbd-chip">{question.difficulty}</span>
        <span className="kbd-chip">{question.language}</span>
        <span className="kbd-chip">{question.marks} mark(s)</span>
      </div>

      <div className="card" style={{ whiteSpace: 'pre-wrap' }}>
        {question.questionText}
      </div>

      {question.options.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <strong>Options</strong>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 0' }}>
            {question.options.map((o) => (
              <li key={o.optionText} style={{ fontWeight: o.isCorrect ? 700 : 400 }}>
                {o.optionText} {o.isCorrect && '✓'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(question.expectedAnswer || question.explanation) && (
        <div className="card" style={{ marginTop: '1rem' }}>
          {question.expectedAnswer && <p style={{ margin: 0 }}><strong>Expected Answer:</strong> {question.expectedAnswer}</p>}
          {question.explanation && <p style={{ margin: '0.5rem 0 0' }}><strong>Explanation:</strong> {question.explanation}</p>}
        </div>
      )}

      <h2>Question Usage History</h2>
      {question.usage.history.length === 0 ? (
        <div className="empty-state">🟢 Never used in any exam yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Academic Year</th>
              <th>Exam</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {question.usage.history.map((h) => (
              <tr key={h.examId}>
                <td>{h.academicYearLabel}</td>
                <td>{h.examName}</td>
                <td>{h.examType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <Link to={`/staff/question-bank/${question.id}/edit`}><button className="btn-secondary">Edit</button></Link>
        <Link to={`/staff/question-bank/${question.id}/reviews`}><button className="btn-secondary">Review History</button></Link>

        {question.status === 'DRAFT' && (
          <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting…' : 'Submit for Review'}
          </button>
        )}

        {canReview && question.status === 'PENDING_REVIEW' && (
          <>
            <button onClick={() => approveMutation.mutate(undefined)} disabled={approveMutation.isPending}>
              Approve
            </button>
            <input
              placeholder="Rejection remarks"
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
            />
            <button
              className="btn-danger"
              onClick={() => rejectMutation.mutate(rejectRemarks)}
              disabled={rejectMutation.isPending || !rejectRemarks.trim()}
            >
              Reject
            </button>
          </>
        )}

        {canArchive && question.status !== 'ARCHIVED' && (
          <button className="btn-warning" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
            Archive
          </button>
        )}
      </div>

      {(submitMutation.isError || approveMutation.isError || rejectMutation.isError || archiveMutation.isError) && (
        <div className="alert alert-error">
          {extractErrorMessage(
            submitMutation.error ?? approveMutation.error ?? rejectMutation.error ?? archiveMutation.error
          )}
        </div>
      )}
    </div>
  );
}