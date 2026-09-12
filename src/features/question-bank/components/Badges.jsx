const STATUS_CLASS = {
  DRAFT: 'status-draft',
  PENDING_REVIEW: 'status-pending_review',
  APPROVED: 'status-approved',
  REJECTED: 'status-rejected',
  ARCHIVED: 'status-archived',
};

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{status.replace('_', ' ')}</span>;
}

// Emoji indicators match the spec's Question Bank list display (Section 18):
// never used, used before, or previous-year with the exam name shown.
export function UsageBadge({ usage }) {
  if (usage.status === 'NEVER_USED') {
    return <span className="badge status-approved">Never Used</span>;
  }
  if (usage.status === 'USED_PREVIOUS_YEAR') {
    return (
      <span>
        <span className="badge status-rejected">Previous Year</span>
        {usage.previousYearHighlight && (
          <>
            <br />
            <small className="muted">{usage.previousYearHighlight}</small>
          </>
        )}
      </span>
    );
  }
  return <span className="badge status-pending_review">Used Before</span>;
}