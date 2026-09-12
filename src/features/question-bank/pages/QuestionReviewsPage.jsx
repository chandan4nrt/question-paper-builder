import { Link, useParams } from 'react-router-dom';
import { useQuestionReviews } from '../hooks/useQuestions';

const ACTION_CLASS = {
  SUBMITTED: 'status-pending_review',
  APPROVED: 'status-approved',
  REJECTED: 'status-rejected',
  EDITED: 'status-draft',
};

export function QuestionReviewsPage() {
  const { id } = useParams();
  const questionId = Number(id);
  const { data: reviews, isLoading } = useQuestionReviews(questionId);

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1>Review History</h1>
        </div>
        <Link to={`/staff/question-bank/${questionId}`}>&larr; Back to question</Link>
      </div>
      {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
      {reviews && reviews.length === 0 && <div className="empty-state">No review activity yet.</div>}
      {reviews && reviews.length > 0 && (
        <div className="card">
          {reviews.map((r) => (
            <div key={r.id} style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 0' }}>
              <div>
                <span className={`badge ${ACTION_CLASS[r.action] ?? 'status-draft'}`}>{r.action}</span>{' '}
                <span className="muted text-sm">by {r.reviewerName} — {new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.remarks && <p style={{ margin: '0.35rem 0 0' }}>{r.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}