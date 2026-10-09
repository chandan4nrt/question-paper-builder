import { isPublishLink } from './api/questionPapersApi';

const STUDENT_APP_URL = (
  import.meta.env.VITE_PAPER_STUDENT_APP_URL || 'http://192.168.10.23:4000'
).replace(/\/+$/, '');

export function buildStudentLink(value) {
  if (!isPublishLink(value)) return null;
  const raw = String(value).trim();
  if (/^https?:\/\//.test(raw)) return raw;
  if (raw.startsWith('/')) return `${STUDENT_APP_URL}${raw}`;
  return `${STUDENT_APP_URL}/paper/${raw}`;
}
