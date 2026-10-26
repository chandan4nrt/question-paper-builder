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
    <div className="page question-reviews-page">
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
            <div key={r.id} className="review-item">
              <div>
                <span className={`badge ${ACTION_CLASS[r.action] ?? 'status-draft'}`}>{r.action}</span>{' '}
                <span className="muted text-sm">by {r.reviewerName} — {new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.remarks && <p className="review-remarks">{r.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}