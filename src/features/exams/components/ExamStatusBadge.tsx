import type { ExamStatus } from '../types/exam';

const STATUS_CLASS: Record<ExamStatus, string> = {
  DRAFT: 'status-draft',
  FINALIZED: 'status-finalized',
  ARCHIVED: 'status-archived',
};

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{status}</span>;
}