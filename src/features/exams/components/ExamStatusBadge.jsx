const STATUS_CLASS = {
  DRAFT: 'status-draft',
  FINALIZED: 'status-finalized',
  ARCHIVED: 'status-archived',
};

export function ExamStatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{status}</span>;
}